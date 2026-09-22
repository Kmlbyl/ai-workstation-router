# Architecture

## Overview

```text
Client
  |
  v
AI Workstation Router
  |
  +--> Local
  +--> GPT-5.6 Luna
  +--> GPT-5.6 Sol
```

The router makes one routing decision per request and then uses a bounded fallback sequence if the selected provider cannot complete the request.

## Economic routing policy

The default route is:

```text
Local → Luna → Sol
```

This matches the project's core cost-control goal:

- keep routine work local where possible;
- use Luna for higher-volume cloud coding and medium-complexity work;
- reserve Sol for genuinely difficult work.

The implementation also accepts legacy names:

- `cheap` → `luna`
- `powerful` → `sol`

## Design goals

- **Local first:** routine work can stay on a developer-controlled endpoint.
- **Cost aware:** not every task requires the strongest cloud model.
- **Transparent:** v0.1 uses deterministic heuristics and exposes the selected route.
- **Portable:** provider calls use an OpenAI-compatible chat-completions shape.
- **Secret isolation:** credentials are read from environment variables.
- **Bounded failure:** fallback has no infinite retry loop.

## Routing inputs

1. explicit `x-ai-router-tier` header;
2. explicit virtual model;
3. prompt length;
4. small complexity/risk keyword sets;
5. default local-first behavior.

Explicit client policy wins over the heuristic.

## Default task classes

### Local

Routine, short, low-risk requests.

### Luna

Examples include:

- debugging;
- TypeScript/Python implementation;
- integrations;
- Docker/CI tasks;
- ordinary refactors;
- performance work;
- medium-context coding.

### Sol

Examples include:

- architecture;
- security review;
- threat modeling;
- database migrations;
- concurrency/race-condition analysis;
- large refactors;
- production incidents;
- distributed-system design.

## Provider configuration

The cloud tiers share an OpenAI-compatible base URL and API key.

Default direct-OpenAI configuration:

```text
CLOUD_BASE_URL=https://api.openai.com/v1
LUNA_MODEL=gpt-5.6-luna
SOL_MODEL=gpt-5.6-sol
```

The base URL can be changed to another OpenAI-compatible provider.

## Fallback

The primary tier is attempted first. Remaining configured tiers are attempted in the configured fallback order. Missing tiers are skipped.

Default:

```text
local,luna,sol
```

## Failure model

- one attempt per tier in v0.1;
- per-attempt timeout;
- no infinite retry loop;
- final `502 router_exhausted` includes sanitized attempt reasons.

## Privacy

The reusable router does not persist prompts or responses. The stats endpoint stores only counters.

## Prototype compatibility

`ai-workstation-router-provider.js` is the original Windows/OpenCode prototype and is intentionally kept separate from the reusable `src/` implementation.
