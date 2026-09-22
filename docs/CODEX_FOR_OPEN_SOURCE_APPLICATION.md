# Codex for Open Source application draft

Official program page: https://openai.com/form/codex-for-oss/

> Working draft. Do not claim adoption metrics that the repository has not earned.

## Repository URL

https://github.com/Kmlbyl/ai-workstation-router

## Maintainer role

Primary maintainer

## Why is this repository eligible?

AI Workstation Router is an actively maintained open-source developer tool for cost-aware AI coding. It routes work through a practical Local → GPT-5.6 Luna → GPT-5.6 Sol path, using local compute for routine tasks, Luna for high-volume/medium-complexity coding, and Sol for difficult architecture, security, migration, and refactor work. It exposes an OpenAI-compatible API, transparent routing decisions, tests, CI, docs, issues, and a public release workflow.

## Interests

- ChatGPT Pro/Codex support available through the OSS program
- API credits for project development and testing
- Codex Security, if the repository later qualifies

## How will API credits be used?

API credits would fund real maintainer workloads: Luna/Sol routing integration tests, compatibility checks, routing benchmarks, release validation, regression testing, and Codex-assisted issue/PR triage. The project specifically explores when local inference, a lower-cost OpenAI model, and a stronger OpenAI model should be used so developers can reduce cost without losing access to stronger reasoning for difficult tasks.

## Real usage scenario

The project originated from my own working local AI development workstation. My target operating budget is approximately $20–40/month, so the router is being designed around a real economic constraint rather than a synthetic benchmark. The intended default is Local → Luna → Sol, with Sol reserved for tasks where its additional capability is justified.

## Anything else?

I am the primary maintainer and use the architecture in my own development workflow. The repository includes source code, CI, tests, security guidance, architecture docs, integration examples, roadmap, issue tracking, and release notes. I am continuing to add real maintenance history and will report adoption honestly as it develops.

## Current evidence

- v0.1.0 GitHub Release is published and verified.
- CI is green on the current main branch.
- A post-release feature issue was implemented and closed with tests: dry-run routing decision endpoint.
- The repository includes an OpenCode-style integration example and public architecture documentation.
- Maintenance history now includes release work, feature work, tests, CI, and issue tracking.

## Before submitting

- Add/verify an end-to-end Local → Luna → Sol usage example against live providers.
- Continue normal maintenance and gather honest adoption signals if they emerge.
- Add the OpenAI Organization ID required by the application form.
