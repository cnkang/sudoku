---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Stack Requirements

- **Next.js 15** with App Router - Use server components by default, client components only when needed
- **React 19** - Leverage latest features including React Compiler optimizations
- **TypeScript 5.9** - Strict mode enabled, all code must be fully typed
- **pnpm 10.18.0** - Required package manager, do not use npm or yarn

## Development Workflow

### Essential Commands

```bash
pnpm dev          # Development with Turbo acceleration
pnpm build        # Production build + type validation
pnpm quality      # Lint + format + type check (run before commits)
pnpm test         # Core test suite (maintain 87.5% coverage)
```

### Code Quality Standards

- **ESLint 9.34** - All linting errors must be resolved
- **Prettier 3.6** - Auto-formatting enforced via pre-commit hooks
- **TypeScript** - No `any` types, strict null checks enabled
- **Testing** - Vitest 3.2 with @testing-library/react for components

## Architecture Patterns

### Component Development

- Use functional components with hooks exclusively
- Apply `React.memo` for performance-critical components (e.g., SudokuGrid)
- CSS Modules for component styling (`.module.css` files)
- Co-locate tests in `__tests__` folders

### State Management

- `useReducer` for complex state logic (see `useGameState`)
- Custom hooks for reusable logic encapsulation
- Local `useState` for simple component state
- No external state management libraries

### API Development

- App Router file-based routing in `src/app/api/`
- Server-side puzzle generation using DLX algorithm
- Implement caching with force refresh capabilities
- Use `winston` for structured logging

### Import Conventions

- Absolute imports with `@/` alias for src directory
- Named exports for utilities, default exports for components
- Use `import type` for TypeScript type-only imports

## Key Dependencies & Usage

- **fast-sudoku-solver** - Core puzzle generation, use for difficulty algorithms
- **lodash** - Utility functions, prefer specific imports (`import { debounce } from 'lodash'`)
- **winston** - Structured logging in API routes

## Performance Requirements

- Maintain 87.5% test coverage across all categories
- Target modern browsers (last 2 versions, >1% usage)
- Mobile-first responsive design mandatory
- React Compiler annotations for optimization hints
