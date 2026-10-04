import type { GridConfig } from '@/types';
import { GRID_CONFIGS } from '@/utils/gridConfig';

/** Count solutions up to the requested limit, without changing the caller's board. */
export function solveSudoku(
  board: number[][],
  solutions: number[][][] = [],
  maxSolutions = 2,
  config: GridConfig = GRID_CONFIGS[9],
): Promise<boolean> {
  return Promise.resolve().then(() => countSolutions(board, solutions, maxSolutions, config));
}

function countSolutions(
  board: number[][],
  solutions: number[][][],
  maxSolutions: number,
  config: GridConfig,
): boolean {
  const { size, boxRows, boxCols } = config;
  if (!Number.isInteger(maxSolutions) || maxSolutions < 1) return false;
  if (solutions.length >= maxSolutions) return true;
  if (board.length !== size || board.some((row) => row.length !== size)) return false;
  const cells = board.map((row) => [...row]);
  const rows = new Uint16Array(size);
  const columns = new Uint16Array(size);
  const boxes = new Uint16Array(size);
  const full = (1 << size) - 1;
  const boxIndex = (row: number, col: number) =>
    Math.floor(row / boxRows) * (size / boxCols) + Math.floor(col / boxCols);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = cells[row]![col];
      if (value === undefined || !Number.isInteger(value) || value < 0 || value > size)
        return false;
      if (value === 0) continue;
      const bit = 1 << (value - 1);
      const box = boxIndex(row, col);
      if ((rows[row]! | columns[col]! | boxes[box]!) & bit) return false;
      rows[row] = rows[row]! | bit;
      columns[col] = columns[col]! | bit;
      boxes[box] = boxes[box]! | bit;
    }
  }

  const findNextCell = () => {
    let bestRow = -1;
    let bestCol = -1;
    let candidates = 0;
    let minimum = size + 1;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (cells[row]![col] !== 0) continue;
        const available = full & ~(rows[row]! | columns[col]! | boxes[boxIndex(row, col)]!);
        if (available === 0) return false;
        let count = 0;
        for (let bits = available; bits; bits &= bits - 1) count++;
        if (count < minimum) {
          minimum = count;
          bestRow = row;
          bestCol = col;
          candidates = available;
        }
      }
    }
    return { bestRow, bestCol, candidates };
  };
  const search = (): boolean => {
    const next = findNextCell();
    if (next === false) return false;
    const { bestRow, bestCol } = next;
    let { candidates } = next;
    if (bestRow < 0) {
      solutions.push(cells.map((row) => [...row]));
      return solutions.length >= maxSolutions;
    }
    const values = cells[bestRow]!;
    const box = boxIndex(bestRow, bestCol);
    while (candidates) {
      const bit = candidates & -candidates;
      candidates &= candidates - 1;
      values[bestCol] = 32 - Math.clz32(bit);
      rows[bestRow] = rows[bestRow]! | bit;
      columns[bestCol] = columns[bestCol]! | bit;
      boxes[box] = boxes[box]! | bit;
      const done = search();
      rows[bestRow] = rows[bestRow]! & ~bit;
      columns[bestCol] = columns[bestCol]! & ~bit;
      boxes[box] = boxes[box]! & ~bit;
      values[bestCol] = 0;
      if (done) return true;
    }
    return false;
  };
  return search();
}
