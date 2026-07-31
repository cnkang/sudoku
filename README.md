# Multi-Size Sudoku Challenge (v3.0.0)

## Project Description

A modern, full-featured Sudoku game supporting 4×4, 6×6, and 9×9 grids, built with Next.js 16 and React 19. Features intelligent puzzle generation, child-friendly design, and comprehensive accessibility. The UI follows the Apple Design System (WWDC 2018 "Designing Fluid Interfaces" and WWDC 2020 "Details of UI Typography"), fully compliant with WCAG 2.2 AAA. Backed by 1052 tests (95.8% statement / 92.4% branch coverage) and 70+ validated correctness properties.

## Features

## Comprehensive Optimization Highlights

This application has undergone comprehensive optimization across four key areas, transforming it from functional to unforgettable while maintaining WCAG 2.2 AAA accessibility and 95.8% statement / 92.4% branch coverage:

### 🎨 Apple Design System
- **Fluid Interfaces**: Physics-based, interruptible spring animations via a custom `useSpring` hook (per-button press springs, snap transitions), following WWDC 2018.
- **Typography**: Fluid type scale with Inter (body) and JetBrains Mono (grid numbers) loaded via `next/font`, system-ui fallbacks, and optical sizing, following WWDC 2020.
- **Semantic Color Tokens**: Mode-aware, high-contrast palette validated to ≥ 7:1 (normal) and ≥ 4.5:1 (large text) at build time.
- **Glassmorphism & Elevation**: Glass surfaces, ambient/key shadow tokens, and AAA-compliant focus rings.
- **Reduced Motion**: Respects `prefers-reduced-motion` across all spring and CSS animations.

### ⚡ Performance Optimization
- **Two-Tier Caching**: React.cache() + LRU with 80%+ hit rate for puzzle generation
- **Parallelized Async**: `Promise.all()` eliminates request waterfalls for 25-40% faster grid changes
- **Hoisted node_modules**: pnpm hoisted layout for broad tooling compatibility
- **React.memo & Stable Callbacks**: Minimized re-renders for SudokuGrid and Timer components

### 🔒 Security Hardening
- **Defense in Depth**: CSP with nonce, comprehensive security headers (HSTS, X-Frame-Options, etc.)
- **Input Validation**: Zod schemas for all API inputs with XSS/injection prevention
- **API Protection**: Rate limiting, origin validation, CSRF tokens, request size limits
- **Zero Vulnerabilities**: Automated pnpm audit with Dependabot for continuous security

### ✅ Code Quality & Testing
- **TypeScript 7**: Strict mode, no `any` types, explicit return types, discriminated unions (native compiler)
- **70+ Property Tests**: Correctness properties validated with fast-check for design, performance, security, and accessibility
- **Comprehensive Coverage**: 95.8% statements / 92.4% branches / 94.0% functions / 96.5% lines (1052 tests, 73 files)
- **Progressive Enhancement**: Modern features with fallbacks for older browsers

### Core Gameplay

- **Multi-Size Grid System**: Support for 4×4 (beginner), 6×6 (intermediate), and 9×9 (traditional) grids
- **Adaptive Difficulty**: 4×4 (3-5 levels), 6×6 (5-7 levels), 9×9 (10 levels) with intelligent puzzle generation
- **Seamless Grid Switching**: Smooth transitions between grid sizes with state preservation
- **Real-time Timer**: Track your solving time with pause/resume functionality
- **Solution Validation**: Instant feedback on puzzle completion

### Game Controls

- **Hint System**: Smart hints with usage tracking and strategic suggestions
- **Undo/Redo**: Full move history with unlimited undo capability
- **Reset Game**: Generate new puzzles with cooldown protection
- **Pause/Resume**: Pause timer and hide grid for breaks
- **Grid Size Selector**: Switch between 4×4, 6×6, and 9×9 grids
- **Difficulty Selector**: Adaptive difficulty ranges per grid size

### Apple Design System (v3.0)

