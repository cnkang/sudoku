# Sudoku Challenge (v2.0.0)

## Project Description

A modern, full-featured Sudoku game built with Next.js 16 and React 19. Features an intelligent puzzle generator, comprehensive game controls, responsive design, and extensive testing coverage with 92.4% overall coverage.

## Features

### Core Gameplay

- **Interactive Sudoku Grid**: Responsive 9×9 grid with intuitive input handling
- **10 Difficulty Levels**: From Easy (1-2) to Expert (9-10) with intelligent puzzle generation
- **Real-time Timer**: Track your solving time with pause/resume functionality
- **Solution Validation**: Instant feedback on puzzle completion

### Game Controls

- **Hint System**: Smart hints with usage tracking and strategic suggestions
- **Undo/Redo**: Full move history with unlimited undo capability
- **Reset Game**: Generate new puzzles with cooldown protection
- **Pause/Resume**: Pause timer and hide grid for breaks

### Technical Features

- **Server-side Puzzle Generation**: Advanced DLX algorithm for unique, solvable puzzles
- **Intelligent Caching**: API response caching with force refresh options
- **Mobile-first Design**: Fully responsive with touch optimization
- **Comprehensive Testing**: 87.5% test coverage with unit, integration, and responsive testing
- **Type Safety**: Full TypeScript implementation

## Prerequisites

- Node.js `24.13.0` (see `.nvmrc`)
- `pnpm 10.29.2+`

## Installation

```bash
corepack enable
corepack use pnpm@10.29.2
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

**Test Coverage: 92.4%** (Functions: 94.3%, Branches: 94.1%, Lines: 92.4%)

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Test categories
# - Component tests (40+ tests)
# - Hook tests (comprehensive state management)
# - API tests (31+ tests with caching)
# - Responsive tests (20+ tests)
# - Utility tests (comprehensive validation & error handling)
# - E2E tests (Playwright integration)
```

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
│   ├── page.styles.ts     # Page-specific styles
│   └── page.tsx           # Main game page
├── components/            # React components
│   ├── __tests__/         # Component tests
│   ├── SudokuGrid.tsx     # Interactive game grid
│   ├── SudokuGrid.styles.ts # Grid component styles
│   ├── GameControls.tsx   # Game control buttons
│   ├── GameControls.styles.ts # Controls component styles
│   ├── Timer.tsx          # Game timer
│   └── DifficultySelector.tsx
├── hooks/                 # Custom React hooks
│   ├── __tests__/         # Hook tests
│   └── useGameState.ts    # Game state management
├── utils/                 # Utility functions
│   ├── __tests__/         # Utility tests
│   ├── hints.ts           # Hint generation logic
│   ├── apiCache.ts        # API caching
│   └── stats.ts           # Game statistics
├── test-utils/            # Testing utilities
└── types/                 # TypeScript definitions
```

## API Endpoints

- `POST /api/solveSudoku?difficulty=1-10` - Generate new puzzle
- `POST /api/solveSudoku?difficulty=5&force=true` - Force new puzzle

## Dependencies

### Runtime

- **next** (^16.0.0) - React framework with App Router
- **react** (^19.2.0) - UI library with React Compiler
- **fast-sudoku-solver** (^1.1.22) - Advanced puzzle generation
- **winston** (^3.18.3) - Structured logging
- **lodash** (^4.17.21) - Utility functions

### Development

- **typescript** (^5.9.3) - Type safety with strict mode
- **vitest** (^3.2.4) - Fast testing framework
- **eslint** (^9.38.0) - Code linting with modern config
- **prettier** (^3.6.2) - Code formatting
- **husky** (^9.1.7) - Git hooks for quality gates
- **playwright** (^1.56.1) - E2E testing framework

## License

MIT License - see [LICENSE](LICENSE) file for details.
