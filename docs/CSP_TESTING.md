# CSP validation

HTML is rendered dynamically. The proxy generates a nonce and passes both `x-nonce` and the Content-Security-Policy to the server render. Next.js bootstrap scripts and the layout's JSON-LD script use that nonce; the response carries the matching policy and `private, no-store`.

Production scripts do not allow `unsafe-inline` or `unsafe-eval`. Inline event-handler attributes are forbidden. Inline styles remain permitted for dynamic grid dimensions, themes and spring transforms. Static offline HTML uses external handlers and the static same-origin policy.

Validate a production build, since development requires `unsafe-eval` for tooling:

```sh
pnpm build
pnpm start
```

Inspect two HTML responses: their nonce values should differ, and each HTML script nonce must match its own response policy. Verify hydration, all three grid sizes, theme controls and lazy chunks with no CSP script violations. Check that an injected inline script without the nonce and an `onclick` attribute are blocked.

After service-worker installation, test offline navigation and POST puzzle generation. Cached HTML must retain its original CSP header and matching nonce. Validate the offline fallback's external reload/play buttons separately. `CSP_REPORT_ONLY=true` enables report-only response headers for diagnosis; do not mistake that setting for enforced protection.
