/**
 * @deprecated Use centralized utilities from @/test-utils/ instead
 * This file is kept for backward compatibility but should be migrated
 */
export {
  standardTestCleanup as cleanupTest,
  standardTestSetup as setupTest,
  TEST_DATA,
} from '@/test-utils/common-test-setup';

export {
  createDifficultySelectorProps,
  createGameControlsProps,
  createSudokuGridProps,
  createTimerProps,
} from '@/test-utils/component-props-factory';

// Re-export for backward compatibility
export const mockSudokuPuzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];
