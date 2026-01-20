import { renderHook } from '@testing-library/react';
import { usePuzzleLoader } from '../usePuzzleLoader';

// Mock fetch
const mockFetch = vi.fn();

const assertPuzzleFetch = (difficulty: number) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({}),
  });

  renderHook(() => usePuzzleLoader(difficulty, true, false));

  expect(mockFetch).toHaveBeenCalledWith(
    `/api/solveSudoku?difficulty=${difficulty}`,
    { method: 'POST' }
  );
};
global.fetch = mockFetch;

// Mock React's use hook since it's experimental
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: vi.fn(promise => {
      if (!promise) return null;
      // For testing, we'll simulate the resolved value
      return promise;
    }),
  };
});

describe('usePuzzleLoader', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should return null when shouldFetch is false', () => {
      const { result } = renderHook(() => usePuzzleLoader(1, false, false));

      expect(result.current).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should create puzzle promise when shouldFetch is true', () => {
      const mockPuzzleData = {
        puzzle: [
          [1, 0, 0],
          [0, 2, 0],
          [0, 0, 3],
        ],
        solution: [
          [1, 2, 3],
          [4, 2, 5],
          [6, 7, 3],
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPuzzleData),
      });

      const { result } = renderHook(() => usePuzzleLoader(1, true, false));

      // Should return the promise (mocked as the resolved value)
      expect(result.current).toBeDefined();
    });

    it('should include force parameter when force is true', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderHook(() => usePuzzleLoader(2, true, true));

      // Check that fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/solveSudoku?difficulty=2&force=true',
        { method: 'POST' }
      );
    });

    it('should call fetch with correct parameters for different difficulties', () => {
      const difficulties = [1, 2, 3, 4];

      difficulties.forEach(difficulty => {
        assertPuzzleFetch(difficulty);
      });
    });
  });

  describe('Memoization', () => {
    it('should memoize puzzle promise based on dependencies', () => {
      const { rerender } = renderHook(
        ({ difficulty, shouldFetch, force }) =>
          usePuzzleLoader(difficulty, shouldFetch, force),
        {
          initialProps: { difficulty: 1, shouldFetch: true, force: false },
        }
      );

      const firstCallCount = mockFetch.mock.calls.length;

      // Rerender with same props - should not trigger new fetch
      rerender({ difficulty: 1, shouldFetch: true, force: false });
      expect(mockFetch.mock.calls.length).toBe(firstCallCount);

      // Rerender with different difficulty - should trigger new fetch
      rerender({ difficulty: 2, shouldFetch: true, force: false });
      expect(mockFetch.mock.calls.length).toBeGreaterThan(firstCallCount);
    });

    it('should return null when shouldFetch changes to false', () => {
      const { result, rerender } = renderHook(
        ({ shouldFetch }) => usePuzzleLoader(1, shouldFetch, false),
        { initialProps: { shouldFetch: true } }
      );

      // Initially should create promise
      expect(result.current).toBeDefined();

      // Change to not fetch
      rerender({ shouldFetch: false });
      expect(result.current).toBeNull();
    });
  });

  describe('URL construction', () => {
    it('should construct URL without force parameter by default', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderHook(() => usePuzzleLoader(3, true, false));

      expect(mockFetch).toHaveBeenCalledWith('/api/solveSudoku?difficulty=3', {
        method: 'POST',
      });
    });

    it('should construct URL with force parameter when force is true', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderHook(() => usePuzzleLoader(3, true, true));

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/solveSudoku?difficulty=3&force=true',
        { method: 'POST' }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle zero difficulty', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderHook(() => usePuzzleLoader(0, true, false));

      expect(mockFetch).toHaveBeenCalledWith('/api/solveSudoku?difficulty=0', {
        method: 'POST',
      });
    });

    it('should handle high difficulty values', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderHook(() => usePuzzleLoader(10, true, false));

      expect(mockFetch).toHaveBeenCalledWith('/api/solveSudoku?difficulty=10', {
        method: 'POST',
      });
    });
  });
});
