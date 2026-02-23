import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreferences } from '../usePreferences';
import { useGameState } from '../useGameState';
import * as preferencesModule from '../../utils/preferences';
import { GRID_CONFIGS } from '../../utils/gridConfig';

// Mock the preferences module
vi.mock('../../utils/preferences', () => ({
  loadUserPreferences: vi.fn(),
  saveAccessibilitySettings: vi.fn(),
  saveProgressStats: vi.fn(),
  saveChildMode: vi.fn(),
  saveGridConfig: vi.fn(),
  saveDifficulty: vi.fn(),
}));

describe('usePreferences', () => {
  const mockLoadUserPreferences = vi.mocked(
    preferencesModule.loadUserPreferences
  );
  const mockSaveAccessibilitySettings = vi.mocked(
    preferencesModule.saveAccessibilitySettings
  );
  const mockSaveProgressStats = vi.mocked(preferencesModule.saveProgressStats);
  const mockSaveChildMode = vi.mocked(preferencesModule.saveChildMode);
  const mockSaveGridConfig = vi.mocked(preferencesModule.saveGridConfig);
  const mockSaveDifficulty = vi.mocked(preferencesModule.saveDifficulty);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLoadUserPreferences.mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should load preferences on mount', () => {
    const mockPreferences = {
      accessibility: {
        highContrast: true,
        reducedMotion: false,
        screenReaderMode: true,
        largeText: false,
        audioFeedback: true,
        keyboardNavigation: false,
      },
      progress: {
        '4x4': {
          puzzlesCompleted: 5,
          totalTime: 300,
          averageTime: 60,
          bestTime: 45,
          hintsUsed: 2,
          achievements: ['first-solve'],
          streakCount: 3,
          lastPlayed: new Date('2024-01-01'),
        },
        '6x6': {
          puzzlesCompleted: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: 0,
          hintsUsed: 0,
          achievements: [],
          streakCount: 0,
          lastPlayed: null,
        },
        '9x9': {
          puzzlesCompleted: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: 0,
          hintsUsed: 0,
          achievements: [],
          streakCount: 0,
          lastPlayed: null,
        },
      },
      childMode: true,
      gridConfig: GRID_CONFIGS[4],
      difficulty: 3,
    };

    mockLoadUserPreferences.mockReturnValue(mockPreferences);

    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    expect(mockLoadUserPreferences).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_ACCESSIBILITY',
      payload: mockPreferences.accessibility,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CHILD_MODE',
      payload: mockPreferences.childMode,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_GRID_CONFIG',
      payload: mockPreferences.gridConfig,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_DIFFICULTY',
      payload: mockPreferences.difficulty,
    });
  });

  it('should save accessibility settings when they change', () => {
    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    // Simulate accessibility settings change
    act(() => {
      gameStateResult.current.dispatch({
        type: 'UPDATE_ACCESSIBILITY',
        payload: { highContrast: true },
      });
    });

    // Advance past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(mockSaveAccessibilitySettings).toHaveBeenCalled();
  });

  it('should save progress stats when they change', () => {
    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    // Simulate progress update
    act(() => {
      gameStateResult.current.dispatch({
        type: 'UPDATE_PROGRESS',
        payload: {
          gridSize: '4x4',
          stats: { puzzlesCompleted: 1 },
        },
      });
    });

    // Advance past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(mockSaveProgressStats).toHaveBeenCalled();
  });

  it('should save child mode when it changes', () => {
    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    // Simulate child mode change
    act(() => {
      gameStateResult.current.dispatch({
        type: 'SET_CHILD_MODE',
        payload: true,
      });
    });

    // Advance past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(mockSaveChildMode).toHaveBeenCalled();
  });

  it('should save grid config when it changes', () => {
    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    // Simulate grid config change
    act(() => {
      gameStateResult.current.dispatch({
        type: 'SET_GRID_CONFIG',
        payload: GRID_CONFIGS[6],
      });
    });

    // Advance past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(mockSaveGridConfig).toHaveBeenCalled();
  });

  it('should save difficulty when it changes', () => {
    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    // Simulate difficulty change
    act(() => {
      gameStateResult.current.dispatch({
        type: 'SET_DIFFICULTY',
        payload: 5,
      });
    });

    // Advance past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(mockSaveDifficulty).toHaveBeenCalled();
  });

  it('should provide restorePreferences function', () => {
    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    const { result } = renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    expect(result.current.restorePreferences).toBeDefined();
    expect(typeof result.current.restorePreferences).toBe('function');
  });

  it('should restore preferences when restorePreferences is called', () => {
    const mockPreferences = {
      accessibility: {
        highContrast: true,
        reducedMotion: false,
        screenReaderMode: false,
        largeText: false,
        audioFeedback: false,
        keyboardNavigation: false,
      },
      childMode: true,
      difficulty: 5,
    };

    mockLoadUserPreferences.mockReturnValue(mockPreferences);

    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    const { result } = renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    act(() => {
      result.current.restorePreferences();
    });

    expect(mockLoadUserPreferences).toHaveBeenCalledTimes(3); // useGameState + mount + restore
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_ACCESSIBILITY',
      payload: mockPreferences.accessibility,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CHILD_MODE',
      payload: mockPreferences.childMode,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_DIFFICULTY',
      payload: mockPreferences.difficulty,
    });
  });

  it('should handle invalid grid config gracefully', () => {
    const mockPreferences = {
      gridConfig: {
        size: 12, // Invalid size
        boxRows: 3,
        boxCols: 4,
        maxValue: 12,
      },
    };

    mockLoadUserPreferences.mockReturnValue(mockPreferences);

    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    renderHook(() =>
      usePreferences(gameStateResult.current.state, mockDispatch)
    );

    // Should not dispatch SET_GRID_CONFIG for invalid config
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_GRID_CONFIG',
      })
    );
  });

  it('should handle empty preferences gracefully', () => {
    mockLoadUserPreferences.mockReturnValue({});

    const { result: gameStateResult } = renderHook(() => useGameState());
    const mockDispatch = vi.fn();

    expect(() => {
      renderHook(() =>
        usePreferences(gameStateResult.current.state, mockDispatch)
      );
    }).not.toThrow();

    expect(mockLoadUserPreferences).toHaveBeenCalledTimes(2);
  });
});
