import OpenAI from "openai";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

// Grok API uses OpenAI SDK with custom base_url
const grokClient = env.GROK_API_KEY
  ? new OpenAI({
      apiKey: env.GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    })
  : null;

const VALID_LEVELS = ["critical", "high", "medium", "low"];

const normalizeLevel = (value, fallback = "medium") => {
  const normalized = String(value || "")
    .toLowerCase()
    .trim();
  return VALID_LEVELS.includes(normalized) ? normalized : fallback;
};

const safeJsonParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export async function triageBug(title, description) {
  if (!grokClient) {
    return {
      severity: "medium",
      priority: "medium",
      suggestedFix: "",
      labels: [],
    };
  }

  const prompt = [
    "You are an expert QA triage assistant.",
    "Return strict JSON only with this schema:",
    '{"severity":"critical|high|medium|low","priority":"critical|high|medium|low","suggestedFix":"string","labels":["string"]}',
    `Title: ${title}`,
    `Description: ${description}`,
  ].join("\n");

  try {
    const completion = await grokClient.chat.completions.create({
      model: "grok-2",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You output only JSON and never extra text.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(content);

    return {
      severity: normalizeLevel(parsed.severity, "medium"),
      priority: normalizeLevel(parsed.priority, "medium"),
      suggestedFix:
        typeof parsed.suggestedFix === "string"
          ? parsed.suggestedFix.trim()
          : "",
      labels: Array.isArray(parsed.labels)
        ? parsed.labels
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };
  } catch (error) {
    logger.warn("Grok triage call failed; using defaults", error.message);
    return {
      severity: "medium",
      priority: "medium",
      suggestedFix: "",
      labels: [],
    };
  }
}

// Grok API doesn't provide embeddings yet
// Fallback: Simple text-based similarity using word overlap
export async function getEmbedding(text) {
  if (!text?.trim()) {
    return [];
  }

  // Return text as a simple token-based representation
  // This is used for similarity matching, not vectorization
  // Format: hash of the text for deduplication
  try {
    const tokens = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Create a simple hash-like representation
    const hash = tokens.reduce((acc, token) => {
      return acc + token.charCodeAt(0);
    }, 0);

    // Return as array for compatibility with existing code
    return [hash, tokens.length];
  } catch (error) {
    logger.warn(
      "Simple embedding generation failed; duplicate detection will skip",
      error.message,
    );
    return [];
  }
}
