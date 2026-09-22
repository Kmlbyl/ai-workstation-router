function intEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) ? value : fallback;
}

export function loadConfig() {
  const cloudBaseUrl =
    process.env.CLOUD_BASE_URL ||
    process.env.OPENROUTER_BASE_URL ||
    "https://api.openai.com/v1";

  const cloudApiKey =
    process.env.CLOUD_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    "";

  return {
    host: process.env.HOST || "127.0.0.1",
    port: intEnv("PORT", 11436),
    timeoutMs: intEnv("REQUEST_TIMEOUT_MS", 120000),

    local: {
      name: "local",
      baseUrl: process.env.LOCAL_BASE_URL || "http://127.0.0.1:11434/v1",
      apiKey: process.env.LOCAL_API_KEY || "",
      model: process.env.LOCAL_MODEL || "qwen3:14b",
    },

    luna: {
      name: "luna",
      baseUrl: cloudBaseUrl,
      apiKey: cloudApiKey,
      model:
        process.env.LUNA_MODEL ||
        process.env.CHEAP_MODEL ||
        "gpt-5.6-luna",
    },

    sol: {
      name: "sol",
      baseUrl: cloudBaseUrl,
      apiKey: cloudApiKey,
      model:
        process.env.SOL_MODEL ||
        process.env.POWERFUL_MODEL ||
        "gpt-5.6-sol",
    },

    openRouterSiteUrl: process.env.OPENROUTER_SITE_URL || "",
    openRouterAppName:
      process.env.OPENROUTER_APP_NAME || "AI Workstation Router",

    fallbackOrder: (
      process.env.ROUTER_FALLBACK_ORDER || "local,luna,sol"
    )
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),

    mediumChars: intEnv("ROUTER_MEDIUM_CHARS", 2500),
    complexChars: intEnv("ROUTER_COMPLEX_CHARS", 7000),
  };
}
