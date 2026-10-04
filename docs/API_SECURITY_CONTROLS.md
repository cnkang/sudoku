# API Security Controls

## Overview

This document consolidates the API-layer security controls used by the Multi-Size Sudoku Challenge backend.

Covered controls:
- Origin validation
- CSRF protection
- Rate limiting
- Request size limits

Primary implementation files:
- `src/app/api/_lib/security.ts`
- `src/app/api/_lib/csrf.ts`
- `src/app/api/_lib/security.test.ts`
- `src/app/api/_lib/__tests__/csrf.test.ts`

## 1. Origin Validation

Origin validation is enforced for state-changing operations to reject cross-site requests from untrusted origins.

Implementation:
- Function: `isSameOriginRequest(request)` in `src/app/api/_lib/security.ts`
- Allowed origin sources:
  - current request origin
  - `NEXT_PUBLIC_APP_URL`
  - `VERCEL_URL` (when available)
  - localhost origins in development

Behavior:
- Missing `origin` header is treated as same-origin-compatible.
- Invalid or untrusted origins are rejected with `403`.

## 2. CSRF scope

Routes enforce origin checks. The optional CSRF helper is used only by routes that import and call it; its existence does not imply token checks on every POST endpoint. Puzzle generation does not mutate an authenticated account. Progress and achievement persistence is local-only; their production API endpoints return 501.

## 3. Rate Limiting

Rate limits are enforced per endpoint and client identity.

Implementation:
- Core enforcement in `src/app/api/_lib/security.ts`
- In production, forwarding headers are accepted only on Vercel or with `TRUST_PROXY_HEADERS=true` behind an ingress that overwrites them. Otherwise all requests use the `unknown` bucket.
- Trusted client identity source order:
  - `x-forwarded-for`
  - `x-real-ip`
  - fallback `unknown`
- Storage has a hard 10,000-entry capacity. Limits are process-local; use a trusted ingress or shared store for multi-instance enforcement.
- Browser reset cooldowns additionally use an anonymous HTTP-only cookie.
- Exceeded limits return `429` with `Retry-After`.

Current endpoint limits (per minute):
- `/api/solveSudoku` `POST`: 240
- `/api/achievements` `POST`: 120, `GET`: 240
- `/api/progress` `POST`: 120, `GET`: 240
- `/api/notifications` `POST`: 120, send `POST`: 20, `GET`: 120, `DELETE`: 120
- `/api/health` `GET`: 300

## 4. Request Size Limits

Request body size limits are enforced to reduce DoS and resource exhaustion risk.

Implementation:
- Function: `readJsonBodyWithLimit()` in `src/app/api/_lib/security.ts`

Current limits:
- `/api/achievements` `POST`: 64 KB
- `/api/progress` `POST`: 64 KB
- `/api/notifications` `POST`: 64 KB

Behavior:
- Content-Length is checked first when present; streamed bytes are capped and reading stops at the limit.
- Oversized payloads are rejected with `413 Payload Too Large`.

## 5. Recommended Endpoint Guard Order

For state-changing endpoints:
1. `enforceRateLimit`
2. `isSameOriginRequest`
3. `enforceCsrfProtection`
4. `readJsonBodyWithLimit` (if request body exists)
5. business logic

## 6. Validation and Tests

Key tests:
- `src/app/api/_lib/security.test.ts`
- `src/app/api/_lib/__tests__/csrf.test.ts`

Coverage focuses on:
- valid/invalid origin handling
- per-client rate-limit behavior and retry windows
- CSRF token generation/validation/lifecycle
- request payload size rejection paths

## 7. Operational Notes

- Current rate-limit and CSRF token stores are in-memory.
- For multi-instance deployments, use shared backends (for example Redis) for consistency.
- Keep `NEXT_PUBLIC_APP_URL` configured correctly in production.

## Related Docs

- [Security Policy](../SECURITY.md)
- [CSP Testing](./CSP_TESTING.md)
- [Browser Compatibility Matrix](./BROWSER_COMPATIBILITY_MATRIX.md)
