import axios from "axios";

const STORAGE_KEY = "devcollab_auth";

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000/api";
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  return "http://localhost:5000/api";
};

const baseURL = resolveApiBaseUrl();
let authSyncModulesPromise = null;

const readAuthState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const writeAuthState = (nextState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
};

const getAuthSyncModules = async () => {
  if (!authSyncModulesPromise) {
    authSyncModulesPromise = Promise.all([
      import("../app/store"),
      import("../features/auth/auth.slice"),
      import("../app/api/baseApi"),
    ]).catch(() => null);
  }

  return authSyncModulesPromise;
};

const syncReduxAuthState = async ({ accessToken, user }) => {
  const modules = await getAuthSyncModules();
  if (!modules) {
    return;
  }

  const [{ store }, authSliceModule] = modules;
  if (!store?.dispatch) {
    return;
  }

  if (user) {
    store.dispatch(
      authSliceModule.setCredentials({
        user,
        accessToken,
      }),
    );
    return;
  }

  store.dispatch(authSliceModule.setToken(accessToken));
};

const syncReduxLogout = async () => {
  const modules = await getAuthSyncModules();
  if (!modules) {
    return;
  }

  const [{ store }, authSliceModule, baseApiModule] = modules;
  if (store?.dispatch) {
    store.dispatch(authSliceModule.logoutLocal());
    store.dispatch(baseApiModule.baseApi.util.resetApiState());
  }
};

const handleCentralLogout = () => {
  localStorage.removeItem(STORAGE_KEY);
  syncReduxLogout();
  window.dispatchEvent(new CustomEvent("auth:logout"));
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const isAuthEndpoint = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/register") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/logout");

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise = null;

apiClient.interceptors.request.use((config) => {
  const authState = readAuthState();
  const token = authState?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const statusCode = error?.response?.status;

    if (
      statusCode !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      if (
        statusCode === 401 &&
        originalRequest.url?.includes("/auth/refresh")
      ) {
        handleCentralLogout();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
      }

      const refreshResponse = await refreshPromise;
      const accessToken = refreshResponse.data?.accessToken;
      const user = refreshResponse.data?.user;

      if (!accessToken) {
        handleCentralLogout();
        return Promise.reject(error);
      }

      const existingAuth = readAuthState();
      const resolvedUser = user || existingAuth?.user || null;

      writeAuthState({
        user: resolvedUser,
        token: accessToken,
        isAuthenticated: Boolean(accessToken && resolvedUser),
      });

      await syncReduxAuthState({
        accessToken,
        user: resolvedUser,
      });

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${accessToken}`,
      };

      return apiClient(originalRequest);
    } catch (refreshError) {
      handleCentralLogout();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);

export default apiClient;