Based on WWDC 2018 "Designing Fluid Interfaces" and WWDC 2020 "Details of UI Typography", WCAG 2.2 AAA compliant.

- **Fluid Typography Scale**: Inter for body/UI, JetBrains Mono for grid numbers, loaded via `next/font` with `font-display: swap` and optical sizing
- **Semantic Color Tokens**: Mode-aware palette (brand, success, warning, error, info) all ≥ 7:1 contrast on white — validated at build time
- **Physics-Based Animations**: Interruptible spring animations via the `useSpring` hook (press feedback, snap transitions, Suspense fallbacks)
- **Glassmorphism Surfaces**: Glass backgrounds, elevated shadows, and AAA-compliant focus rings
- **Reduced Motion Support**: Respects `prefers-reduced-motion` across all spring and CSS animations
- **Container Queries & Asymmetric Layout**: Diagonal flow composition with Container Queries for truly fluid responsiveness

### Performance Optimizations

#### Bundle Optimization
- **Tree-Shaking**: Direct imports (no barrel files) and ES-module-friendly dependencies
- **Code Splitting**: React.lazy() for heavy components, route-based splitting
- **Font Optimization**: next/font with automatic subsetting and preloading

#### Runtime Performance
- **25-40% Faster Grid Changes**: Parallelized async operations with Promise.all()
- **Two-Tier Caching**: React.cache() for per-request + LRU with TTL for cross-request
- **Cache Hit Rate**: > 80% for puzzle generation with 30-second TTL
- **React.memo Optimization**: Minimized re-renders for SudokuGrid and Timer components
- **Stable Callbacks**: useEvent pattern for callbacks that don't trigger re-renders
- **Passive Event Listeners**: Smooth scrolling and touch with passive: true
- **Debounced/Throttled Handlers**: Optimized scroll and touch event processing
- **Intersection Observer**: Efficient visibility detection replacing scroll listeners

#### Server Optimization
- **Per-Request Deduplication**: React.cache() prevents duplicate work within requests
- **Cross-Request Caching**: LRU cache with automatic eviction for memory efficiency
- **Edge Runtime**: API routes optimized for edge deployment
- **Request Deduplication**: Duplicate API calls within 5s window share results

### Security Hardening

#### Security Headers
- **Content Security Policy**: CSP with nonce for inline scripts/styles, violation reporting
- **X-Frame-Options**: DENY to prevent clickjacking attacks
- **Strict-Transport-Security**: HSTS with 1-year max-age and includeSubDomains
- **X-Content-Type-Options**: nosniff to prevent MIME type sniffing
- **Referrer-Policy**: strict-origin-when-cross-origin for privacy
- **Permissions-Policy**: Restricted browser features (camera, microphone, geolocation)

#### Input Validation & Sanitization
- **Zod Schema Validation**: Type-safe validation for all API inputs
- **Input Sanitization**: XSS prevention through HTML entity escaping
- **Length Limits**: DoS prevention with maximum input sizes
- **LocalStorage Validation**: Structure and version validation with corruption recovery
- **Malformed Request Rejection**: 400 status codes with sanitized error messages

#### API Security
- **Rate Limiting**: Per-endpoint limits with 429 responses and Retry-After headers
- **Origin Validation**: Request origin checking against allowed domains
- **CORS Configuration**: Strict allowed origins, methods, and headers
- **Request Size Limits**: Maximum body size enforcement (1MB default)
- **CSRF Protection**: Token-based protection for state-changing operations
- **HTTPS-Only**: All API communication enforced over HTTPS
- **Error Sanitization**: Stack traces removed from client responses
- **Security Event Logging**: Comprehensive logging for monitoring and alerting

#### Dependency Security
- **Zero Critical Vulnerabilities**: Automated pnpm audit in CI pipeline
- **Dependabot Integration**: Automated dependency updates with security patches
- **Version Pinning**: Exact versions in package.json for reproducible builds
- **Lockfile Integrity**: pnpm-lock.yaml verification in CI

