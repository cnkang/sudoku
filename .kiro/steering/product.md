---
inclusion: always
---

# Product Requirements & Conventions

## Sudoku Challenge v2.0.0

Interactive web-based Sudoku game with intelligent puzzle generation and comprehensive game features. All development must maintain the established user experience and feature completeness.

## Core Game Features

### Grid & Input System

- **9×9 Sudoku Grid**: Standard Sudoku layout with cell validation and visual feedback
- **Input Handling**: Support keyboard (1-9, arrow keys, backspace) and touch input
- **Visual States**: Highlight selected cells, conflicts, and completed regions
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Difficulty System

- **10 Difficulty Levels**: Numbered 1-10 (Easy to Expert)
- **Puzzle Generation**: Server-side generation using DLX algorithm
- **Validation**: Each puzzle must have exactly one solution
- **Progressive Difficulty**: Higher levels have fewer initial clues

### Game Controls & Features

- **Timer**: Track solving time with pause/resume capability
- **Hint System**: Provide valid number suggestions for selected cells
- **Undo/Redo**: Full action history with unlimited undo/redo
- **Reset**: Clear user input while preserving original puzzle
- **Solution Check**: Validate current state and show completion

### User Experience Requirements

- **Mobile-First**: Touch-optimized interface for all screen sizes
- **Responsive Design**: Seamless experience across desktop, tablet, mobile
- **Performance**: Smooth interactions with React.memo optimizations
- **Error Handling**: Graceful handling of API failures and edge cases

## Development Conventions

### Feature Implementation

- All game state changes must go through the `useGameState` reducer
- Use optimistic updates for immediate UI feedback
- Implement proper loading states for async operations
- Maintain game statistics and user progress tracking

### API Design

- Puzzle generation endpoint: `/api/solveSudoku`
- Support difficulty parameter and cache control
- Return structured puzzle data with metadata
- Implement proper error responses and status codes

### Testing Requirements

- Maintain 87.5% test coverage across all features
- Test responsive behavior on multiple screen sizes
- Validate game logic and state transitions
- Test API endpoints with various inputs and edge cases

### Performance Standards

- Grid rendering must be optimized for 81 cells
- Implement debounced input handling
- Use React.memo for expensive components
- Minimize re-renders during gameplay

## Business Rules

### Game Logic

- Standard Sudoku rules: 1-9 in each row, column, and 3×3 box
- Invalid moves should be prevented or clearly indicated
- Puzzle completion triggers celebration and statistics update
- Timer pauses automatically when user navigates away

### User Interface

- Clear visual hierarchy with consistent spacing
- Intuitive controls accessible to all skill levels
- Helpful feedback for user actions and errors
- Professional appearance suitable for all ages
