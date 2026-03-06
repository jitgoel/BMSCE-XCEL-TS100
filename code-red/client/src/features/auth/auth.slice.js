import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "devcollab_auth";

const defaultState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  bootstrapComplete: true,
  error: null,
};

const loadAuthState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    const parsed = JSON.parse(raw);
    const token = parsed.token || null;
    const user = parsed.user || null;
    const hasPersistedToken = Boolean(token);

    return {
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading: hasPersistedToken,
      bootstrapComplete: !hasPersistedToken,
      error: null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return defaultState;
  }
};

const persistAuthState = (state) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
    }),
  );
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadAuthState(),
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken || action.payload.token || null;
      state.isAuthenticated = Boolean(state.user && state.token);
      state.loading = false;
      state.bootstrapComplete = true;
      state.error = null;
      persistAuthState(state);
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = Boolean(state.user && state.token);
      state.loading = false;
      persistAuthState(state);
    },
    setAuthBootstrapComplete: (state, action) => {
      state.bootstrapComplete = Boolean(action.payload);
    },
    setAuthLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    setAuthError: (state, action) => {
      state.error = action.payload || null;
      state.loading = false;
    },
    hydrateAuthState: (state) => {
      const hydrated = loadAuthState();
      state.user = hydrated.user;
      state.token = hydrated.token;
      state.isAuthenticated = hydrated.isAuthenticated;
      state.loading = hydrated.loading;
      state.bootstrapComplete = hydrated.bootstrapComplete;
      state.error = null;
    },
    logoutLocal: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.bootstrapComplete = true;
      state.error = null;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const {
  setCredentials,
  setToken,
  setAuthBootstrapComplete,
  setAuthLoading,
  setAuthError,
  hydrateAuthState,
  logoutLocal,
} = authSlice.actions;
export default authSlice.reducer;
