# Sudoku Challenge (v2.0.0)

## Project Description

A modern, full-featured Sudoku game built with Next.js 15 and React 19. Features an intelligent puzzle generator, comprehensive game controls, responsive design, and extensive testing coverage.

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

## Installation

```bash
yarn install
```

## Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Testing

**Test Coverage: 87.5%** (Functions: 93.4%, Branches: 90.2%)

```bash
# Run all tests
yarn test

# Run with coverage report
yarn test:coverage

# Test categories
# - Component tests (40+ tests)
# - Hook tests (28+ tests)
# - API tests (31+ tests)
# - Responsive tests (20+ tests)
# - Utility tests (16+ tests)
```

## Code Quality

```bash
# Check code quality
yarn quality

# Fix linting and formatting
yarn quality:fix
```

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

- **next** (^15.5.0) - React framework
- **react** (^19.1.1) - UI library
- **fast-sudoku-solver** (^1.1.19) - Puzzle generation
- **winston** (^3.17.0) - Logging
- **lodash** (^4.17.21) - Utilities

### Development

- **typescript** (^5.9.2) - Type safety
- **vitest** (^3.2.4) - Testing framework
- **eslint** (^9.34.0) - Code linting
- **prettier** (^3.4.2) - Code formatting
- **husky** (^9.1.7) - Git hooks

## License

MIT License - see [LICENSE](LICENSE) file for details.
