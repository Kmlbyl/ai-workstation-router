# OpenCode-style integration example

AI Workstation Router exposes an OpenAI-compatible local endpoint. A coding client that supports a custom OpenAI-compatible base URL can point at:

```text
http://127.0.0.1:11436/v1
```

## 1. Configure the economic route

Copy `.env.example` to `.env`.

Example direct OpenAI cloud configuration:

```env
CLOUD_BASE_URL=https://api.openai.com/v1
CLOUD_API_KEY=your_key_here
LUNA_MODEL=gpt-5.6-luna
SOL_MODEL=gpt-5.6-sol
ROUTER_FALLBACK_ORDER=local,luna,sol
```

Keep the real key only in your local environment or secret manager.

## 2. Start the router

```bash
npm start
```

Verify:

```bash
curl http://127.0.0.1:11436/health
curl http://127.0.0.1:11436/v1/models
```

The health response should report:

```text
local -> luna -> sol
```

## 3. Use automatic routing

Send the virtual model `auto`:

```bash
curl -i http://127.0.0.1:11436/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Debug this TypeScript helper."}
    ]
  }'
```

A debugging request should normally select Luna. The response headers include:

```text
x-ai-router-tier: luna
x-ai-router-reason: complexity-heuristic
```

## 4. Force Sol for hard work

```bash
curl -i http://127.0.0.1:11436/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-ai-router-tier: sol" \
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Review this distributed-system migration architecture."}
    ]
  }'
```

## 5. Virtual models

```text
auto
router/local
router/luna
router/sol
```

Legacy aliases remain valid:

```text
router/cheap      -> Luna
router/powerful   -> Sol
```

## 6. Client configuration pattern

Exact keys differ by client/version, but the pattern is:

```json
{
  "provider": {
    "ai-workstation-router": {
      "baseURL": "http://127.0.0.1:11436/v1",
      "model": "auto"
    }
  }
}
```

Do not copy provider secrets into client configuration if the router already owns them.

## Notes

This documents the integration shape rather than claiming compatibility with every OpenCode version. If a client requires a different provider schema, open an issue with the client version and redacted config.
