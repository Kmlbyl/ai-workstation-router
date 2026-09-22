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
  const explicitHeader = headers["x-ai-router-tier"];

  if (["local", "cheap", "powerful"].includes(explicitHeader)) {
    return { tier: explicitHeader, reason: "explicit-header" };
  }

  const requestedModel = body?.model;

  if (requestedModel === "router/local") return { tier: "local", reason: "explicit-model" };
  if (requestedModel === "router/cheap") return { tier: "cheap", reason: "explicit-model" };
  if (requestedModel === "router/powerful") return { tier: "powerful", reason: "explicit-model" };

  const text = flattenMessages(body?.messages);
  const length = text.length;

  if (
    length >= config.complexChars ||
    COMPLEX_KEYWORDS.some((keyword) => text.includes(keyword))
  ) {
    return { tier: "powerful", reason: "complexity-heuristic" };
  }

  if (
    length >= config.mediumChars ||
    MEDIUM_KEYWORDS.some((keyword) => text.includes(keyword))
  ) {
    return { tier: "cheap", reason: "complexity-heuristic" };
  }

  return { tier: "local", reason: "default-local" };
}

export function buildFallbackSequence(primary, config) {
  const valid = config.fallbackOrder.filter((tier) =>
    ["local", "cheap", "powerful"].includes(tier),
  );

  return [primary, ...valid.filter((tier) => tier !== primary)];
}
