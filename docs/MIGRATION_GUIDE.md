# Migration Guide

This guide summarizes migration considerations for teams upgrading to the optimized
codebase and runtime behavior.

## Scope

This migration guide targets:
- Consumers upgrading to the 3.0.0 toolchain (Node 24 LTS, pnpm 11, TypeScript 7).
- Integrators relying on API behavior or client-side persistence.
- Teams adopting the Apple Design System UI.

## Upgrading to 3.0.0

### Toolchain
- **Node.js**: now requires 24.18.0 LTS (see `.nvmrc` / `.node-version`).
  Use `nvm use` or ensure your runtime matches; older Node versions are no longer supported.
- **pnpm**: now requires pnpm 11.6.0+. Run `corepack use pnpm@11.6.0`.
- **pnpm configuration**: settings moved from the ignored `package.json` `pnpm`
  field and the unread `.pnpmrc` into `pnpm-workspace.yaml` (the pnpm 11 home for
  settings). `node_modules` now uses a hoisted layout (`nodeLinker: hoisted`).
  If you relied on a `.pnpmrc`, remove it — its keys were already silently ignored
  by pnpm 11.
- **TypeScript 7 (native compiler)**: `typescript` and `typescript-next` are both
  7.0.2 (`tsgo`). Next.js builds shell out to the `tsc` CLI via
  `experimental.useTypeScriptCli` in `next.config.ts`, because the native
  compiler does not expose the JS compiler API that Next.js previously used
  in-process. No source changes are required for type-checking.

### UI: Apple Design System
- The geometric "sunset palette" UI was replaced by the Apple Design System
  (WWDC 2018 fluid interfaces, WWDC 2020 typography), WCAG 2.2 AAA.
- Animations are now driven by the `useSpring` hook (interruptible, physics-based).
- If you customized CSS, migrate to the new semantic color tokens in
  `src/styles/apple-design-system.css`; the old palette tokens are removed.

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

1. Switch Node to 24.18.0: `nvm use` (or ensure your runtime matches `.nvmrc`).
2. Switch pnpm to 11.6.0: `corepack use pnpm@11.6.0`.
3. Pull latest dependencies and install with lockfile:
   - `pnpm install --frozen-lockfile`
4. Run static and type checks:
   - `pnpm quality`
5. Run test suites:
   - `pnpm test`
   - `pnpm test:e2e`
6. Validate API integrations under new security constraints.
7. Validate CSP compatibility for any custom scripts.
8. If you forked the UI, migrate customizations to the Apple Design System tokens.
