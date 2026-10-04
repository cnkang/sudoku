# Multi-Size Sudoku Challenge

Sudoku for 4×4, 6×6 and 9×9 boards, built with Next.js 16, React 19 and TypeScript. Each generated puzzle has exactly one solution, checked by a solver that stops after finding two solutions. Difficulty controls the target number of clues; uniqueness can require retaining extra clues.

## Gameplay

- 4×4 has five difficulty levels, 6×6 seven and 9×9 ten.
- All modes provide answer checking, hints, pause/resume, bounded undo history and reset.
- Smaller boards enable child-friendly feedback. Completed puzzles are recorded once.
- Grid and difficulty changes cancel superseded requests. Reset has a ten-second cooldown.
- Preferences and completed-game statistics are stored on this device. Clearing browser storage removes them; there is no account or cross-device synchronization.

## Accessibility

The active boards provide labeled numeric inputs, arrow-key navigation between editable cells, conflict indicators, linked hint descriptions, high contrast, large text and reduced-motion settings. Automated accessibility tests target WCAG A/AA rules; full WCAG 2.2 AAA compliance and complete assistive-technology coverage have not been established. Voice input and other experimental utilities are not part of the active game flow.

## Offline support

The service worker caches the app shell, actual emitted static assets and recent puzzles. It handles the same POST `gridSize`/`difficulty` contract used online. Every supported difficulty has a validated unique fallback puzzle; digit permutations provide limited offline variety. Downloading the app's assets while online is required before offline use.

A new worker waits for an update to be accepted. The non-versioned manifest revalidates instead of remaining immutable for a year. Legacy pending progress is retained locally during worker upgrades. Production progress/achievement endpoints return 501 because server persistence is unavailable; development responses are demonstrations, not user records.

## Run locally

Use the Node version in `.nvmrc` and pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm quality
pnpm test
pnpm test:coverage
pnpm build
pnpm start
pnpm test:e2e
```

## Runtime and security

Puzzle generation runs in the Node runtime. A bounded in-flight map shares concurrent work, and a 50-entry LRU keeps completed puzzles for 30 seconds. Optional `seed` values reproduce puzzles. Forced refresh bypasses completed results. Cache hit rates and latency depend on workload; no fixed improvement percentage is guaranteed.

HTML responses are dynamic and carry request-specific script nonces. Inline event-handler attributes are blocked; dynamic style attributes remain allowed. Puzzle POST responses use `no-store`, while service-worker puzzle storage is an explicit offline feature. Invalid puzzle parameters return 400. Request bodies are checked before reading when Content-Length is available and capped while streaming.

Rate limits are process-local and bounded to 10,000 entries. Production trusts forwarding headers only on Vercel or when `TRUST_PROXY_HEADERS=true`; enable that option only behind an ingress that overwrites these headers. Otherwise requests share an `unknown` address bucket. Multi-instance deployments need ingress/shared rate limiting. An anonymous HTTP-only cookie separates browser reset cooldowns; it does not authenticate users.

Web Vitals use one `web-vitals` reporting channel. Telemetry URLs omit query strings and fragments; production stacks are not stored. The monitoring detail endpoint is disabled in production. Set `NEXT_PUBLIC_DISABLE_MONITORING=true` to disable client reporting. Monitoring history is process-local, not durable across instances or restarts.

## Validation scope

Coverage statistics apply only to the source files selected in `vite.config.ts`; they are not whole-project coverage. Property tests that simulate constants or formulas do not establish production performance, accessibility or security. Use production browser runs and measured resource timings for those claims. React Profiler durations are render measurements, not proof of compiler memoization.

The active architecture uses `ModernSudokuApp`, `useGameState`/`usePuzzleActions`, `SharedSudokuGrid` and one preference persistence owner. Legacy grid/loader utilities remain for compatibility and are not evidence that their features are enabled in the main game.
