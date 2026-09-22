# AI Workstation Router

A local-first, OpenAI-compatible routing gateway for AI coding workflows.

**Local model → Cheap cloud → Powerful cloud → Fallback**

AI Workstation Router routes coding and agent workloads across local and cloud models based on task complexity, cost, availability, and explicit policy.

## Why

Many AI coding workflows send every request to the same model. This project instead provides a small local gateway that can:

- keep routine work on a local model;
- escalate medium-complexity work to a cheaper cloud model;
- escalate architecture/security/large-refactor work to a stronger model;
- fall back when a provider is unavailable;
- expose an OpenAI-compatible `/v1/chat/completions` endpoint;
- keep secrets outside the repository;
- show which route was selected.

The original Windows/OpenCode prototype remains in `ai-workstation-router-provider.js`. The reusable cross-platform implementation lives in `src/`.

## Requirements

- Node.js 20.6+
- Optional: Ollama or another OpenAI-compatible local endpoint
- Optional: OpenRouter API key for cloud tiers

## Quick start

```bash
git clone https://github.com/Kmlbyl/ai-workstation-router.git
cd ai-workstation-router
cp .env.example .env
npm start
```

Default endpoint:

```text
http://127.0.0.1:11436
```

## Endpoints

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`
- `GET /router/stats`

## Explicit routing

Use one of these headers:

```text
x-ai-router-tier: local
x-ai-router-tier: cheap
x-ai-router-tier: powerful
```

or virtual models:

```text
auto
router/local
router/cheap
router/powerful
```

## Automatic routing

The public v0.1 baseline uses transparent heuristics:

- short/routine prompts → local
- debugging/integration/medium complexity → cheap cloud
- architecture/security/migration/large refactor → powerful cloud

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Configuration

Copy `.env.example` to `.env`. Never commit real API keys or credentials.

## Development

```bash
npm run check
npm test
```

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

MIT
