import { useOptimistic } from 'react';

interface OptimisticMove {
  row: number;
  col: number;
  value: number;
  timestamp: number;
}

export function useOptimisticGameState(
  userInput: number[][],
  onInputChange: (row: number, col: number, value: number) => void
) {
  const [optimisticInput, addOptimisticMove] = useOptimistic(
    userInput,
    (state: number[][], move: OptimisticMove) => {
      const newState = state.map(row => [...row]);
      newState[move.row][move.col] = move.value;
      return newState;
    }
  );

  const handleOptimisticInput = (row: number, col: number, value: number) => {
    // 立即更新UI
    addOptimisticMove({ row, col, value, timestamp: Date.now() });

    // 异步更新实际状态
    setTimeout(() => {
      onInputChange(row, col, value);
    }, 0);
  };

  return {
    optimisticInput,
    handleOptimisticInput,
  };
}
