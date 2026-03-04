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

## 2. CSRF Protection

CSRF protection is applied to state-changing methods (`POST`, `PUT`, `DELETE`, `PATCH`).

Implementation:
- Functions in `src/app/api/_lib/csrf.ts`
- Tokens are generated with cryptographic randomness.
- Tokens are delivered using header + cookie.
- Validation uses timing-safe comparison.
- Tokens are short-lived (1 hour in current defaults).

Typical route pattern:
1. enforce rate limit
2. validate origin
3. enforce CSRF
4. process business logic

## 3. Rate Limiting

Rate limits are enforced per endpoint and client identity.

Implementation:
- Core enforcement in `src/app/api/_lib/security.ts`
- Client identity source order:
  - `x-forwarded-for`
  - `x-real-ip`
  - fallback `unknown`
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
