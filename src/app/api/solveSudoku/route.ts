import { NextRequest, NextResponse } from 'next/server';
import { SudokuPuzzle } from './types';
import { generateSudokuPuzzle } from './sudokuGenerator';

  /**
   * Validate the given difficulty level.
   * @param {string | null} difficultyParam The difficulty level as a string (or null).
   * @throws {Error} If the difficulty level is invalid.
   * @returns {number} The difficulty level as a number.
   */
function validateDifficulty(difficultyParam: string | null): number {
  const difficulty = parseInt(difficultyParam || '1', 10);
  if (isNaN(difficulty) || difficulty < 1 || difficulty > 10) {
    throw new Error('Invalid difficulty level. Must be between 1 and 10.');
  }
  return difficulty;
}

  /**
   * POST /api/solveSudoku
   *
   * Generates a Sudoku puzzle of the given difficulty level.
   * @param {NextRequest} request The request object.
   * @returns {Promise<NextResponse>} A JSON response containing the Sudoku puzzle.
   * @throws {Error} If the difficulty level is invalid.
   */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = validateDifficulty(searchParams.get('difficulty'));

    // Assume `generateSudokuPuzzle` function now provides the 'solved' field
    const puzzle: SudokuPuzzle = generateSudokuPuzzle(difficulty);
    return NextResponse.json({ ...puzzle, solved: true });

  } catch (error) {
    console.error('Error generating puzzle:', error);
    let errorMessage = 'Internal Server Error';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
