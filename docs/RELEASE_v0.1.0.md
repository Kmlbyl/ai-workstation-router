# AI Workstation Router v0.1.0

First public preview of AI Workstation Router.

## Highlights

- Economic default routing: **Local → GPT-5.6 Luna → GPT-5.6 Sol**
- OpenAI-compatible `/v1/chat/completions` endpoint
- Direct OpenAI API configuration plus OpenAI-compatible provider support
- Explicit route overrides with virtual models or `x-ai-router-tier`
- Backward-compatible `cheap` and `powerful` aliases
- Transparent heuristic routing
- Provider fallback with bounded attempts
- Health/configuration endpoint
- In-memory routing statistics
- Safe environment configuration template
- Node.js unit tests
- GitHub Actions CI
- Architecture, integration, roadmap, contribution, and security documentation

## Compatibility

Node.js 20.6+

The repository also preserves the original Windows/OpenCode prototype in `ai-workstation-router-provider.js`. The reusable implementation is under `src/`.

## Economic route

```text
Local → Luna → Sol
```

Routine requests stay local where possible. Medium-complexity/high-volume cloud work goes to Luna. Sol is reserved for difficult tasks such as architecture, security, migrations, concurrency analysis, and large refactors.

## Known limitations

- no streaming yet
- no persistent metrics
- no token/spend accounting yet
- heuristic policy only
- not hardened for unauthenticated public-internet exposure

## Install

```bash
git clone https://github.com/Kmlbyl/ai-workstation-router.git
cd ai-workstation-router
cp .env.example .env
npm start
```

## Validation

```bash
npm run check
npm test
```
