import { useState, useCallback } from 'react';

interface SudokuState {
  userInput: number[][];
  isValidating: boolean;
}

export const useOptimisticSudoku = (initialUserInput: number[][]) => {
  const [state, setState] = useState<SudokuState>({
    userInput: initialUserInput,
    isValidating: false,
  });

  const updateCell = useCallback(
    (row: number, col: number, value: number) => {
      setState(prevState => ({
        userInput: prevState.userInput.map((r, i) =>
          i === row ? r.map((val, j) => (j === col ? value : val)) : r
        ),
        isValidating: true,
      }));
    },
    []
  );

  return {
    userInput: state.userInput,
    isValidating: state.isValidating,
    updateCell,
  };
};