import http from "node:http";
import { loadConfig } from "./config.js";
import {
  chooseTier,
  buildFallbackSequence,
  explainDecision,
} from "./router.js";
import {
  callChatCompletion,
  providerConfigured,
} from "./providers.js";

const config = loadConfig();

const providers = {
  local: config.local,
  luna: config.luna,
  sol: config.sol,
};

const stats = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  chatRequests: 0,
  routed: { local: 0, luna: 0, sol: 0 },
  providerFailures: { local: 0, luna: 0, sol: 0 },
};

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);

  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...extraHeaders,
  });

  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  const maxBytes = 2 * 1024 * 1024;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new Error("Request body too large.");
    }
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function virtualModels() {
  return [
    { id: "auto", object: "model", owned_by: "ai-workstation-router" },
    { id: "router/local", object: "model", owned_by: "ai-workstation-router" },
    { id: "router/luna", object: "model", owned_by: "ai-workstation-router" },
    { id: "router/sol", object: "model", owned_by: "ai-workstation-router" },
    { id: "router/cheap", object: "model", owned_by: "ai-workstation-router" },
    { id: "router/powerful", object: "model", owned_by: "ai-workstation-router" },
  ];
}

const server = http.createServer(async (req, res) => {
  stats.totalRequests += 1;

  try {
    const url = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`,
    );

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, {
        ok: true,
        service: "ai-workstation-router",
        version: "0.1.0",
        defaultRoute: "local -> luna -> sol",
        providers: Object.fromEntries(
          Object.entries(providers).map(([tier, provider]) => [
            tier,
            {
              configured: providerConfigured(provider),
              baseUrl: provider.baseUrl,
              model: provider.model || null,
            },
          ]),
        ),
      });
    }

    if (req.method === "GET" && url.pathname === "/v1/models") {
      return sendJson(res, 200, {
        object: "list",
        data: virtualModels(),
      });
    }

    if (req.method === "GET" && url.pathname === "/router/stats") {
      return sendJson(res, 200, stats);
    }

    if (req.method === "POST" && url.pathname === "/router/decision") {
      const body = await readJson(req);

      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return sendJson(res, 400, {
          error: {
            message: "`messages` must be a non-empty array.",
            type: "invalid_request_error",
          },
        });
      }

      return sendJson(
        res,
        200,
        explainDecision(body, req.headers, config),
      );
    }

    if (
      req.method === "POST" &&
      url.pathname === "/v1/chat/completions"
    ) {
      stats.chatRequests += 1;
      const body = await readJson(req);

      if (body.stream === true) {
        return sendJson(res, 400, {
          error: {
            message:
              "Streaming is not supported in v0.1. Set stream=false.",
            type: "unsupported_feature",
          },
        });
      }

      if (
        !Array.isArray(body.messages) ||
        body.messages.length === 0
      ) {
        return sendJson(res, 400, {
          error: {
            message: "`messages` must be a non-empty array.",
            type: "invalid_request_error",
          },
        });
      }

      const decision = chooseTier(body, req.headers, config);
      const sequence = buildFallbackSequence(
        decision.tier,
        config,
      );
      const attempts = [];

      for (const tier of sequence) {
        const provider = providers[tier];

        if (!providerConfigured(provider)) {
          attempts.push({
            tier,
            status: "skipped",
            reason: "not-configured",
          });
          continue;
        }

        const controller = new AbortController();
        const timer = setTimeout(
          () => controller.abort(),
          config.timeoutMs,
        );

        try {
          const result = await callChatCompletion(
            provider,
            body,
            config,
            controller.signal,
          );

          clearTimeout(timer);
          stats.routed[tier] += 1;

          return sendJson(res, 200, result, {
            "x-ai-router-tier": tier,
            "x-ai-router-reason": decision.reason,
          });
        } catch (error) {
          clearTimeout(timer);
          stats.providerFailures[tier] += 1;

          attempts.push({
            tier,
            status: "failed",
            reason:
              error?.name === "AbortError"
                ? "timeout"
                : String(error?.message || error),
          });
        }
      }

      return sendJson(res, 502, {
        error: {
          message: "All configured providers failed.",
          type: "router_exhausted",
          attempts,
        },
      });
    }

    return sendJson(res, 404, {
      error: { message: "Not found.", type: "not_found" },
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: {
        message: String(error?.message || error),
        type: "internal_error",
      },
    });
  }
});

server.listen(config.port, config.host, () => {
  console.log(
    `AI Workstation Router v0.1.0 listening on http://${config.host}:${config.port}`,
  );
});
