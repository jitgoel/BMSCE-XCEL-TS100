import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLazyMeQuery, useRefreshTokenMutation } from "./auth.api";
import {
  logoutLocal,
  setAuthBootstrapComplete,
  setAuthLoading,
  setCredentials,
  setToken,
} from "./auth.slice";

export default function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const [refreshToken] = useRefreshTokenMutation();
  const [fetchMe] = useLazyMeQuery();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    const onForcedLogout = () => {
      dispatch(logoutLocal());
    };

    window.addEventListener("auth:logout", onForcedLogout);
    return () => {
      window.removeEventListener("auth:logout", onForcedLogout);
    };
  }, [dispatch]);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;
    dispatch(setAuthBootstrapComplete(false));

    if (!token) {
      dispatch(setAuthLoading(false));
      dispatch(setAuthBootstrapComplete(true));
      return;
    }

    const validateSession = async () => {
      dispatch(setAuthLoading(true));
      try {
        const refreshResponse = await refreshToken().unwrap();
        const accessToken = refreshResponse?.accessToken;

        if (!accessToken) {
          throw new Error("Missing access token from refresh response");
        }

        dispatch(setToken(accessToken));

        let user = refreshResponse?.user || null;

        try {
          const meResponse = await fetchMe().unwrap();
          user = meResponse?.user || user;
        } catch {
          // Fallback to refresh payload user if /me is temporarily unavailable.
        }

        if (!user) {
          throw new Error("Missing user payload after bootstrap validation");
        }

        dispatch(
          setCredentials({
            user,
            accessToken,
          }),
        );
      } catch {
        dispatch(logoutLocal());
      } finally {
        dispatch(setAuthLoading(false));
        dispatch(setAuthBootstrapComplete(true));
      }
    };

    validateSession();
  }, [dispatch, fetchMe, refreshToken, token]);

  return children;
}
