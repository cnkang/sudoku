import { NextRequest, NextResponse } from 'next/server';
import { SudokuPuzzle } from './types';
import { generateSudokuPuzzle } from './sudokuGenerator';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficultyParam = searchParams.get('difficulty') || '1';
    const difficulty = parseInt(difficultyParam, 10);

    if (isNaN(difficulty) || difficulty < 1 || difficulty > 10) {
      return NextResponse.json({ error: 'Invalid difficulty level. Must be between 1 and 10.' }, { status: 400 });
    }

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
