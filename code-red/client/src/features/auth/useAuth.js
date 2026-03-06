import { useDispatch, useSelector } from "react-redux";
import {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from "./auth.api";
import { baseApi } from "../../app/api/baseApi";
import {
  logoutLocal,
  setAuthError,
  setAuthLoading,
  setCredentials,
} from "./auth.slice";

export default function useAuth() {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth,
  );

  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();

  const resetApiCache = () => {
    dispatch(baseApi.util.resetApiState());
  };

  const login = async (payload) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const response = await loginMutation(payload).unwrap();
      resetApiCache();
      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.accessToken,
        }),
      );
      return response;
    } catch (errorResponse) {
      dispatch(setAuthError(errorResponse?.data?.message || "Login failed"));
      throw errorResponse;
    }
  };

  const register = async (payload) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const response = await registerMutation(payload).unwrap();
      resetApiCache();
      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.accessToken,
        }),
      );
      return response;
    } catch (errorResponse) {
      dispatch(
        setAuthError(errorResponse?.data?.message || "Registration failed"),
      );
      throw errorResponse;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Network errors should not block local logout.
    }
    resetApiCache();
    dispatch(logoutLocal());
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  };
}
