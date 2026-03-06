import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getCurrentUser,
  loginUser,
  refreshAccessToken,
  registerUser,
} from "./auth.service.js";

const LOCAL_ORIGIN_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const isLocalClientOrigin = (origin) => {
  try {
    const parsedUrl = new URL(origin);
    return LOCAL_ORIGIN_HOSTS.has(parsedUrl.hostname);
  } catch {
    return true;
  }
};

const inferCrossSiteCookieMode = () => {
  if (typeof env.AUTH_COOKIE_CROSS_SITE === "boolean") {
    return env.AUTH_COOKIE_CROSS_SITE;
  }

  return !isLocalClientOrigin(env.CLIENT_ORIGIN);
};

const crossSiteCookieMode = inferCrossSiteCookieMode();
const computedSameSite =
  env.AUTH_COOKIE_SAME_SITE || (crossSiteCookieMode ? "none" : "lax");

let computedSecure =
  typeof env.AUTH_COOKIE_SECURE === "boolean"
    ? env.AUTH_COOKIE_SECURE
    : crossSiteCookieMode || env.NODE_ENV === "production";

if (computedSameSite === "none") {
  computedSecure = true;
}

const refreshCookieOptions = {
  httpOnly: true,
  secure: computedSecure,
  sameSite: computedSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const attachRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, refreshCookieOptions);
};

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await registerUser(req.body);
  attachRefreshCookie(res, refreshToken);

  res.status(201).json({
    user,
    accessToken,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body);
  attachRefreshCookie(res, refreshToken);

  res.status(200).json({
    user,
    accessToken,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    return res.status(401).json({
      message: "Unauthorized: missing refresh token cookie",
    });
  }

  const result = await refreshAccessToken(incomingRefreshToken);
  attachRefreshCookie(res, result.refreshToken);

  res.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.userId || req.user.id);
  res.status(200).json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", refreshCookieOptions);
  res.status(200).json({ message: "Logged out" });
});
