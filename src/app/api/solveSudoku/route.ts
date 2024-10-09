import { NextRequest, NextResponse } from "next/server";
import { SudokuPuzzle } from "./types";
import { generateSudokuPuzzle } from "./sudokuGenerator";

const MAX_DIFFICULTY = 10;
const MIN_DIFFICULTY = 1;

// Define cache at the top level to persist between requests
const cache = new Map<string, { puzzle: SudokuPuzzle; timeout: NodeJS.Timeout }>();

/**
 * Validate the given difficulty level.
 * @param {string | null} difficultyParam The difficulty level as a string (or null).
 * @throws {Error} If the difficulty level is invalid.
 * @returns {number} The difficulty level as a number.
 */
function validateDifficulty(difficultyParam: string | null): number {
  if (!difficultyParam || !/^\d+$/.test(difficultyParam)) {
    throw new Error("Difficulty must be a positive integer.");
  }

  const difficulty = parseInt(difficultyParam, 10);

  if (
    isNaN(difficulty) ||
    difficulty < MIN_DIFFICULTY ||
    difficulty > MAX_DIFFICULTY
  ) {
    throw new Error(
      `Invalid difficulty level. Must be between ${MIN_DIFFICULTY} and ${MAX_DIFFICULTY}.`
    );
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
    const difficulty = validateDifficulty(searchParams.get("difficulty"));

    const cacheKey = `sudoku-${difficulty}`;

    if (cache.has(cacheKey)) {
      const cachedItem = cache.get(cacheKey);
      if (cachedItem) {
        return NextResponse.json(
          { ...cachedItem.puzzle, cached: true },
          { status: 200 }
        );
      }
    }

    // Generate a new Sudoku puzzle
    const puzzle: SudokuPuzzle = generateSudokuPuzzle(difficulty);

    // Set cache with a timeout to expire after 5 seconds
    const timeout = setTimeout(() => cache.delete(cacheKey), 5000); // 5,000ms = 5 seconds
    cache.set(cacheKey, { puzzle, timeout });

    return NextResponse.json({ ...puzzle, solved: true }, { status: 200 });
  } catch (error) {
    console.error("Error generating puzzle:", error);

    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
