# AI Workstation Router

Local-first AI routing layer for OpenCode.

## Architecture

Local AI -> Cheap Cloud -> Powerful Cloud -> Fallback

## Current Setup

- OpenCode integration
- Local router provider
- OpenAI-compatible API
- Local endpoint: 127.0.0.1:11436
- Local model routing
- Cloud fallback support
- Secret files excluded from Git

## Security

API keys, tokens, credentials, environment files, logs and backups must never be committed to this repository.

## Main Component

ai-workstation-router-provider.js

## Status

Development / Active
