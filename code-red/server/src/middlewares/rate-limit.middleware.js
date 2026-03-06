const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0] || "").trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
};

export const createRateLimiter = ({
  windowMs,
  max,
  keyPrefix,
  message = "Too many requests. Please try again later.",
}) => {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const existingBucket = buckets.get(key);

    if (!existingBucket || now >= existingBucket.resetAt) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    existingBucket.count += 1;

    if (existingBucket.count > max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existingBucket.resetAt - now) / 1000),
      );

      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message });
    }

    return next();
  };
};
