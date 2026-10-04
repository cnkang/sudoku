# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2026-10-04

This release improves puzzle correctness, offline play, game-state reliability,
accessibility, and production security across 4×4, 6×6, and 9×9 boards.

### Fixed
- Corrected DLX solution counting so puzzle generation reliably checks uniqueness;
  preserved reproducible generation with explicit seeds.
- Prevented stale puzzle requests from overwriting newer grid or difficulty
  selections, and recorded completed games only once.
- Hardened pause, reset, undo, and preference persistence during game transitions.
- Restored offline puzzle POST handling, cached emitted app assets and the offline
  fallback script, and provided unique fallback puzzles for every supported
  difficulty with securely randomized digit permutations.
- Preserved legacy pending progress locally during service-worker upgrades and
  kept worker updates pending until accepted.
- Unified keyboard navigation across board sizes, linked hints to grid inputs,
  inherited system high-contrast preferences on first load, and moved timer
  styling to a CSS module.
- Coalesced concurrent puzzle generation and isolated forced refreshes from cached
  results; scoped reset cooldowns to individual browser clients.
- Applied request-specific CSP script nonces, blocked inline event handlers,
  bounded streaming request bodies and rate-limit storage, and restricted trust
  in forwarded client-address headers.
- Redacted telemetry URLs, omitted production error stacks, disabled production
  monitoring detail access, and handled background promise rejections.

### Changed
- Invalid puzzle parameters now return HTTP 400, and puzzle POST responses use
  `Cache-Control: no-store`.
- Production progress and achievement endpoints return HTTP 501 to explicitly
  indicate that server synchronization is unavailable; records remain local.
- Migrated staged checks to Vite+, fixed ignored-file handling and deployment
  plugin types, and made the hoisted dependency layout explicit in `.npmrc`.
- Updated runtime and development dependencies, including Next.js 16.3.6,
  React 19.3.0, Vite 8.3.1, Vitest 4.1.11, and sharp 0.35.4.
- Revised documentation to describe supported behavior, local storage, deployment
  requirements, and the scope of accessibility and coverage validation.

### Tests
- Expanded solver, game-state, preference persistence, request-boundary, and
  service-worker regression coverage; stabilized browser hydration waits.

### Upgrade notes
- Continue using Node.js 24.18.0 and pnpm 11.6.0, then install dependencies with
  `pnpm install --frozen-lockfile` and rebuild.
- Offline use requires downloading the app assets while online first. Offline
  fallback variety is limited; progress and statistics do not sync across devices.
- Self-hosted deployments should enable `TRUST_PROXY_HEADERS=true` only behind an
  ingress that overwrites forwarding headers. Rate limits remain process-local.

## [3.0.0] - 2026-07-31

A major release that ships the Apple Design System UI redesign, migrates the
toolchain to Node 24 LTS / pnpm 11 / TypeScript 7 (native compiler), and raises
branch coverage above 92%.

### Added
- Apple Design System UI redesign based on WWDC 2018 "Designing Fluid
  Interfaces" and WWDC 2020 "Details of UI Typography", fully compliant with
  WCAG 2.2 AAA (contrast ≥ 7:1 normal, ≥ 4.5:1 large text).
  - Semantic, mode-aware color tokens with build-time contrast validation.
  - Fluid typography scale with Inter (body) and JetBrains Mono (grid numbers)
    loaded via `next/font`, system-ui fallbacks, and `font-optical-sizing`.
  - Physics-based, interruptible animations through a new `useSpring` hook
    (per-button press springs, snap-index transitions, Suspense fallbacks).
  - Glassmorphism surfaces, focus rings, and ambient/key shadow tokens.
- DLX solver and sudoku generator test suites under the solveSudoku API.
- Accessibility controls tests and useSpring hook tests.
- CI workflows for Codecov patch-coverage protection.

### Changed
- **Node.js**: pinned to 24.18.0 LTS (`.nvmrc` / `.node-version`).
- **pnpm**: migrated to pnpm 11.6.0. Settings moved out of the ignored
  `package.json` `pnpm` field and the unread `.pnpmrc` into `pnpm-workspace.yaml`
  (the pnpm 11 configuration home). `node_modules` now uses a hoisted layout
  (`nodeLinker: hoisted`), as originally intended.
- **TypeScript**: upgraded from 6.0.3 to 7.0.2 (native/Go compiler, `tsgo`).
  Next.js builds now shell out to the `tsc` CLI via `experimental.useTypeScriptCli`.
- **Dependencies**: Next.js 16.2.12, React 19.2.8, Vite 8.1.5, Vitest 4.1.10,
  `@biomejs/biome` 2.5.6, oxlint 1.76.0, Playwright 1.62.0, fast-check 4.9.0,
  zod 4.4.3, fast-sudoku-solver 3.0.3, sharp 0.35.3, web-vitals 6.0.1,
  `@types/node` 26.1.2, postcss 8.5.25.
- `pnpm install` no longer emits the "pnpm field in package.json" warning.
- Husky commit-msg hook migrated for husky v10 compatibility.

### Fixed
- Resolved all open SonarCloud findings (code smells, hotspots, test quality).
- Accessibility: exposed `snapIndex` state and used an output for Suspense
  fallbacks; removed duplicate DOM ids; aligned test selectors to the
  refactored grid DOM; keyboard navigation coverage expanded.
- Layout hydration mismatch and metadata base URL corrected.
- Middleware migrated to the Next.js Proxy convention.
- Service-worker message handler hardened with origin verification.
- E2E grid-size switching stabilized with stable selectors and waits.
- SudokuGrid `Cell` rewritten with local press state to fix TDZ ordering.
- Coverage extraction: inline press handlers moved to `useCallback` to raise
  branch coverage above 92%.
- Suppressed TS 7 type errors in `vite.config.ts` for the native compiler.

### Removed
- The `pnpm` field in `package.json` (overrides consolidated in
  `pnpm-workspace.yaml`).
- The `.pnpmrc` file (superseded by `pnpm-workspace.yaml`).

### Tests
- 1052 tests across 73 files (statements 95.8%, branches 92.4%, functions
  94.0%, lines 96.5%).

## [2.0.0] - 2026-03-03

### Added
- Multi-size Sudoku gameplay across 4x4, 6x6, and 9x9 grids.
- Design system foundations:
  - Custom font setup with `next/font` and CSS variables.
  - Geometric color palette tokens and contrast validation script.
  - Animation primitives (ripple, burst, shake, reveal, confetti) with reduced-motion support.
  - Decorative geometric elements and cursor styling.
- Security hardening:
  - CSP generation utilities and nonce plumbing.
  - API security middleware for validation, origin checks, rate limiting, CSRF, and request limits.
  - Security event logging utilities and security-focused documentation.
- Monitoring and quality tooling:
  - Performance monitoring utilities for Web Vitals and cache metrics.
  - CI workflows for quality checks, security scanning, and E2E execution.

### Changed
- Refactored component loading strategy to increase lazy-loading coverage.
- Improved caching strategy with request-level and cross-request cache paths.
- Optimized async flows around puzzle loading and grid-size transitions.
- Migrated dependencies to pinned versions for reproducibility.
- Updated README with optimization and performance sections.

### Fixed
- CSP runtime behavior that previously blocked app scripts in browser execution.
- E2E stability issues in grid-size switching scenarios.
- API test expectations to align with sanitized production error responses.

## [Unreleased]
- Placeholder for upcoming changes.
