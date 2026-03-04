# Migration Guide

This guide summarizes migration considerations for teams upgrading to the optimized
codebase and runtime behavior.

## Scope

This migration guide targets:
- Consumers upgrading from pre-optimization builds.
- Integrators relying on API behavior or client-side persistence.

## Breaking or Notable Behavioral Changes

### 1. API security enforcement
- Requests with invalid origin may be rejected.
- Requests that exceed configured limits may return `429` or `413`.
- Some state-changing flows now require CSRF validation.

Action:
- Ensure your frontend sends requests from allowed origins.
- Handle `429`/`413` responses gracefully.
- Include CSRF token handling where required by endpoint behavior.

### 2. Error response sanitization
- Production-facing API errors now use generic, sanitized messages.
- Internal stack traces are not returned to clients.

Action:
- Do not depend on detailed server error text in client logic.
- Use status codes and stable error fields for control flow.

### 3. Content Security Policy and nonce usage
- CSP is now enforced with stricter defaults and nonce-aware inline script handling.

Action:
- Avoid introducing inline scripts/styles without nonce support.
- Validate third-party scripts against the active CSP directives.

### 4. Multi-size grid behavior and difficulty ranges
- Difficulty bounds are grid-size-aware.
- Difficulty may be normalized when changing grid size to keep values valid.

Action:
- If you persist difficulty externally, map values to the target grid size range.

### 5. Documentation structure
- Optimization documentation resides in `docs/`.
- Version history is tracked in `CHANGELOG.md`.

Action:
- Update internal references to point to:
  - `docs/OPTIMIZATION_GUIDE.md`
  - `docs/API_SECURITY_CONTROLS.md`
  - `SECURITY.md`
  - `CHANGELOG.md`

## Suggested Upgrade Checklist

1. Pull latest dependencies and install with lockfile:
   - `pnpm install --frozen-lockfile`
2. Run static and type checks:
   - `pnpm quality`
3. Run test suites:
   - `pnpm test`
   - `pnpm test:e2e`
4. Validate API integrations under new security constraints.
5. Validate CSP compatibility for any custom scripts.
