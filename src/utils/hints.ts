export interface HintResult {
  row: number;
  col: number;
  value: number;
  reason: string;
}

export const getHint = (
  puzzle: number[][],
  userInput: number[][],
  solution: number[][]
): HintResult | null => {
  // Find first empty cell that can be filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] === 0 && userInput[row][col] === 0) {
        return {
          row,
          col,
          value: solution[row][col],
          reason: `Try placing ${solution[row][col]} in row ${row + 1}, column ${col + 1}`,
        };
      }
    }
  }

  // Find first incorrect cell
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (
        puzzle[row][col] === 0 &&
        userInput[row][col] !== 0 &&
        userInput[row][col] !== solution[row][col]
      ) {
        return {
          row,
          col,
          value: solution[row][col],
          reason: `The value in row ${row + 1}, column ${col + 1} should be ${solution[row][col]}`,
        };
      }
    }
  }

  return null;
};
