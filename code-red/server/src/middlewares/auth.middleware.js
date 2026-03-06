import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const extractBearerToken = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }
  return authorizationHeader.split(" ")[1];
};

const normalizeRole = (role) => (role === "tester" ? "reporter" : role);

export const protect = (req, res, next) => {
  const token =
    extractBearerToken(req.headers.authorization || "") ||
    req.cookies?.accessToken ||
    req.headers["x-access-token"];

  if (!token) {
    return next(new ApiError(401, "Unauthorized: missing access token"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const userId = decoded.userId || decoded.id;
    req.user = {
      userId,
      id: userId,
      email: decoded.email,
      role: normalizeRole(decoded.role),
      name: decoded.name,
    };
    return next();
  } catch (error) {
    return next(new ApiError(401, "Unauthorized: invalid or expired token"));
  }
};

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "Forbidden: insufficient role permissions"),
      );
    }

    return next();
  };

export const verifyJWT = protect;