### Technical Features

- **Server-side Puzzle Generation**: Advanced DLX algorithm for unique, solvable puzzles
- **Intelligent Caching**: Two-tier caching with React.cache() and LRU with TTL
- **Mobile-first Design**: Fully responsive with touch optimization and haptic feedback
- **Comprehensive Testing**: 1052 tests (95.8% statement / 92.4% branch coverage) across unit, integration, property-based, and E2E suites
- **Property-Based Testing**: 70+ correctness properties validated with fast-check
- **Type Safety**: TypeScript 7 strict mode with no any types
- **Progressive Enhancement**: Modern CSS with @supports queries and fallbacks
- **Error Boundaries**: Graceful error handling with user progress preservation
- **Retry Logic**: Exponential backoff for failed API requests
- **Accessibility Excellence**: WCAG 2.2 AAA compliance with keyboard navigation and screen reader support

## Prerequisites

- Node.js `24.18.0` LTS (see `.nvmrc`)
- `pnpm 11.6.0+`

## Installation

```bash
corepack enable
corepack use pnpm@11.6.0
pnpm install
```

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Testing

**Test Coverage: 95.8% statements / 92.4% branches / 94.0% functions** (1052 tests across 73 files)

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run property-based tests
pnpm test:pbt

# Run E2E tests
pnpm test:e2e
```

### Test Categories

- **Component Tests**: 40+ tests for UI components with React Testing Library
- **Hook Tests**: Comprehensive state management and custom hook validation (incl. `useSpring`)
- **API Tests**: 31+ tests with caching, rate limiting, and security validation
- **Property-Based Tests**: 70+ correctness properties validated with fast-check
  - Design system properties (contrast, fonts, animations, reduced-motion)
  - Performance properties (bundle size, lazy loading, caching, event listeners)
  - Security properties (CSP, input validation, rate limiting, CSRF protection)
  - Accessibility properties (keyboard navigation, ARIA labels, focus indicators)
  - Error handling properties (retry logic, error boundaries, progress preservation)
- **Responsive Tests**: 20+ tests for mobile-first design and touch optimization
- **Utility Tests**: Comprehensive validation and error handling coverage
- **E2E Tests**: Playwright integration with multi-grid size scenarios
- **Accessibility Tests**: WCAG AAA compliance validation with axe-core
```

## Performance Metrics

### Core Web Vitals (Production)
- **LCP (Largest Contentful Paint)**: < 2.5s on mobile 3G networks
- **FID (First Input Delay)**: < 100ms for all user interactions
- **CLS (Cumulative Layout Shift)**: < 0.1 during page load and font loading

### Optimization Results
- **Grid Size Change Latency**: 25-40% improvement through async parallelization
- **Cache Hit Rate**: > 80% for puzzle generation with two-tier caching
- **Animation Performance**: Consistent 60fps with GPU-accelerated spring/CSS animations
- **Font Loading CLS**: < 0.1 with optimized fallbacks and font-display: swap
- **Re-render Optimization**: Minimized unnecessary renders with React.memo and stable callbacks

### Lighthouse Scores (Mobile)
- **Performance**: 95+ (optimized bundle, caching, lazy loading)
- **Accessibility**: 100 (WCAG 2.2 AAA compliant with ≥ 7:1 contrast)
- **Best Practices**: 100 (security headers, HTTPS, modern standards)
- **SEO**: 100 (semantic HTML, meta tags, structured data)

### Build Metrics
- **TypeScript 7 Strict Mode**: Zero any types, explicit return types
- **Zero Critical Vulnerabilities**: Automated pnpm audit in CI
- **Test Coverage**: 95.8% statements / 92.4% branches across 1052 tests
- **Bundle Size Budget**: < 15% increase enforced in CI pipeline

## Code Quality

```bash
# Check code quality
pnpm quality

# Fix linting and formatting
pnpm quality:fix
```

### SonarCloud Integration

