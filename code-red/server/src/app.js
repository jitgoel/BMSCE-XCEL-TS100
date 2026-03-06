import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import { createRateLimiter } from "./middlewares/rate-limit.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import bugRoutes from "./modules/bugs/bug.routes.js";
import analyticsRoutes from "./modules/bugs/bug.analytics.routes.js";
import githubWebhookRoutes from "./modules/bugs/github.webhook.routes.js";
import userRoutes from "./modules/users/user.router.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");

const configuredOrigins = new Set(
  String(env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const localDevOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  keyPrefix: "auth",
  message: "Too many authentication requests. Please try again later.",
});

const writeRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 200,
  keyPrefix: "write",
  message: "Too many write requests. Please slow down.",
});

const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: "webhook",
  message: "Too many webhook requests. Please retry shortly.",
});

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const applyWriteRateLimit = (req, res, next) => {
  if (!WRITE_METHODS.has(req.method)) {
    return next();
  }

  return writeRateLimiter(req, res, next);
};

const isAllowedOrigin = (origin) => {
  if (configuredOrigins.has(origin)) {
    return true;
  }

  return env.NODE_ENV !== "production" && localDevOriginPattern.test(origin);
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());

app.use(
  "/api/webhooks/github",
  webhookRateLimiter,
  express.raw({ type: "application/json", limit: "5mb" }),
  githubWebhookRoutes,
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "devcollab1-server" });
});

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/projects", applyWriteRateLimit, projectRoutes);
app.use("/api/bugs", applyWriteRateLimit, bugRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", applyWriteRateLimit, userRoutes);

const shouldServeClientBuild =
  env.NODE_ENV === "production" && fs.existsSync(clientDistPath);

if (shouldServeClientBuild) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api|socket\.io).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
