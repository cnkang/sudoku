# Stable Next.js and TypeScript 7 Refactor Design

## Context

The application is pinned to stable dependencies: Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3 for Next.js compiler-API compatibility, and TypeScript 7.0.2 for the standalone type-check CLI. Next.js 16.3 preview is explicitly out of scope.

The current application passes 63 test files and 946 tests. The largest maintainability hotspots are `ModernSudokuAppInner` (game orchestration, networking, timers, PWA, preferences, and rendering) and `VisualFeedbackSystem` (feedback state, timers, imperative DOM effects, and rendering).

## Goals

- Preserve stable production dependencies and the TS6/TS7 compatibility bridge.
- Validate puzzle API responses at runtime instead of asserting `unknown` as `SudokuPuzzle`.
- Split game lifecycle and timer behavior out of `ModernSudokuAppInner` without changing UI behavior.
- Split feedback state/effects from feedback rendering without changing accessibility behavior.
- Remove Webpack-only chunk configuration from the Turbopack production build.
- Prove no regression with quality, unit, coverage, build, bundle analysis, and E2E checks.

## Non-goals

- Adopting Next.js 16.3 preview/canary.
- Replacing the existing state reducer, PWA system, cache handler, or CSS architecture.
- Redesigning user-visible UI, copy, or accessibility semantics.
- Introducing a new application state-management dependency.

## Design

### Runtime puzzle boundary

Add a zero-dependency `parseSudokuPuzzle(value: unknown): SudokuPuzzle` boundary. It validates difficulty and matching square puzzle/solution matrices for supported 4, 6, and 9 sizes without adding a schema library to the client bundle. `ModernSudokuApp` parses both normal puzzle fetches and grid-size-change responses before dispatching `SET_PUZZLE`.

### Game orchestration

Extract `useGameTimer` to own elapsed-time correction and interval cleanup. Extract `usePuzzleActions` to own puzzle loading, grid-size transitions, throttling, optimistic cell updates, answer checking, hints, reset, pause, undo, and accessibility updates. `ModernSudokuAppInner` remains the composition/rendering boundary and consumes a typed action object.

### Feedback system

Extract `useFeedbackController` to own feedback state, auto-hide timers, positive-reinforcement scheduling, and cleanup. Extract `FeedbackDisplay` to render messages, pattern overlays, celebration particles, screen-reader announcements, and the pattern legend. `VisualFeedbackSystem` becomes a small adapter that connects the controller, optional contrast button, render-prop children, and display.

### Build configuration

Remove the `webpack` callback that customizes `splitChunks`. Production and development scripts explicitly use Turbopack, whose module graph and code splitting do not consume that Webpack optimization callback. Preserve the existing Turbopack SVG rule and all security, PWA, React Compiler, and cache-handler configuration.

## Compatibility and safety

- Keep `typescript` at 6.0.3 and `typescript-next` at 7.0.2.
- Keep `pnpm type-check` on the TypeScript 7 executable.
- Add no runtime dependency or client-side schema-library bundle cost.
- Preserve existing exports from `VisualFeedbackSystem.tsx` to avoid downstream changes.
- Keep behavior tests with each extracted unit and run the existing component/property tests as characterization coverage.

## Verification

- `pnpm quality`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm build`
- `pnpm next experimental-analyze --output`
- `pnpm test:e2e`
- `git diff --check`

Commits are created only after the complete local verification set passes, split by rollback unit: runtime boundary/build config, game orchestration, feedback system, and design documentation.
