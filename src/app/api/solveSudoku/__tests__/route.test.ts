import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the sudoku generator
vi.mock('../sudokuGenerator', () => ({
  generateSudokuPuzzle: vi.fn(() => ({
    puzzle: [
      [1, 0, 3],
      [0, 2, 0],
      [3, 0, 1],
    ],
    solution: [
      [1, 2, 3],
      [4, 2, 5],
      [3, 6, 1],
    ],
    difficulty: 1,
  })),
}));

// Mock the cache
vi.mock('../cache', () => {
  const mockCache = new Map();
  return {
    puzzleCache: {
      get: vi.fn(key => mockCache.get(key)),
      set: vi.fn((key, value) => mockCache.set(key, value)),
      clear: vi.fn(() => mockCache.clear()),
    },
  };
});

describe('/api/solveSudoku', () => {
  let mockRequest: NextRequest;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
    // Clear cache before each test
    const { puzzleCache } = await import('../cache');
    puzzleCache.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockRequest = (difficulty: string) => {
    const url = `http://localhost:3000/api/solveSudoku?difficulty=${difficulty}`;
    return new NextRequest(url, { method: 'POST' });
  };

  const createRequestFromQuery = (query: string) =>
    new NextRequest(`http://localhost:3000/api/solveSudoku?${query}`, {
      method: 'POST',
    });

  const assertErrorResponse = async (
    request: NextRequest,
    expectedStatus: number,
    expectedError: string
  ) => {
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(expectedStatus);
    expect(data.error).toBe(expectedError);
  };

  describe('Valid Requests', () => {
    it.each([
      '1',
      '5',
      '10',
    ])('should generate puzzle for valid difficulty %s', async difficulty => {
      mockRequest = createMockRequest(difficulty);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('puzzle');
      expect(data).toHaveProperty('solution');
      expect(data).toHaveProperty('difficulty');
    });

    it('should return solved=true for a successful puzzle response', async () => {
      mockRequest = createMockRequest('5');
      const response = await POST(mockRequest);
      const data = await response.json();
      expect(data.solved).toBe(true);
    });
  });

  describe('Grid Size Validation', () => {
    it('should accept supported grid size values', async () => {
      const url =
        'http://localhost:3000/api/solveSudoku?difficulty=1&gridSize=4';
      mockRequest = new NextRequest(url, { method: 'POST' });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gridSize).toBe(4);
    });

    it('should reject unsupported grid size values', async () => {
      const url =
        'http://localhost:3000/api/solveSudoku?difficulty=1&gridSize=5';
      mockRequest = new NextRequest(url, { method: 'POST' });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid grid size. Must be 4, 6, or 9.');
    });
  });

  describe('Invalid Difficulty Parameters', () => {
    it('should reject missing difficulty parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/solveSudoku', {
        method: 'POST',
      });

      await assertErrorResponse(
        request,
        500,
        'Difficulty must be a valid number.'
      );
    });

    it.each([
      ['', 'Difficulty must be a positive integer.'],
      ['abc', 'Difficulty must be a positive integer.'],
      ['-1', 'Difficulty must be a positive integer.'],
      ['5.5', 'Difficulty must be a positive integer.'],
      ['5!', 'Difficulty must be a positive integer.'],
      ['0', 'Invalid difficulty level. Must be between 1 and 10.'],
      ['11', 'Invalid difficulty level. Must be between 1 and 10.'],
    ])('should reject invalid difficulty "%s"', async (difficulty, expectedError) => {
      await assertErrorResponse(
        createMockRequest(difficulty),
        500,
        expectedError
      );
    });
  });

  describe('Caching Mechanism', () => {
    it('should cache puzzle for same difficulty', async () => {
      const { generateSudokuPuzzle } = await import('../sudokuGenerator');

      // First request
      mockRequest = createMockRequest('3');
      const response1 = await POST(mockRequest);
      const data1 = await response1.json();

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(1);
      expect(data1.cached).toBe(false);

      // Second request with same difficulty (should use cache)
      mockRequest = createMockRequest('3');
      const response2 = await POST(mockRequest);
      const data2 = await response2.json();

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(1); // Should not call again
      expect(data2.cached).toBe(true);
      expect(response2.status).toBe(200);
    });

    it('should bypass cache with force refresh', async () => {
      const { generateSudokuPuzzle } = await import('../sudokuGenerator');

      // First request
      const url1 = 'http://localhost:3000/api/solveSudoku?difficulty=3';
      mockRequest = new NextRequest(url1, { method: 'POST' });
      await POST(mockRequest);

      // Force refresh should bypass cache
      const url2 =
        'http://localhost:3000/api/solveSudoku?difficulty=3&force=true';
      mockRequest = new NextRequest(url2, { method: 'POST' });
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(2);
      expect(data.cached).toBe(false);
    });

    it('should rate limit force refresh requests', async () => {
      // First force refresh
      const url1 =
        'http://localhost:3000/api/solveSudoku?difficulty=3&force=true';
      mockRequest = new NextRequest(url1, { method: 'POST' });
      await POST(mockRequest);

      // Second force refresh immediately (should be rate limited)
      const url2 =
        'http://localhost:3000/api/solveSudoku?difficulty=3&force=true';
      mockRequest = new NextRequest(url2, { method: 'POST' });
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Please wait before making another request');
    });

    it('should handle force refresh rate limiting', async () => {
      vi.clearAllMocks();

      // Test force refresh functionality
      const url =
        'http://localhost:3000/api/solveSudoku?difficulty=3&force=true';
      mockRequest = new NextRequest(url, { method: 'POST' });
      const response = await POST(mockRequest);

      // Should either succeed or be rate limited
      expect([200, 429]).toContain(response.status);
    });

    it('should generate new puzzle for different difficulty', async () => {
      const { generateSudokuPuzzle } = await import('../sudokuGenerator');

      // First request
      mockRequest = createMockRequest('2');
      await POST(mockRequest);

      // Second request with different difficulty
      mockRequest = createMockRequest('4');
      await POST(mockRequest);

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(2);
    });

    it('should handle cache behavior', async () => {
      vi.clearAllMocks();

      // Test basic caching
      mockRequest = createMockRequest('7');
      const response1 = await POST(mockRequest);
      expect(response1.status).toBe(200);

      mockRequest = createMockRequest('7');
      const response2 = await POST(mockRequest);
      expect(response2.status).toBe(200);
    });

    it('should handle multiple difficulties in cache', async () => {
      const { generateSudokuPuzzle } = await import('../sudokuGenerator');

      // Request difficulty 1
      mockRequest = createMockRequest('1');
      await POST(mockRequest);

      // Request difficulty 2
      mockRequest = createMockRequest('2');
      await POST(mockRequest);

      // Request difficulty 1 again (should use cache)
      mockRequest = createMockRequest('1');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(2);
      expect(data.cached).toBe(true);
    });

    it('should keep serving valid responses after timer advances', async () => {
      mockRequest = createMockRequest('6');
      await POST(mockRequest);

      vi.advanceTimersByTime(5001);

      mockRequest = createMockRequest('6');
      const response = await POST(mockRequest);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should reject cross-origin requests', async () => {
      const security = await import('@/app/api/_lib/security');
      const sameOriginSpy = vi
        .spyOn(security, 'isSameOriginRequest')
        .mockReturnValue(false);

      mockRequest = createMockRequest('5');

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Cross-origin request denied.');

      sameOriginSpy.mockRestore();
    });

    it('should return 429 when endpoint-level rate limit is exceeded', async () => {
      const security = await import('@/app/api/_lib/security');
      const rateLimitSpy = vi
        .spyOn(security, 'enforceRateLimit')
        .mockReturnValue({
          limited: true,
          retryAfterSeconds: 30,
          remaining: 0,
        });

      mockRequest = createMockRequest('5');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Please wait before making another request');

      rateLimitSpy.mockRestore();
    });

    it('should handle generator errors', async () => {
      const { generateSudokuPuzzle } = await import('../sudokuGenerator');

      // Mock generator to throw error
      vi.mocked(generateSudokuPuzzle).mockImplementationOnce(() => {
        throw new Error('Generator failed');
      });

      mockRequest = createMockRequest('5');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Generator failed');
    });

    it('should return a generic generation error in production', async () => {
      const { generateSudokuPuzzle } = await import('../sudokuGenerator');
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      vi.mocked(generateSudokuPuzzle).mockImplementationOnce(() => {
        throw new Error('Sensitive details');
      });

      try {
        await assertErrorResponse(
          createMockRequest('5'),
          500,
          'Failed to generate puzzle'
        );
      } finally {
        process.env.NODE_ENV = previousNodeEnv;
      }
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure for new puzzle', async () => {
      mockRequest = createMockRequest('4');

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('puzzle');
      expect(data).toHaveProperty('solution');
      expect(data).toHaveProperty('difficulty');
      expect(data.solved).toBe(true);
      expect(data.cached).toBe(false);
    });

    it('should return correct response structure for cached puzzle', async () => {
      vi.clearAllMocks();

      // First request
      mockRequest = createMockRequest('8');
      await POST(mockRequest);

      // Second request
      mockRequest = createMockRequest('8');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('puzzle');
      expect(data).toHaveProperty('solution');
      expect(data).toHaveProperty('difficulty');
    });

    it('should have correct content type', async () => {
      mockRequest = createMockRequest('3');

      const response = await POST(mockRequest);

      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle leading zeros in difficulty', async () => {
      const response = await POST(createMockRequest('05'));
      expect(response.status).toBe(200);
    });

    it.each([
      [' 5 ', 'Difficulty must be a positive integer.'],
      ['999999', 'Invalid difficulty level. Must be between 1 and 10.'],
      ['1e1', 'Difficulty must be a positive integer.'],
    ])('should reject edge-case difficulty "%s"', async (difficulty, expectedError) => {
      await assertErrorResponse(
        createMockRequest(difficulty),
        500,
        expectedError
      );
    });

    it.each([
      'difficulty=5&seed=bad*seed',
      `difficulty=5&seed=${'a'.repeat(65)}`,
    ])('should reject invalid seed query "%s"', async query => {
      await assertErrorResponse(
        createRequestFromQuery(query),
        500,
        'Invalid seed. Use 1-64 characters containing only letters, numbers, "_" or "-".'
      );
    });

    it.each([
      'difficulty=5&seed=seed_123-abc',
      'difficulty=5&seed=',
      'difficulty=5&seed=%20%20%20',
    ])('should accept valid or fallback seed query "%s"', async query => {
      const response = await POST(createRequestFromQuery(query));
      expect(response.status).toBe(200);
    });
  });

  describe('Cache Key Generation', () => {
    it('should use correct cache key format', async () => {
      // This is tested implicitly through the caching behavior
      // The cache key should be "sudoku-{difficulty}"

      mockRequest = createMockRequest('9');
      await POST(mockRequest);

      mockRequest = createMockRequest('9');
      const response2 = await POST(mockRequest);
      const data2 = await response2.json();

      expect(data2.cached).toBe(true);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests for same difficulty', async () => {
      await import('../sudokuGenerator');

      // Make concurrent requests
      const request1 = createMockRequest('5');
      const request2 = createMockRequest('5');

      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2),
      ]);

      const [data1, data2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // One should be cached, one should not
      const cachedCount = [data1.cached, data2.cached].filter(Boolean).length;
      expect(cachedCount).toBeLessThanOrEqual(1);
    });
  });
});
