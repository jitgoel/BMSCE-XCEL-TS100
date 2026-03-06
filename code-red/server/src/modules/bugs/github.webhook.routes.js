import crypto from "crypto";
import { Router } from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { logger } from "../../utils/logger.js";
import { resolveBugFromWebhook } from "./bug.service.js";

const router = Router();
const bugRefRegex = /\b(?:fixes|closes)\s+#([a-fA-F0-9]{24})\b/gi;
let hasWarnedMissingSecret = false;

const normalizeHeaderValue = (headerValue) => {
  if (Array.isArray(headerValue)) {
    return headerValue[0] || "";
  }
  return typeof headerValue === "string" ? headerValue : "";
};

const verifySignature = (rawPayloadBuffer, signatureHeader) => {
  if (!env.GITHUB_WEBHOOK_SECRET) {
    if (env.NODE_ENV === "production") {
      return false;
    }

    if (!hasWarnedMissingSecret) {
      logger.warn(
        "GITHUB_WEBHOOK_SECRET is missing; webhook signature checks are disabled in non-production.",
      );
      hasWarnedMissingSecret = true;
    }

    return true;
  }

  const providedSignature = normalizeHeaderValue(signatureHeader);
  if (!providedSignature) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", env.GITHUB_WEBHOOK_SECRET)
    .update(rawPayloadBuffer)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

const extractBugIds = (message) => {
  const ids = [];
  const normalized = String(message || "");
  let match;

  while ((match = bugRefRegex.exec(normalized)) !== null) {
    ids.push(match[1]);
  }

  bugRefRegex.lastIndex = 0;
  return ids;
};

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const rawPayload = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const signature = req.headers["x-hub-signature-256"];

    if (!verifySignature(rawPayload, signature)) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    let parsedPayload = {};
    if (rawPayload.length > 0) {
      try {
        parsedPayload = JSON.parse(rawPayload.toString("utf8"));
      } catch {
        return res.status(400).json({ message: "Invalid JSON payload" });
      }
    }

    const eventName = normalizeHeaderValue(req.headers["x-github-event"]);
    if (eventName !== "push") {
      return res.status(202).json({ message: "Event ignored", eventName });
    }

    const commits = Array.isArray(parsedPayload?.commits)
      ? parsedPayload.commits
      : [];
    let resolvedBugs = 0;
    const io = req.app.get("io");

    for (const commit of commits) {
      const bugIds = extractBugIds(commit.message);
      for (const bugId of bugIds) {
        const result = await resolveBugFromWebhook({ bugId, commit }, io);
        if (result) {
          resolvedBugs += 1;
        }
      }
    }

    return res.status(200).json({
      processedCommits: commits.length,
      resolvedBugs,
    });
  }),
);

export default router;
