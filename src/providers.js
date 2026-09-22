function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function providerConfigured(provider) {
  if (!provider?.model || !provider?.baseUrl) return false;
  if (provider.name === "local") return true;
  return Boolean(provider.apiKey);
}

export async function callChatCompletion(provider, body, config, signal) {
  if (!providerConfigured(provider)) {
    throw new Error(`Provider tier "${provider.name}" is not configured.`);
  }

  const headers = { "content-type": "application/json" };

  if (provider.apiKey) {
    headers.authorization = `Bearer ${provider.apiKey}`;
  }

  if (provider.name !== "local") {
    if (config.openRouterSiteUrl) headers["HTTP-Referer"] = config.openRouterSiteUrl;
    if (config.openRouterAppName) headers["X-Title"] = config.openRouterAppName;
  }

  const outbound = {
    ...body,
    model: provider.model,
    stream: false,
  };

  const response = await fetch(joinUrl(provider.baseUrl, "/chat/completions"), {
    method: "POST",
    headers,
    body: JSON.stringify(outbound),
    signal,
  });

  const text = await response.text();
  let parsed;

  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { error: { message: text || `Provider returned HTTP ${response.status}` } };
  }

  if (!response.ok) {
    throw new Error(
      parsed?.error?.message ||
      parsed?.message ||
      `Provider "${provider.name}" returned HTTP ${response.status}`,
    );
  }

  return parsed;
}
