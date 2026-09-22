# OpenCode-style integration example

AI Workstation Router exposes an OpenAI-compatible local endpoint. A coding client that supports a custom OpenAI-compatible base URL can point at:

```text
http://127.0.0.1:11436/v1
```

## 1. Start the router

Create `.env` from `.env.example`, then:

```bash
npm start
```

Verify:

```bash
curl http://127.0.0.1:11436/health
curl http://127.0.0.1:11436/v1/models
```

## 2. Use automatic routing

Send the virtual model `auto`:

```bash
curl http://127.0.0.1:11436/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Debug this TypeScript helper."}
    ]
  }'
```

The response headers include:

```text
x-ai-router-tier
x-ai-router-reason
```

## 3. Force a tier

Use one of:

```text
router/local
router/cheap
router/powerful
```

or send:

```text
x-ai-router-tier: local|cheap|powerful
```

## 4. Client configuration pattern

Exact configuration keys differ by client/version, but the pattern is:

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

Do not copy provider secrets into client configuration if the router already owns them. Keep real keys only in your local `.env` or secret manager.

## Notes

This example documents the integration shape rather than claiming compatibility with every OpenCode version. If a client requires a slightly different provider schema, open an issue with the client version and redacted config.
