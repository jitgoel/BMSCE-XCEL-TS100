import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import Project from "../modules/projects/project.model.js";
import { logger } from "../utils/logger.js";

const extractSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const queryToken = socket.handshake.query?.token;
  if (queryToken) {
    return queryToken;
  }

  const headerToken = socket.handshake.headers?.authorization;
  if (headerToken?.startsWith("Bearer ")) {
    return headerToken.split(" ")[1];
  }

  return null;
};

export const socketAuthMiddleware = (socket, next) => {
  const token = extractSocketToken(socket);
  if (!token) {
    return next(new Error("Unauthorized socket connection"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return next(new Error("Invalid socket token"));
    }

    socket.user = {
      id: userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (error) {
    return next(new Error("Invalid socket token"));
  }
};

const normalizeProjectId = (projectId) => {
  const normalized = String(projectId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    return "";
  }

  return normalized;
};

const canJoinProjectRoom = async (projectId, socketUser) => {
  if (!projectId || !socketUser?.id) {
    return false;
  }

  if (socketUser.role === "admin") {
    return true;
  }

  const project = await Project.exists({
    _id: projectId,
    $or: [{ owner: socketUser.id }, { "members.user": socketUser.id }],
  });

  return Boolean(project);
};

export const registerSocketHandlers = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on("project:join", async (projectId, acknowledge) => {
      const normalizedProjectId = normalizeProjectId(projectId);
      if (!normalizedProjectId) {
        if (typeof acknowledge === "function") {
          acknowledge({ ok: false, message: "Invalid project id" });
        }
        return;
      }

      try {
        const canJoin = await canJoinProjectRoom(normalizedProjectId, socket.user);
        if (!canJoin) {
          if (typeof acknowledge === "function") {
            acknowledge({ ok: false, message: "Forbidden: not a project member" });
          }
          return;
        }

        socket.join(`project:${normalizedProjectId}`);

        if (typeof acknowledge === "function") {
          acknowledge({ ok: true });
        }
      } catch (error) {
        logger.warn("Socket project join denied due to server error", error.message);

        if (typeof acknowledge === "function") {
          acknowledge({ ok: false, message: "Unable to join project room" });
        }
      }
    });

    socket.on("project:leave", (projectId) => {
      const normalizedProjectId = normalizeProjectId(projectId);
      if (normalizedProjectId) {
        socket.leave(`project:${normalizedProjectId}`);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
