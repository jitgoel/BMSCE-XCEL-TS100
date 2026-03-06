import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { registerSocketHandlers } from "./src/middlewares/socket.middleware.js";
import { logger } from "./src/utils/logger.js";

const httpServer = http.createServer(app);

const configuredOrigins = new Set(
  String(env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const localDevOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

const isAllowedOrigin = (origin) => {
  if (configuredOrigins.has(origin)) {
    return true;
  }

  return env.NODE_ENV !== "production" && localDevOriginPattern.test(origin);
};

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Socket CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  },
});

app.set("io", io);
registerSocketHandlers(io);

async function bootstrap() {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Fatal server startup error", error);
  process.exit(1);
});