This project is configured for **SonarCloud Automatic Analysis** for continuous code quality monitoring.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/solveSudoku/   # Puzzle generation API
│   ├── __tests__/         # Page component tests
│   ├── globals.css        # Global styles
│   ├── page.module.css    # Page-specific styles
│   └── page.tsx           # Main game page
├── components/            # React components
│   ├── __tests__/         # Component tests
│   ├── ModernSudokuApp.tsx # Top-level app shell
│   ├── SudokuGrid.tsx     # Interactive game grid
│   ├── GameControls.tsx   # Game control buttons
│   ├── TouchOptimizedControls.tsx # Touch-optimized controls
│   ├── DifficultySelector.tsx
│   └── decorative/         # Geometric decorative elements
├── hooks/                 # Custom React hooks
│   ├── __tests__/         # Hook tests
│   ├── useGameState.ts    # Game state management
│   └── useSpring.ts       # Physics-based spring animations
├── styles/                # Design system stylesheets
│   ├── apple-design-system.css # Apple Design System tokens
│   ├── asymmetric-layout.css  # Asymmetric layout utilities
│   └── modern-responsive.css  # Container-query responsive utilities
├── utils/                 # Utility functions
│   ├── __tests__/         # Utility tests
│   ├── hints.ts           # Hint generation logic
│   ├── apiCache.ts        # API caching
│   └── stats.ts           # Game statistics
├── test-utils/            # Testing utilities
└── types/                 # TypeScript definitions
```

## API Endpoints

### Puzzle Generation
- `POST /api/solveSudoku?difficulty=1-10&gridSize=9` - Generate 9×9 puzzle
- `POST /api/solveSudoku?difficulty=1-7&gridSize=6` - Generate 6×6 puzzle
- `POST /api/solveSudoku?difficulty=1-5&gridSize=4` - Generate 4×4 puzzle
- `POST /api/solveSudoku?difficulty=5&force=true` - Force new puzzle (bypass cache)

### Security Features
- Rate limiting: 100 requests/minute per endpoint
- Origin validation against allowed domains
- Request size limits (1MB maximum)
- CSRF protection for state-changing operations
- Input validation with Zod schemas

## Documentation

### Technical Guides
- [Optimization Guide](docs/OPTIMIZATION_GUIDE.md) - React best practices and performance patterns
- [Security Guide](SECURITY.md) - Security features, headers, and vulnerability reporting
- [CSP Testing](docs/CSP_TESTING.md) - Content Security Policy implementation
- [API Security Controls](docs/API_SECURITY_CONTROLS.md) - Origin validation, CSRF, rate limiting, and request size limits
- [Migration Guide](docs/MIGRATION_GUIDE.md) - Upgrade notes for optimized runtime and API behavior

### Project Documentation
- [Changelog](CHANGELOG.md) - Complete version history
- [License](LICENSE) - MIT License details

## Dependencies

### Runtime

- **next** (16.2.12) - React framework with App Router and Turbopack
- **react** (19.2.8) - UI library with React Compiler optimizations
- **react-dom** (19.2.8) - React DOM renderer
- **fast-sudoku-solver** (3.0.3) - Advanced DLX algorithm for puzzle generation
- **zod** (4.4.3) - TypeScript-first schema validation
- **sharp** (0.35.3) - Image optimization
- **web-vitals** (6.0.1) - Core Web Vitals reporting

### Development

- **typescript** (7.0.2) - Type safety with strict mode (native compiler)
- **vite** (8.1.5) - Build tool and dev server
- **vitest** (4.1.10) - Fast testing framework with coverage
- **@biomejs/biome** (2.5.6) - Fast linter and formatter
- **oxlint** (1.76.0) - Oxidation linter
- **playwright** (1.62.0) - E2E testing framework
- **fast-check** (4.9.0) - Property-based testing library
- **husky** (9.1.7) - Git hooks for quality gates

## License

MIT License - see [LICENSE](LICENSE) file for details.
