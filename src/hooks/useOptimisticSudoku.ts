import { useCallback, useOptimistic } from 'react';

interface SudokuState {
  userInput: number[][];
  isValidating: boolean;
}

export const useOptimisticSudoku = (initialUserInput: number[][]) => {
  const [optimisticState, addOptimisticUpdate] = useOptimistic<
    SudokuState,
    { row: number; col: number; value: number }
  >(
    { userInput: initialUserInput, isValidating: false },
    (state, { row, col, value }) => ({
      ...state,
      userInput: state.userInput.map((r, i) =>
        i === row ? r.map((val, j) => (j === col ? value : val)) : r
      ),
      isValidating: true,
    })
  );

  const updateCell = useCallback(
    (row: number, col: number, value: number) => {
      addOptimisticUpdate({ row, col, value });
    },
    [addOptimisticUpdate]
  );

  return {
    userInput: optimisticState.userInput,
    isValidating: optimisticState.isValidating,
    updateCell,
  };
};
