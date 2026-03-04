# Content Security Policy (CSP) Testing Guide

## Overview

This document explains how to test and deploy Content Security Policy (CSP) headers for the Multi-Size Sudoku Challenge application.

## CSP Report-Only Mode

CSP can be deployed in two modes:

1. **Report-Only Mode**: Violations are reported but not blocked. Use this for testing.
2. **Enforcement Mode**: Violations are blocked. Use this in production after testing.

## Testing CSP in Report-Only Mode

### Step 1: Enable Report-Only Mode

Create a `.env.local` file in the project root:

```bash
CSP_REPORT_ONLY=true
```

### Step 2: Start Development Server

```bash
pnpm dev
```

### Step 3: Monitor CSP Violations

Open your browser's Developer Tools and check the Console tab for CSP violation reports. They will appear as warnings (not errors) in report-only mode.

Example violation message:
```
[Report Only] Refused to load the script 'https://example.com/script.js' 
because it violates the following Content Security Policy directive: "script-src 'self'"
```

### Step 4: Review and Adjust CSP

If you see violations:

1. **Legitimate violations**: Update `src/lib/security/csp.ts` to allow the resource
2. **Security issues**: Fix the code to not require the blocked resource

Common adjustments:

```typescript
// Allow specific external scripts
'script-src': [
  "'self'",
  "'strict-dynamic'",
  'https://trusted-cdn.example.com', // Add trusted domains
],

// Allow specific image sources
'img-src': [
  "'self'",
  'data:',
  'blob:',
  'https://trusted-images.example.com', // Add trusted domains
],
```

### Step 5: Test All Features

Test all application features to ensure no legitimate functionality is blocked:

- [ ] Page loads correctly
- [ ] Sudoku grid renders
- [ ] Animations work
- [ ] Theme switching works
- [ ] Hints system works
- [ ] Progress tracking works
- [ ] Service Worker registers
- [ ] PWA installation works

## Switching to Enforcement Mode

Once testing is complete and no violations are reported:

### Step 1: Disable Report-Only Mode

Update `.env.local`:

```bash
CSP_REPORT_ONLY=false
```

Or remove the variable entirely (defaults to enforcement mode).

### Step 2: Test in Enforcement Mode

```bash
pnpm dev
```

Now violations will be **blocked** instead of just reported. Test all features again to ensure nothing breaks.

### Step 3: Deploy to Production

Once enforcement mode works correctly in development:

1. Ensure production environment has `CSP_REPORT_ONLY=false` or no CSP_REPORT_ONLY variable
2. Deploy to staging first
3. Monitor for any issues
4. Deploy to production

## CSP Violation Reporting

### Development

In development, violations appear in the browser console.

### Production (Future Enhancement)

For production monitoring, you can add a report-uri endpoint:

```typescript
// In src/lib/security/csp.ts
export const defaultCSPDirectives: CSPDirectives = {
  // ... other directives
  'report-uri': ['/api/csp-report'], // Add reporting endpoint
};
```

Then create an API route to log violations:

```typescript
// src/app/api/csp-report/route.ts
export async function POST(request: Request) {
  const violation = await request.json();
  console.error('CSP Violation:', violation);
  // Log to monitoring service
  return new Response('OK', { status: 200 });
}
```

## Common CSP Issues and Solutions

### Issue: Inline Scripts Blocked

**Solution**: Use nonce-based approach (already implemented)

```tsx
// In Server Components
const nonce = await getNonce();
<script nonce={nonce}>...</script>
```

### Issue: External Fonts Blocked

**Solution**: Add font domain to font-src

```typescript
'font-src': [
  "'self'",
  'data:',
  'https://fonts.gstatic.com', // Google Fonts
],
```

### Issue: External Images Blocked

**Solution**: Add image domain to img-src

```typescript
'img-src': [
  "'self'",
  'data:',
  'blob:',
  'https://trusted-cdn.example.com',
],
```

### Issue: WebSocket Connections Blocked

**Solution**: Add WebSocket URL to connect-src

```typescript
'connect-src': [
  "'self'",
  'wss://api.example.com',
],
```

## Security Best Practices

1. **Start Strict**: Begin with the strictest policy and relax only as needed
2. **Avoid 'unsafe-inline'**: Use nonces instead (already implemented for scripts)
3. **Avoid 'unsafe-eval'**: Only use in development if absolutely necessary
4. **Use 'strict-dynamic'**: Allows scripts loaded by trusted scripts (already enabled)
5. **Test Thoroughly**: Test all features before enforcing CSP
6. **Monitor Violations**: Set up violation reporting in production

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
