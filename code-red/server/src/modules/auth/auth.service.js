import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../users/user.model.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

const ACCESS_TOKEN_EXPIRES_IN = env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_EXPIRES_IN = env.REFRESH_TOKEN_TTL || "7d";
const PUBLIC_REGISTRATION_ROLES = ["reporter", "developer"];

const normalizeRole = (role) => (role === "tester" ? "reporter" : role);

const createTokenPayload = (user) => ({
  userId: user._id.toString(),
  id: user._id.toString(),
  email: user.email,
  role: normalizeRole(user.role),
  name: user.name,
});

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  avatar: user.avatar,
  createdAt: user.createdAt,
});

export async function generateTokens(userId) {
  const user = await User.findById(userId).select("name email role");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = jwt.sign(
    createTokenPayload(user),
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  );

  const refreshToken = jwt.sign(
    { userId: user._id.toString(), id: user._id.toString() },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    },
  );

  return { accessToken, refreshToken };
}

export async function register(
  name,
  email,
  password,
  role = "reporter",
  avatar = "",
) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "Email is already in use");
  }

  // Public registration cannot assign privileged roles like admin.
  const requestedRole = normalizeRole(role);
  const safeRole = PUBLIC_REGISTRATION_ROLES.includes(requestedRole)
    ? requestedRole
    : "reporter";

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: safeRole,
    avatar,
  });

  const { accessToken, refreshToken } = await generateTokens(user._id);
  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);
  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const userId = decoded.userId || decoded.id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "User not found for refresh token");
  }

  const nextTokens = await generateTokens(user._id);

  return {
    accessToken: nextTokens.accessToken,
    refreshToken: nextTokens.refreshToken,
    user: sanitizeUser(user),
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
}

export async function registerUser({ name, email, password, role, avatar }) {
  return register(name, email, password, role, avatar);
}

export async function loginUser({ email, password }) {
  return login(email, password);
}
