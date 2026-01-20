import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, GameAction } from '@/types';
import {
  createChildFriendlyError,
  detectStruggle,
  getEncouragementMessage,
  resetStruggleDetection,
  getRecoveryActions,
  formatErrorMessage,
  type ChildFriendlyError,
  type StruggleDetection,
} from '@/utils/childFriendlyErrorHandling';

interface UseChildFriendlyErrorHandlingProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  onShowFeedback?: (
    type: 'error' | 'encouragement' | 'success',
    message: string,
    options?: {
      duration?: number;
      actions?: Array<{
        action: string;
        label: string;
        icon: string;
        primary: boolean;
      }>;
    }
  ) => void;
}

interface ErrorHandlingState {
  currentError: ChildFriendlyError | null;
  struggleDetection: StruggleDetection;
  lastEncouragementTime: number;
  errorHistory: Array<{
    timestamp: number;
    errorType: string;
    row?: number;
    col?: number;
  }>;
}

export const useChildFriendlyErrorHandling = ({
  gameState,
  dispatch,
  onShowFeedback,
}: UseChildFriendlyErrorHandlingProps) => {
  const [errorState, setErrorState] = useState<ErrorHandlingState>({
    currentError: null,
    struggleDetection: {
      consecutiveErrors: 0,
      timeSpentOnCell: 0,
      hintsUsedRecently: 0,
      lastEncouragementTime: 0,
      strugglingCells: [],
    },
    lastEncouragementTime: 0,
    errorHistory: [],
  });

  const encouragementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cellTimeTrackingRef = useRef<{
    [key: string]: { startTime: number; attempts: number };
  }>({});

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (encouragementTimeoutRef.current) {
        clearTimeout(encouragementTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle validation errors with child-friendly messaging
   */
  const handleValidationError = useCallback(
    (
      errorType: string,
      context?: {
        row?: number;
        col?: number;
        value?: number;
        customMessage?: string;
      }
    ) => {
      const error = createChildFriendlyError(errorType, {
        gridSize: gameState.gridConfig.size,
        childMode: gameState.childMode,
        ...(context?.customMessage !== undefined
          ? { customMessage: context.customMessage }
          : {}),
      });

      // Update error history
      const newErrorEntry = {
        timestamp: Date.now(),
        errorType,
        ...(context?.row !== undefined ? { row: context.row } : {}),
        ...(context?.col !== undefined ? { col: context.col } : {}),
      };

      setErrorState(prev => {
        const updatedHistory = [...prev.errorHistory, newErrorEntry].slice(-10); // Keep last 10 errors

        // Detect struggle
        const struggleResult = detectStruggle(prev.struggleDetection, {
          row: context?.row || 0,
          col: context?.col || 0,
          errorType,
        });

        const updatedStruggleDetection = {
          ...prev.struggleDetection,
          consecutiveErrors: prev.struggleDetection.consecutiveErrors + 1,
          lastEncouragementTime: struggleResult.shouldShowEncouragement
            ? Date.now()
            : prev.struggleDetection.lastEncouragementTime,
        };

        // Show encouragement if needed
        if (struggleResult.shouldShowEncouragement && gameState.childMode) {
          const encouragement = getEncouragementMessage(
            struggleResult.encouragementType,
            {
              gridSize: gameState.gridConfig.size,
              childMode: gameState.childMode,
              strugglingLevel: struggleResult.strugglingLevel,
            }
          );

          // Delay encouragement slightly to not overwhelm the user
          if (encouragementTimeoutRef.current) {
            clearTimeout(encouragementTimeoutRef.current);
          }

          encouragementTimeoutRef.current = setTimeout(() => {
            onShowFeedback?.('encouragement', encouragement.message, {
              duration: encouragement.duration,
            });
          }, 1500);
        }

        return {
          ...prev,
          currentError: error,
          struggleDetection: updatedStruggleDetection,
          errorHistory: updatedHistory,
        };
      });

      // Show error feedback
      const recoveryActions = getRecoveryActions(error, {
        gridSize: gameState.gridConfig.size,
        hintsAvailable: 5 - gameState.hintsUsed, // Assuming max 5 hints
        canUndo: gameState.history.length > 1,
      });

      const formattedMessage = formatErrorMessage(
        error,
        gameState.childMode ? 'child' : 'adult',
        gameState.childMode
      );

      onShowFeedback?.('error', formattedMessage, {
        duration: error.severity === 'error' ? 5000 : 4000,
        actions: recoveryActions,
      });

      return error;
    },
    [gameState, onShowFeedback]
  );

  /**
   * Handle successful moves to reset struggle detection
   */
  const handleSuccess = useCallback(
    (context?: { row?: number; col?: number; isFirstSuccess?: boolean }) => {
      setErrorState(prev => {
        const resetType =
          prev.struggleDetection.consecutiveErrors > 3 ? 'complete' : 'partial';
        const updatedStruggleDetection = resetStruggleDetection(
          prev.struggleDetection,
          resetType
        );

        return {
          ...prev,
          struggleDetection: updatedStruggleDetection,
          currentError: null,
        };
      });

      // Show encouragement for first success or after struggling
      if (gameState.childMode && context?.isFirstSuccess) {
        const encouragement = getEncouragementMessage('FIRST_SUCCESS', {
          gridSize: gameState.gridConfig.size,
          childMode: gameState.childMode,
        });

        onShowFeedback?.('success', encouragement.message, {
          duration: encouragement.duration,
        });
      }
    },
    [gameState.childMode, gameState.gridConfig.size, onShowFeedback]
  );

  /**
   * Handle progress milestones
   */
  const handleProgress = useCallback(
    (progressType: 'good_progress' | 'puzzle_complete' | 'milestone') => {
      if (!gameState.childMode) return;

      const encouragement = getEncouragementMessage('GOOD_PROGRESS', {
        gridSize: gameState.gridConfig.size,
        childMode: gameState.childMode,
      });

      onShowFeedback?.('success', encouragement.message, {
        duration: encouragement.duration,
      });
    },
    [gameState.childMode, gameState.gridConfig.size, onShowFeedback]
  );

  /**
   * Track time spent on cells for struggle detection
   */
  const startCellTracking = useCallback((row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    cellTimeTrackingRef.current[cellKey] = {
      startTime: Date.now(),
      attempts: (cellTimeTrackingRef.current[cellKey]?.attempts || 0) + 1,
    };
  }, []);

  /**
   * Stop tracking time on cell
   */
  const stopCellTracking = useCallback(
    (row: number, col: number) => {
      const cellKey = `${row}-${col}`;
      const tracking = cellTimeTrackingRef.current[cellKey];

      if (tracking) {
        const timeSpent = Date.now() - tracking.startTime;

        // If user spent more than 30 seconds on a cell, they might be struggling
        if (timeSpent > 30000 && gameState.childMode) {
          setErrorState(prev => ({
            ...prev,
            struggleDetection: {
              ...prev.struggleDetection,
              timeSpentOnCell: timeSpent,
            },
          }));
        }

        delete cellTimeTrackingRef.current[cellKey];
      }
    },
    [gameState.childMode]
  );

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      currentError: null,
    }));

    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  /**
   * Execute recovery action
   */
  const executeRecoveryAction = useCallback(
    (action: string, context?: { row?: number; col?: number }) => {
      switch (action) {
        case 'highlight_conflict':
          // This would be handled by the UI component
          break;
        case 'suggest_alternatives':
          // This would show available numbers for the cell
          break;
        case 'offer_hint':
          dispatch({ type: 'USE_HINT' });
          break;
        case 'clear_input':
          if (context?.row !== undefined && context?.col !== undefined) {
            dispatch({
              type: 'UPDATE_USER_INPUT',
              payload: { row: context.row, col: context.col, value: 0 },
            });
          }
          break;
        case 'undo':
          dispatch({ type: 'UNDO' });
          break;
        case 'retry_operation':
          dispatch({ type: 'CLEAR_ERROR' });
          break;
        default:
          break;
      }

      clearError();
    },
    [dispatch, clearError]
  );

  /**
   * Get current struggle level for UI adaptation
   */
  const getStruggleLevel = useCallback(() => {
    const { consecutiveErrors } = errorState.struggleDetection;

    if (consecutiveErrors >= 5) return 'significant';
    if (consecutiveErrors >= 3) return 'moderate';
    return 'mild';
  }, [errorState.struggleDetection]);

  /**
   * Check if user needs encouragement based on time
   */
  const checkForTimeBasedEncouragement = useCallback(() => {
    if (!gameState.childMode) return;

    const now = Date.now();
    const timeSinceLastEncouragement = now - errorState.lastEncouragementTime;

    // Show encouragement every 2 minutes if no recent activity
    if (timeSinceLastEncouragement > 120000 && gameState.timerActive) {
      const encouragement = getEncouragementMessage('SLOW_PROGRESS', {
        gridSize: gameState.gridConfig.size,
        childMode: gameState.childMode,
      });

      onShowFeedback?.('encouragement', encouragement.message, {
        duration: encouragement.duration,
      });

      setErrorState(prev => ({
        ...prev,
        lastEncouragementTime: now,
      }));
    }
  }, [
    gameState.childMode,
    gameState.timerActive,
    gameState.gridConfig.size,
    errorState.lastEncouragementTime,
    onShowFeedback,
  ]);

  // Check for time-based encouragement periodically
  useEffect(() => {
    if (!gameState.childMode || !gameState.timerActive) return;

    const interval = setInterval(checkForTimeBasedEncouragement, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [
    gameState.childMode,
    gameState.timerActive,
    checkForTimeBasedEncouragement,
  ]);

  return {
    // State
    currentError: errorState.currentError,
    struggleLevel: getStruggleLevel(),
    isStruggling: errorState.struggleDetection.consecutiveErrors >= 3,

    // Actions
    handleValidationError,
    handleSuccess,
    handleProgress,
    startCellTracking,
    stopCellTracking,
    clearError,
    executeRecoveryAction,

    // Utils
    formatErrorMessage: (
      error: ChildFriendlyError,
      audience?: 'child' | 'adult' | 'educator'
    ) => formatErrorMessage(error, audience, gameState.childMode),
  };
};
