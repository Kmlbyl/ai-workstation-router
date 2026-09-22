# Security Policy

## Reporting

Do not publish exploitable vulnerabilities or secrets in public issues. Use GitHub private vulnerability reporting when available.

## Deployment guidance

The router binds to `127.0.0.1` by default.

If you expose it beyond localhost:
- require authentication;
- use TLS;
- restrict network access;
- use a hardened reverse proxy;
- rotate provider credentials;
- avoid logging raw prompts or source code by default.

## Secrets

Never commit `.env`, API keys, access tokens, SSH/private keys, provider credentials, or database passwords.
