---
inclusion: always
---

# Technology Stack & Development Guidelines

## Required Stack

- **Next.js 16** with App Router - Default to React Server Components, use client components only when necessary
- **React 19** with React Compiler - Enable automatic optimizations and concurrent features
- **TypeScript 5.9+** in strict mode - All code must be fully typed, no `any` types allowed
- **pnpm 10.29.2+** - Only package manager allowed, use `pnpm` for all operations

## Tooling Requirements

### Code Quality (Mandatory)

- **Biome** - Primary linter and formatter (replaces ESLint + Prettier)
- **Turbopack** - Development bundler (faster than Webpack)
- **Vitest 3.2+** - Test runner with @testing-library/react
- **fast-check** - Property-based testing for utilities
- **Playwright** - E2E testing with mobile emulation

### Performance Tools

- **React Compiler** - Automatic memoization and optimization
- **Service Workers** - Offline support via Workbox
- **Code Splitting** - Dynamic imports for lazy loading

### CSS Standards

- **CSS Container Queries** - Component-responsive design
- **CSS Modules** - Component-scoped styling only
- **Modern Viewport Units** - Use dvh, svh, lvh for mobile

## Development Commands

```bash
pnpm dev          # Development with Turbopack
pnpm build        # Production build + validation
pnpm quality      # Biome check + format + types (run before commits)
pnpm test         # Test suite (maintain 87.5% coverage)
pnpm test:pbt     # Property-based testing
```

## Architecture Rules

### Component Patterns (Mandatory)

- React Server Components for data fetching and static content
- Client components only for interactivity (use "use client" directive)
- React.memo() for frequently re-rendering components (SudokuGrid, Timer)
- CSS Modules for all component styling
- Co-locate tests in `__tests__/` folders

### State Management Hierarchy

1. `useReducer` for complex state (follow useGameState pattern)
2. Custom hooks for reusable logic (prefix with `use`)
3. `useState` only for simple local state
4. Server Actions for mutations and form handling

### Import Standards

```typescript
// Use absolute imports with @/ alias
import { Component } from '@/components/Component';
import { useHook } from '@/hooks/useHook';
import type { GameState } from '@/types';

// Default exports for components, named for utilities
export default Component;
export { utility, helper };
```

### API Development

- App Router with route.ts files only
- Server Actions for form handling
- Streaming responses for puzzle generation
- Edge Runtime for performance
- Type-safe API with TypeScript interfaces

## Mobile-First Requirements

### Touch Optimization (Child-Friendly)

- Minimum 50px touch targets
- Haptic feedback for interactions
- Progressive enhancement mobile → desktop
- Container Queries for responsive components

### Performance Standards (Non-Negotiable)

- 87.5% test coverage minimum
- Lighthouse Performance Score: 95+ mobile
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Bundle size increase < 15% from baseline

### Accessibility (WCAG AAA)

- 7:1 contrast ratio minimum
- Screen reader compatibility with ARIA
- Keyboard navigation support
- Reduced motion support (prefers-reduced-motion)

## Child-Friendly Design Rules

### UI Patterns

- Large touch targets (50px minimum)
- Gentle error handling (warm colors, encouraging language)
- Celebration animations with accessibility
- Positive reinforcement over punishment

### Technical Implementation

- Fast loading on slow networks
- Offline functionality via Service Worker
- Battery-efficient animations
- Memory-conscious puzzle generation

## Key Dependencies

### Core Libraries (Required)

- **fast-sudoku-solver** - Puzzle generation algorithms
- **fast-check** - Property-based testing
- **@next/pwa** - Progressive Web App features
- **framer-motion** - Animations with View Transitions fallback

### Utilities

- **lodash-es** - ES modules for tree shaking
- **winston** - Structured logging
- **workbox** - Service Worker management
