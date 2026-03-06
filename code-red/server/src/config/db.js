import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const collectMongoCandidates = () => {
  const candidates = [
    { key: "primary", uri: env.MONGO_URI },
    { key: "fallback", uri: env.MONGO_URI_FALLBACK },
  ]
    .filter((entry) => Boolean(entry.uri))
    .filter(
      (entry, index, arr) =>
        arr.findIndex((item) => item.uri === entry.uri) === index,
    );

  return candidates;
};

export async function connectDB(maxRetries = 5, retryDelayMs = 3000) {
  if (!env.MONGO_URI && !env.MONGO_URI_FALLBACK) {
    throw new Error("MONGO_URI is required to connect to MongoDB.");
  }

  const mongoCandidates = collectMongoCandidates();
  let lastError = null;

  for (const candidate of mongoCandidates) {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await mongoose.connect(candidate.uri, {
          autoIndex: true,
          serverSelectionTimeoutMS: 10000,
        });

        if (candidate.key === "fallback") {
          logger.warn(
            "MongoDB primary URI unavailable; connected using fallback URI",
          );
        }

        logger.info("MongoDB connected successfully");
        return;
      } catch (error) {
        attempt += 1;
        lastError = error;
        logger.error(
          `MongoDB ${candidate.key} connection failed (attempt ${attempt}/${maxRetries})`,
          error,
        );

        if (attempt < maxRetries) {
          await wait(retryDelayMs);
        }
      }
    }
  }

  throw lastError || new Error("Unable to connect to MongoDB.");
}
