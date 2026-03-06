import dotenv from "dotenv";

dotenv.config();

const parseBoolean = (value) => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const parseSameSite = (value) => {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["lax", "strict", "none"].includes(normalized)) {
    return normalized;
  }

  return undefined;
};

const requiredVars = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_ORIGIN",
];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  // Keep startup flexible for local development while surfacing missing values.
  // eslint-disable-next-line no-console
  console.warn(`Missing environment variables: ${missingVars.join(", ")}`);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  // Must exactly match the browser frontend origin (protocol + host + port).
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  // Cookie deployment knobs:
  // - AUTH_COOKIE_CROSS_SITE=true for frontend/backend on different sites.
  // - Cross-site cookies require HTTPS with SameSite=None and Secure=true.
  AUTH_COOKIE_CROSS_SITE: parseBoolean(process.env.AUTH_COOKIE_CROSS_SITE),
  AUTH_COOKIE_SAME_SITE: parseSameSite(process.env.AUTH_COOKIE_SAME_SITE),
  AUTH_COOKIE_SECURE: parseBoolean(process.env.AUTH_COOKIE_SECURE),
  MONGO_URI: process.env.MONGO_URI || "",
  MONGO_URI_FALLBACK:
    process.env.MONGO_URI_FALLBACK ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "mongodb://localhost:27017/devcollab"),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",
  GROK_API_KEY: process.env.GROK_API_KEY || "",
  BUG_SIMILARITY_THRESHOLD: Number(process.env.BUG_SIMILARITY_THRESHOLD || 0.8),
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET || "",
};
