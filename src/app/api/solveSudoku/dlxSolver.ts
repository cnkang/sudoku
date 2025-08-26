import { solveSudoku as solverSolveSudoku } from 'fast-sudoku-solver';

export function solveSudoku(
  board: number[][],
  solutions: number[][][] = [],
  maxSolutions: number = 2
): boolean {
  const [isSolvable, solution] = solverSolveSudoku(board);

  if (isSolvable) {
    solutions.push(solution);
  }

  return solutions.length >= maxSolutions;
}
