# AI Workstation Router

A local-first, OpenAI-compatible routing gateway for AI coding workflows.

**Local model → GPT-5.6 Luna → GPT-5.6 Sol → fallback**

AI Workstation Router routes coding and agent workloads across local and cloud models based on task complexity, cost, availability, and explicit policy.

## Why

Many AI coding workflows send every request to the same model. This project instead provides a small local gateway that can:

- keep routine work on a local model;
- escalate medium-complexity/high-volume work to GPT-5.6 Luna;
- escalate architecture/security/large-refactor work to GPT-5.6 Sol;
- fall back when a provider is unavailable;
- expose an OpenAI-compatible `/v1/chat/completions` endpoint;
- keep secrets outside the repository;
- show which route was selected.

The original Windows/OpenCode prototype remains in `ai-workstation-router-provider.js`. The reusable cross-platform implementation lives in `src/`.

## Economic default route

```text
Local → Luna → Sol
```

The default policy is deliberately cost-aware:

- **Local**: short/routine work when the local endpoint can handle it.
- **Luna**: debugging, integrations, medium-complexity coding and higher-volume cloud work.
- **Sol**: architecture, security review, migrations, large refactors and other difficult tasks.

Legacy aliases remain supported:

```text
cheap     → luna
powerful  → sol
```

## Requirements

- Node.js 20.6+
- Optional: Ollama or another OpenAI-compatible local endpoint
- Optional: OpenAI API key for Luna/Sol cloud tiers
- Optional: another OpenAI-compatible cloud provider

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

## Cloud configuration

For direct OpenAI API usage:

```env
CLOUD_BASE_URL=https://api.openai.com/v1
CLOUD_API_KEY=your_key_here
LUNA_MODEL=gpt-5.6-luna
SOL_MODEL=gpt-5.6-sol
```

`OPENAI_API_KEY` is also accepted as a fallback for `CLOUD_API_KEY`.

## Endpoints

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`
- `GET /router/stats`

## Explicit routing

Use one of these headers:

```text
x-ai-router-tier: local
x-ai-router-tier: luna
x-ai-router-tier: sol
```

or virtual models:

```text
auto
router/local
router/luna
router/sol
```

Backward-compatible virtual models:

```text
router/cheap
router/powerful
```

## Automatic routing

The public v0.1 baseline uses transparent heuristics:

- short/routine prompts → local
- debugging/integration/medium complexity → Luna
- architecture/security/migration/large refactor → Sol

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## OpenCode-style integration

See [examples/opencode.md](examples/opencode.md).

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
