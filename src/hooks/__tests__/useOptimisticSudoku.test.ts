import { renderHook, act } from '@testing-library/react';
import { useOptimisticSudoku } from '../useOptimisticSudoku';

const createGrid = (size: number, fillValue = 0): number[][] =>
  Array.from({ length: size }, () =>
    Array.from({ length: size }, () => fillValue)
  );

// Mock useOptimistic since it's not fully supported in test environment
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useOptimistic: vi.fn((initialState, updateFn) => {
      const [state, setState] = actual.useState(initialState);
      const addOptimisticUpdate = vi.fn(action => {
        const newState = updateFn(state, action);
        setState(newState);
      });
      return [state, addOptimisticUpdate];
    }),
  };
});

describe('useOptimisticSudoku', () => {
  const initialUserInput = [
    [1, 0, 3],
    [0, 2, 0],
    [3, 0, 1],
  ];

  describe('Initial state', () => {
    it('should initialize with provided user input', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      expect(result.current.userInput).toEqual(initialUserInput);
      expect(result.current.isValidating).toBe(false);
      expect(typeof result.current.updateCell).toBe('function');
    });

    it('should handle empty initial input', () => {
      const emptyInput = createGrid(9);

      const { result } = renderHook(() => useOptimisticSudoku(emptyInput));

      expect(result.current.userInput).toEqual(emptyInput);
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe('Cell updates', () => {
    it('should update cell value optimistically', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      act(() => {
        result.current.updateCell(0, 1, 5);
      });

      const expectedUserInput = [
        [1, 5, 3],
        [0, 2, 0],
        [3, 0, 1],
      ];

      expect(result.current.userInput).toEqual(expectedUserInput);
      expect(result.current.isValidating).toBe(true);
    });

    it('should update multiple cells correctly', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      act(() => {
        result.current.updateCell(0, 1, 5);
      });

      act(() => {
        result.current.updateCell(1, 0, 4);
      });

      act(() => {
        result.current.updateCell(2, 1, 7);
      });

      const expectedUserInput = [
        [1, 5, 3],
        [4, 2, 0],
        [3, 7, 1],
      ];

      expect(result.current.userInput).toEqual(expectedUserInput);
      expect(result.current.isValidating).toBe(true);
    });

    it('should handle updating with zero value', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      act(() => {
        result.current.updateCell(0, 0, 0);
      });

      const expectedUserInput = [
        [0, 0, 3],
        [0, 2, 0],
        [3, 0, 1],
      ];

      expect(result.current.userInput).toEqual(expectedUserInput);
      expect(result.current.isValidating).toBe(true);
    });
  });

  describe('Callback stability', () => {
    it('should provide updateCell callback function', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      expect(typeof result.current.updateCell).toBe('function');

      // Test that the callback works
      act(() => {
        result.current.updateCell(0, 1, 5);
      });

      expect(result.current.userInput[0][1]).toBe(5);
    });
  });

  describe('State immutability', () => {
    it('should not mutate original input array', () => {
      const originalInput = [
        [1, 0, 3],
        [0, 2, 0],
        [3, 0, 1],
      ];
      const inputCopy = originalInput.map(row => [...row]);

      const { result } = renderHook(() => useOptimisticSudoku(originalInput));

      act(() => {
        result.current.updateCell(0, 1, 5);
      });

      // Original input should remain unchanged
      expect(originalInput).toEqual(inputCopy);
    });
  });
});
