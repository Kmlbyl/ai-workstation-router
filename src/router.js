const COMPLEX_KEYWORDS = [
  "architecture",
  "security review",
  "threat model",
  "migration",
  "distributed system",
  "concurrency",
  "race condition",
  "large refactor",
  "production incident",
  "cryptography",
  "database migration",
];

const MEDIUM_KEYWORDS = [
  "debug",
  "refactor",
  "test suite",
  "integration",
  "api integration",
  "performance",
  "typescript",
  "docker",
  "ci/cd",
];

const TIER_ALIASES = {
  local: "local",
  luna: "luna",
  sol: "sol",
  cheap: "luna",
  powerful: "sol",
};

function normalizeTier(value) {
  return TIER_ALIASES[value] || "";
}

function flattenMessages(messages = []) {
  return messages
    .map((message) => {
      if (typeof message?.content === "string") return message.content;
      return JSON.stringify(message?.content ?? "");
    })
    .join("\n")
    .toLowerCase();
}

export function chooseTier(body, headers, config) {
  const explicitTier = normalizeTier(headers["x-ai-router-tier"]);

  if (explicitTier) {
    return { tier: explicitTier, reason: "explicit-header" };
  }

  const requestedModel = body?.model;
  const explicitModels = {
    "router/local": "local",
    "router/luna": "luna",
    "router/sol": "sol",
    "router/cheap": "luna",
    "router/powerful": "sol",
  };

  if (explicitModels[requestedModel]) {
    return {
      tier: explicitModels[requestedModel],
      reason: "explicit-model",
    };
  }

  const text = flattenMessages(body?.messages);
  const length = text.length;

  if (
    length >= config.complexChars ||
    COMPLEX_KEYWORDS.some((keyword) => text.includes(keyword))
  ) {
    return { tier: "sol", reason: "complexity-heuristic" };
  }

  if (
    length >= config.mediumChars ||
    MEDIUM_KEYWORDS.some((keyword) => text.includes(keyword))
  ) {
    return { tier: "luna", reason: "complexity-heuristic" };
  }

  return { tier: "local", reason: "default-local" };
}

export function buildFallbackSequence(primary, config) {
  const normalized = config.fallbackOrder
    .map(normalizeTier)
    .filter(Boolean);

  const unique = [...new Set(normalized)];
  return [primary, ...unique.filter((tier) => tier !== primary)];
}
