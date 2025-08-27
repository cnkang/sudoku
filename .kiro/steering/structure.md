---
inclusion: always
---

# Project Structure & Code Organization

## Mandatory File Placement Rules

When creating new files, follow this exact structure:

```
src/
├── app/                    # Next.js App Router - pages and API routes only
│   ├── api/               # API endpoints (route.ts files)
│   ├── __tests__/         # Page component tests
│   └── *.tsx              # Page components
├── components/            # Reusable UI components
│   ├── __tests__/         # Component tests (required for new components)
│   ├── *.module.css       # Component-scoped styles
│   └── *.tsx              # Component implementations
├── hooks/                 # Custom React hooks
│   ├── __tests__/         # Hook tests (required for new hooks)
│   └── *.ts               # Hook implementations
├── utils/                 # Pure utility functions
│   ├── __tests__/         # Utility tests (required for new utilities)
│   └── *.ts               # Helper functions
├── types/                 # Shared TypeScript definitions
└── test-utils/            # Shared testing utilities
```

## Component Architecture Rules

### Required Patterns

- **Always use functional components** with hooks - never class components
- **Apply React.memo** to components that render frequently (like SudokuGrid)
- **Use CSS Modules** for component styling - create `.module.css` files
- **Co-locate tests** in `__tests__` folders next to source files

### State Management Hierarchy

1. **useReducer** for complex state (follow `useGameState` pattern)
2. **Custom hooks** for reusable logic (prefix with `use`)
3. **useState** only for simple component-local state

## Strict Naming Conventions

### Components

- `ComponentName.tsx` (PascalCase, default export)
- `ComponentName.module.css` (matching component name)
- `ComponentName.test.tsx` (unit tests)
- `ComponentName.responsive.test.tsx` (responsive tests)

### Hooks

- `useHookName.ts` (camelCase with `use` prefix)
- `useHookName.test.ts` (matching hook name)

### Utilities

- `utilityName.ts` (camelCase, named exports)
- `utilityName.test.ts` (matching utility name)

### API Routes

- `route.ts` (Next.js App Router convention)
- `types.ts` (API-specific types)

## Import Requirements

```typescript
// Absolute imports using @/ alias
import { Component } from '@/components/Component';
import { useHook } from '@/hooks/useHook';
import { utility } from '@/utils/utility';

// Type-only imports
import type { GameState } from '@/types';

// Named exports for utilities, default for components
export { utility, helper };
export default Component;
```

## Testing Requirements

- **Every new file requires a test** - no exceptions
- **Maintain 87.5% coverage** - check with `yarn test`
- **Use co-located `__tests__` folders** - never mix tests with source
- **Import test utilities** from `@/test-utils/` for consistency

## Code Organization Enforcement

### When Adding New Features

1. Create component in `src/components/`
2. Add corresponding `.module.css` file
3. Create test file in `__tests__/` folder
4. Export from component file using default export
5. Import using absolute `@/` paths

### When Adding New Logic

1. Create custom hook in `src/hooks/`
2. Prefix name with `use`
3. Add comprehensive tests
4. Use TypeScript strict mode (no `any` types)

### When Adding Utilities

1. Create in `src/utils/`
2. Use named exports
3. Write pure functions only
4. Add unit tests covering edge cases
