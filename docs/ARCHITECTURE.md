# Architecture

## Overview

```text
Client
  |
  v
AI Workstation Router
  |
  +--> local tier
  +--> cheap cloud tier
  +--> powerful cloud tier
```

The router makes one routing decision per request and then uses a bounded fallback sequence if the selected provider cannot complete the request.

## Design goals

- **Local first:** routine work can stay on a developer-controlled endpoint.
- **Cost aware:** not every task requires the strongest cloud model.
- **Transparent:** v0.1 uses deterministic heuristics and exposes the selected route.
- **Portable:** provider calls use an OpenAI-compatible chat-completions shape.
- **Secret isolation:** credentials are read from environment variables.

## Routing inputs

1. explicit `x-ai-router-tier` header;
2. explicit virtual model;
3. prompt length;
4. small complexity/risk keyword sets;
5. default local-first behavior.

Explicit client policy wins over the heuristic.

## Fallback

The primary tier is attempted first. Remaining configured tiers are attempted in the configured fallback order. Missing tiers are skipped.

## Failure model

- one attempt per tier in v0.1;
- per-attempt timeout;
- no infinite retry loop;
- final `502 router_exhausted` includes sanitized attempt reasons.

## Privacy

The reusable router does not persist prompts or responses. The stats endpoint stores only counters.

## Prototype compatibility

`ai-workstation-router-provider.js` is the original Windows/OpenCode prototype and is intentionally kept separate from the reusable `src/` implementation.
