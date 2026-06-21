# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TypeScript SDK for the [Paycrest API](https://docs.paycrest.io), focused on the
**Sender** integration (creating/tracking payment orders, rates, account
verification, webhook verification). Early-stage stub: the API surface is
modeled from the docs but not yet validated against a live account.

## Commands

```bash
npm install          # install deps (Node 18+)
npm run build        # bundle to dist/ (ESM + CJS + .d.ts) via tsup
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest run (one-shot)
npm run test:watch   # vitest watch mode
npx vitest run test/webhooks.test.ts            # single test file
npx vitest run -t "accepts a valid signature"   # single test by name
```

There is no published API token in the repo; live calls require a
`PAYCREST_API_KEY` (and `PAYCREST_API_SECRET` for webhooks).

## Architecture

The SDK is a thin, typed wrapper over the Paycrest REST API. Layering:

- `src/http.ts` — `HttpClient`. The single choke point for all network I/O:
  builds URLs, attaches the `API-Key` header, enforces timeouts via
  `AbortController`, maps non-2xx to typed errors, and **unwraps the API's
  `{ status, message, data }` envelope** so resource methods return `data`
  directly. Public endpoints pass `auth: false` to skip the API key.
- `src/resources/*.ts` — one class per API area (`SenderResource`,
  `GeneralResource`). These hold no logic beyond shaping params into
  `http.request()` calls. **New endpoints go here**, grouped by the API's own
  sectioning (sender vs. general/public).
- `src/client.ts` — `PaycrestClient` composes the resources and owns
  `apiSecret` (used only for webhooks, never sent on requests).
- `src/webhooks.ts` — standalone HMAC-SHA256 verification
  (`verifySignature` / `constructEvent`). Independent of the HTTP client so it
  can run in a webhook handler without instantiating a client.
- `src/types.ts` — all request/response types. `src/index.ts` is the only
  public export surface.

## Conventions specific to this API

- **Numeric values are strings.** Amounts, rates, and fees are decimal strings
  in both requests and responses — never coerce to `number`. Types reflect this.
- **Envelope unwrapping happens in `HttpClient`**, not in resources. Resource
  methods type their return as the inner `data` payload.
- **Order direction** is expressed via `source.type` / `destination.type`:
  off-ramp = `crypto` -> `fiat`; on-ramp = `fiat` -> `crypto`. There is no
  separate "direction" field.
- **Webhook signatures must be verified against the raw body string** — parsing
  then re-serializing JSON can reorder bytes and break HMAC verification.
- Base URL already includes `/v2` (`https://api.paycrest.io/v2`); endpoint paths
  in resources are relative to it (e.g. `/sender/orders`).
- Order status values double as webhook event suffixes (`payment_order.<status>`).

## Reference

- Sender integration: https://docs.paycrest.io/implementation-guides/sender-api-integration
- API reference: https://docs.paycrest.io/api-reference/introduction
