# Browser Compatibility Matrix

Last validated: 2026-03-03

## Test Scope

- Core app load
- Sudoku interactions
- Grid-size switching
- API health checks
- Accessibility smoke checks (Chromium)

Primary command:

```bash
pnpm test:e2e
```

## Compatibility Status

| Browser / Platform | Status | Validation Source | Notes |
| --- | --- | --- | --- |
| Chrome (Desktop) | Pass | Playwright `chromium` project | Full E2E suite passed |
| Firefox (Desktop) | Pass | Playwright `firefox` project | Full E2E suite passed |
| Safari (Desktop) | Pass | Playwright `webkit` project | Full E2E suite passed |
| Chrome Android (Emulated) | Pass | Playwright `mobile` (Pixel 5) project | Full E2E suite passed |
| Edge (Desktop) | Blocked | Local environment check | Microsoft Edge binary not available at `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge` |

## Edge Validation Blocker

Attempted command:

```bash
pnpm exec node -e "import('@playwright/test').then(async ({ chromium }) => { try { const b = await chromium.launch({ channel: 'msedge', headless: true }); console.log('ok'); await b.close(); } catch (e) { console.error(String(e)); process.exit(1); } });"
```

Observed result:
- `Chromium distribution 'msedge' is not found ...`
- Suggested by Playwright: `pnpm exec playwright install msedge`
- Local install attempt requires elevated privileges (`sudo`) and is currently unavailable in this environment.

## Known Gaps

- Real-device Safari iOS and Firefox Android were not directly executed in this local run.
- Edge desktop requires binary availability before final confirmation.

