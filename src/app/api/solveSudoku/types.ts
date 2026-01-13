export interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
  gridSize?: 4 | 6 | 9; // Optional for backward compatibility
}
