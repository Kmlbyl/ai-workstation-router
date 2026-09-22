# AI Workstation Router v0.1.0

First public preview of AI Workstation Router.

## Highlights

- Local-first routing: local → cheap cloud → powerful cloud → fallback
- OpenAI-compatible `/v1/chat/completions` endpoint
- Explicit route overrides with virtual models or `x-ai-router-tier`
- Transparent heuristic routing
- Provider fallback with bounded attempts
- Health/configuration endpoint
- In-memory routing statistics
- Safe environment configuration template
- Node.js unit tests
- GitHub Actions CI
- Architecture, roadmap, contribution, and security documentation

## Compatibility

Node.js 20.6+

The repository also preserves the original Windows/OpenCode prototype in `ai-workstation-router-provider.js`. The reusable implementation is under `src/`.

## Known limitations

- no streaming yet
- no persistent metrics
- no token/spend accounting yet
- heuristic policy only
- not hardened for unauthenticated public-internet exposure

## Upgrade / install

```bash
git clone https://github.com/Kmlbyl/ai-workstation-router.git
cd ai-workstation-router
cp .env.example .env
npm start
```

## Validation

Run:

```bash
npm run check
npm test
```
