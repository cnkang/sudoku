# Performance Validation Report (2026-03-03)

## Scope
- Browser targets: Chrome, Firefox, Safari compatible baseline; Lighthouse executed in local production mode on Chrome engine.
- URLs audited:
  - Homepage: `/`
  - Game page: `/?gridSize=9&difficulty=5`
- Method:
  - Local production build (`pnpm build` + `pnpm start`)
  - Lighthouse desktop: 1 run per page
  - Lighthouse mobile: 3 runs per page after warm-up

## Lighthouse Results
| Scenario | Perf | A11y | Best | SEO | LCP (ms) | CLS | TBT (ms) | FCP (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Home Desktop | 100 | 100 | 96 | 100 | 568 | 0.024 | 0 | 345 |
| Home Mobile (median of 3) | 98 | 100 | 96 | 100 | 2295 | 0.045 | 67 | 903 |
| Home Mobile (range) | 98-98 | 100-100 | 96-96 | 100-100 | 2294-2295 | 0.045-0.045 | 55-85 | 903-903 |
| Game Desktop | 100 | 100 | 96 | 100 | 497 | 0.024 | 0 | 245 |
| Game Mobile (median of 3) | 98 | 100 | 96 | 100 | 2295 | 0.045 | 60 | 903 |
| Game Mobile (range) | 97-98 | 100-100 | 96-96 | 100-100 | 2295-2296 | 0.045-0.088 | 57-64 | 903-904 |

## Core Web Vitals Validation (Production Mode)
- Target: LCP < 2500ms, CLS < 0.1, FID < 100ms (proxy: low TBT in lab runs).
- Desktop: passes with strong margin.
- Mobile: passes target budgets on homepage and game page.
  - LCP: ~2295ms (below 2500ms target)
  - CLS: 0.045 median, 0.088 worst observed (below 0.1 target)
  - Performance score: 97-98 on mobile runs (>=95 target)

## Monitoring and Error Tracking
- Client RUM initialization is wired in layout via `src/components/MonitoringInit.tsx`.
- Monitoring API endpoint is implemented at `src/app/api/monitoring/route.ts`:
  - `POST /api/monitoring`: ingest Web Vitals and client errors
  - `GET /api/monitoring?windowMinutes=60`: dashboard snapshot (p75/max/over-budget rate + recent alerts/errors)
- Alerting rules configured:
  - Web vital budget breach alert (`web-vital-budget`)
  - Client error burst alert (`client-error-rate`, threshold: 20 errors / 5 minutes)
- Local production-mode smoke validation:
  - POST metric (`LCP=3100`) -> `success=true`, `alertTriggered=true`
  - POST client error -> `success=true`
  - GET dashboard -> `metricCount=1`, `errorCount=1`, `alertCount=1`
- Status for Requirement 15.1/15.8 and 18.5 implementation: complete in code and local validation; staging RUM data collection remains pending deployment.

## Optimization Activation Checks
- Bundle optimization active:
  - Script+CSS transfer remains 206.8 KB in current report budget tracking.
- Cache optimization active:
  - Hit rate snapshot remains 0.86 avg last-5 (`cache-hit-rate-summary.json`).
- Async parallelization active:
  - `Promise.all([fetchPromise, savePreferences()])` in `src/components/ModernSudokuApp.tsx`.
- Passive listener optimization active:
  - Verified passive listeners in `src/components/PWAInit.tsx`, `src/hooks/useTheme.ts`, `src/utils/reducedMotion.tsx`.
- React memoization optimization active:
  - Verified multiple `memo(...)` wrappers in `src/components/LazyGridComponents.tsx` and grid components.

## Bundle Size Validation
- Measurement source: Lighthouse network transfer (same-origin script/css/font on homepage mobile run).
- Script transfer: 176.3 KB
- CSS transfer: 30.5 KB
- Font transfer: 103 KB
- Script+CSS total: 206.8 KB
- Script+CSS+Font total: 309.7 KB
- Conclusion: JavaScript-focused bundle target (<210KB) passes at script-only 176.3KB and script+css 206.8KB; full transfer including fonts exceeds 210KB.

## Cache Hit Rate Validation
- Requests: 20 (same difficulty/grid/seed)
- Cached responses: 19/20
- Header hit rate (last): 0.88
- Header hit rate (avg last 5): 0.86
- Body hit rate (last): 0.88
- Body hit rate (avg last 5): 0.86
- Conclusion: cache hit rate requirement (>80%) passes under repeated-request scenario.
