import type React from 'react';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useAdaptiveTouchTargets } from '@/hooks/useAdaptiveTouchTargets';
import { useAudioAccessibility } from '@/hooks/useAudioAccessibility';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import {
  getContextualFeedback,
  useVisualFeedback,
} from '@/hooks/useVisualFeedback';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import type { GridConfig } from '@/types';
import { getAccessibilityManager } from '@/utils/accessibilityManager';
import { useMotionPreferences } from '@/utils/reducedMotion';

import styles from './SudokuGrid.module.css';

interface SudokuGridProps {
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  hintCell?: { row: number; col: number } | null;
  gridConfig: GridConfig;
  childMode?: boolean;
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
    screenReaderMode?: boolean;
    audioFeedback?: boolean;
    keyboardNavigation?: boolean;
    voiceInput?: boolean;
    adaptiveTouchTargets?: boolean;
  };
  // Visual feedback integration
  onCorrectMove?: () => void;
  onIncorrectMove?: () => void;
  onPuzzleComplete?: () => void;
}

const getPuzzleDifficultyLabel = (
  puzzle: number[][],
  gridConfig: GridConfig
): string => {
  const filledCells = puzzle.flat().filter(cell => cell !== 0).length;
  const totalCells = gridConfig.size * gridConfig.size;
  const fillRatio = totalCells > 0 ? filledCells / totalCells : 0;

  if (fillRatio >= 0.5) return 'easy';
  if (fillRatio >= 0.4) return 'medium';
  return 'hard';
};

interface CellPosition {
  row: number;
  col: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isLongPress: boolean;
}

type AudioHandlers = ReturnType<typeof useAudioAccessibility>[1];
type VisualFeedbackHandlers = ReturnType<typeof useVisualFeedback>;
type AccessibilityManager = ReturnType<typeof getAccessibilityManager>;

// Haptic feedback support with React 19 optimization
const triggerHapticFeedback = (
  type: 'light' | 'medium' | 'heavy' = 'light'
) => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[type]);
  }
};

const generateCellKey = (row: number, col: number) => `cell-${row}-${col}`;

const getCellAriaLabel = ({
  rowIndex,
  colIndex,
  currentValue,
  maxValue,
  hasError,
  isHinted,
}: {
  rowIndex: number;
  colIndex: number;
  currentValue: number;
  maxValue: number;
  hasError: boolean;
  isHinted: boolean;
}) => {
  const valueText = currentValue
    ? `Current value: ${currentValue}`
    : 'Empty cell';
  const errorText = hasError
    ? 'This cell has a conflict with other numbers.'
    : '';
  const hintText = isHinted ? 'This cell is highlighted as a hint.' : '';

  return `Editable cell in row ${rowIndex + 1}, column ${
    colIndex + 1
  }. Enter numbers 1 to ${maxValue}. ${valueText}. ${errorText} ${hintText}`.trim();
};

const getCellDescription = ({
  rowIndex,
  colIndex,
  gridConfig,
  hasError,
  isHinted,
}: {
  rowIndex: number;
  colIndex: number;
  gridConfig: GridConfig;
  hasError: boolean;
  isHinted: boolean;
}) => {
  const subGridRow = Math.floor(rowIndex / gridConfig.boxRows) + 1;
  const subGridCol = Math.floor(colIndex / gridConfig.boxCols) + 1;
  const conflictText = hasError
    ? 'Conflict detected with other numbers in row, column, or sub-grid.'
    : '';
  const hintText = isHinted
    ? 'This cell is suggested as a good next move.'
    : '';

  return `Cell in ${gridConfig.size}×${gridConfig.size} Sudoku grid. Sub-grid ${subGridRow}, ${subGridCol}. ${conflictText} ${hintText}`.trim();
};

const getCellBorderStyle = (
  row: number,
  col: number,
  gridConfig: GridConfig
) => {
  const { boxRows, boxCols, size } = gridConfig;
  const maxIndex = size - 1;
  const isRightBorder = col === maxIndex || col % boxCols === boxCols - 1;
  const isBottomBorder = row === maxIndex || row % boxRows === boxRows - 1;

  return {
    borderTop: row % boxRows === 0 ? '4px solid #1f2937' : '1px solid #d1d5db',
    borderLeft: col % boxCols === 0 ? '4px solid #1f2937' : '1px solid #d1d5db',
    borderRight: isRightBorder ? '4px solid #1f2937' : '1px solid #d1d5db',
    borderBottom: isBottomBorder ? '4px solid #1f2937' : '1px solid #d1d5db',
  };
};

const hasRowConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number,
  gridConfig: GridConfig
) => {
  const rowValues = userInput[row];
  if (!rowValues) return false;
  for (let c = 0; c < gridConfig.size; c++) {
    if (c !== col && rowValues[c] === value) return true;
  }
  return false;
};

const hasColumnConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number,
  gridConfig: GridConfig
) => {
  for (let r = 0; r < gridConfig.size; r++) {
    if (r !== row && userInput[r]?.[col] === value) return true;
  }
  return false;
};

const hasBoxConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number,
  gridConfig: GridConfig
) => {
  const { boxRows, boxCols } = gridConfig;
  const boxRow = Math.floor(row / boxRows) * boxRows;
  const boxCol = Math.floor(col / boxCols) * boxCols;

  for (let r = boxRow; r < boxRow + boxRows; r++) {
    for (let c = boxCol; c < boxCol + boxCols; c++) {
      if ((r !== row || c !== col) && userInput[r]?.[c] === value) return true;
    }
  }
  return false;
};

const hasConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number,
  gridConfig: GridConfig
): boolean => {
  if (value === 0) return false;

  return (
    hasRowConflict(userInput, row, col, value, gridConfig) ||
    hasColumnConflict(userInput, row, col, value, gridConfig) ||
    hasBoxConflict(userInput, row, col, value, gridConfig)
  );
};

const isValidCellInput = (value: string, maxValue: number) =>
  value === '' || new RegExp(`^[1-${maxValue}]$`).test(value);

const useCellInputHandler = (
  maxValue: number,
  onInputChange: (row: number, col: number, value: number) => void,
  rowIndex: number,
  colIndex: number,
  reducedMotion: boolean
) =>
  useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (!isValidCellInput(value, maxValue)) {
        return;
      }

      const numValue = value === '' ? 0 : Number.parseInt(value, 10);
      onInputChange(rowIndex, colIndex, numValue);

      if (numValue > 0 && !reducedMotion) {
        triggerHapticFeedback('light');
      }
    },
    [maxValue, onInputChange, rowIndex, colIndex, reducedMotion]
  );

const clearLongPressTimeout = (
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  if (!timeoutRef.current) return;
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
};

const useCellTouchHandlers = ({
  disabled,
  isFixed,
  onLongPress,
  reducedMotion,
  rowIndex,
  colIndex,
  onCellClick,
}: {
  disabled: boolean;
  isFixed: boolean;
  onLongPress: ((row: number, col: number) => void) | undefined;
  reducedMotion: boolean;
  rowIndex: number;
  colIndex: number;
  onCellClick: (row: number, col: number) => void;
}) => {
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isFixed) return;

      const touch = e.touches[0];
      if (!touch) return;

      const newTouchState: TouchState = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isLongPress: false,
      };

      setTouchState(newTouchState);

      longPressTimeoutRef.current = setTimeout(() => {
        if (onLongPress && !reducedMotion) {
          triggerHapticFeedback('medium');
          onLongPress(rowIndex, colIndex);
          setTouchState(prev => (prev ? { ...prev, isLongPress: true } : null));
        }
      }, 500);

      if (!reducedMotion) {
        triggerHapticFeedback('light');
      }
    },
    [disabled, isFixed, onLongPress, reducedMotion, rowIndex, colIndex]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearLongPressTimeout(longPressTimeoutRef);

      if (!touchState || touchState.isLongPress) {
        setTouchState(null);
        return;
      }

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = Math.abs(touch.clientX - touchState.startX);
      const deltaY = Math.abs(touch.clientY - touchState.startY);
      const deltaTime = Date.now() - touchState.startTime;

      if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
        onCellClick(rowIndex, colIndex);
        if (!reducedMotion) {
          triggerHapticFeedback('light');
        }
      }

      setTouchState(null);
    },
    [touchState, onCellClick, reducedMotion, rowIndex, colIndex]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchState) return;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = Math.abs(touch.clientX - touchState.startX);
      const deltaY = Math.abs(touch.clientY - touchState.startY);

      if (deltaX > 10 || deltaY > 10) {
        clearLongPressTimeout(longPressTimeoutRef);
      }
    },
    [touchState]
  );

  useEffect(() => {
    return () => {
      clearLongPressTimeout(longPressTimeoutRef);
    };
  }, []);

  return { handleTouchStart, handleTouchEnd, handleTouchMove };
};

const getCellElement = (
  cellRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>,
  row: number,
  col: number
) => cellRefs.current[generateCellKey(row, col)];

const applyIncorrectMoveStyles = (
  cellElement: HTMLInputElement,
  highContrast: boolean
) => {
  cellElement.style.backgroundColor = highContrast ? '#ffff00' : '#fff7ed';
  cellElement.style.boxShadow = highContrast
    ? '0 0 0 3px #000000'
    : '0 0 0 2px #fb923c, 0 4px 12px rgba(251, 146, 60, 0.3)';
  cellElement.style.transform = 'scale(1.02)';
  cellElement.style.transition = 'all 0.3s ease';

  setTimeout(() => {
    cellElement.style.backgroundColor = '';
    cellElement.style.boxShadow = '';
    cellElement.style.transform = '';
  }, 2000);
};

const triggerCorrectMoveAnimation = (
  cellElement: HTMLInputElement,
  childMode: boolean,
  reducedMotion: boolean
) => {
  if (!childMode || reducedMotion) return;
  cellElement.style.animation = 'gentleBounce 0.6s ease-in-out';
  setTimeout(() => {
    cellElement.style.animation = '';
  }, 600);
};

const handleIncorrectMoveFeedback = ({
  row,
  col,
  value,
  childMode,
  highContrast,
  audioFeedback,
  screenReaderMode,
  visualFeedback,
  audioHandlers,
  accessibilityManager,
  cellRefs,
}: {
  row: number;
  col: number;
  value: number;
  childMode: boolean;
  highContrast: boolean;
  audioFeedback: boolean;
  screenReaderMode: boolean;
  visualFeedback: VisualFeedbackHandlers;
  audioHandlers: AudioHandlers;
  accessibilityManager: React.MutableRefObject<AccessibilityManager>;
  cellRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}) => {
  const feedback = getContextualFeedback('incorrect_move', childMode);
  visualFeedback.triggerError(feedback.message, 'gentle');

  if (audioFeedback) {
    audioHandlers.speakMove(row, col, value, false);
    audioHandlers.speakError(feedback.message ?? 'Invalid move.', childMode);
  }

  if (screenReaderMode) {
    accessibilityManager.current.announce({
      message: `Incorrect move: Number ${value} conflicts with other numbers in row ${
        row + 1
      }, column ${col + 1}`,
      priority: 'assertive',
      category: 'error',
    });
  }

  const cellElement = getCellElement(cellRefs, row, col);
  if (cellElement) {
    applyIncorrectMoveStyles(cellElement, highContrast);
  }
};

const handleCorrectMoveFeedback = ({
  row,
  col,
  value,
  childMode,
  reducedMotion,
  audioFeedback,
  screenReaderMode,
  visualFeedback,
  audioHandlers,
  accessibilityManager,
  cellRefs,
}: {
  row: number;
  col: number;
  value: number;
  childMode: boolean;
  reducedMotion: boolean;
  audioFeedback: boolean;
  screenReaderMode: boolean;
  visualFeedback: VisualFeedbackHandlers;
  audioHandlers: AudioHandlers;
  accessibilityManager: React.MutableRefObject<AccessibilityManager>;
  cellRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}) => {
  const feedback = getContextualFeedback('correct_move', childMode);
  visualFeedback.triggerSuccess(feedback.message);

  if (audioFeedback) {
    audioHandlers.speakMove(row, col, value, true);
  }

  if (screenReaderMode) {
    accessibilityManager.current.announce({
      message: `Correct move: Number ${value} entered in row ${row + 1}, column ${
        col + 1
      }`,
      priority: 'polite',
      category: 'success',
    });
  }

  const cellElement = getCellElement(cellRefs, row, col);
  if (cellElement) {
    triggerCorrectMoveAnimation(cellElement, childMode, reducedMotion);
  }
};

const handlePuzzleCompletionFeedback = ({
  visualFeedback,
  audioFeedback,
  screenReaderMode,
  audioHandlers,
  accessibilityManager,
  onPuzzleComplete,
}: {
  visualFeedback: VisualFeedbackHandlers;
  audioFeedback: boolean;
  screenReaderMode: boolean;
  audioHandlers: AudioHandlers;
  accessibilityManager: React.MutableRefObject<AccessibilityManager>;
  onPuzzleComplete: (() => void) | undefined;
}) => {
  visualFeedback.triggerCelebration('confetti');

  if (audioFeedback) {
    const timeFormatted = '0 minutes and 0 seconds';
    audioHandlers.speakPuzzleCompletion(timeFormatted, 0);
  }

  if (screenReaderMode) {
    accessibilityManager.current.announce({
      message: 'Congratulations! Puzzle completed successfully!',
      priority: 'assertive',
      category: 'success',
    });
  }

  onPuzzleComplete?.();
};

const handleCellClearedFeedback = ({
  row,
  col,
  audioFeedback,
  screenReaderMode,
  audioHandlers,
  accessibilityManager,
}: {
  row: number;
  col: number;
  audioFeedback: boolean;
  screenReaderMode: boolean;
  audioHandlers: AudioHandlers;
  accessibilityManager: React.MutableRefObject<AccessibilityManager>;
}) => {
  if (audioFeedback) {
    audioHandlers.speakMove(row, col, 0, true);
  }

  if (screenReaderMode) {
    accessibilityManager.current.announce({
      message: `Cell cleared in row ${row + 1}, column ${col + 1}`,
      priority: 'polite',
      category: 'game-state',
    });
  }
};

const resolveCellValue = (
  originalValue: number | undefined,
  currentValue: number | undefined
): number => {
  if (originalValue !== undefined && originalValue !== 0) {
    return originalValue;
  }
  return currentValue ?? 0;
};

const isCellComplete = (
  currentInput: number[][],
  originalPuzzle: number[][],
  config: GridConfig,
  row: number,
  col: number
): boolean => {
  const originalValue = originalPuzzle[row]?.[col];
  const cellValue = resolveCellValue(originalValue, currentInput[row]?.[col]);

  if (!cellValue || cellValue === 0) {
    return false;
  }

  return !hasConflict(currentInput, row, col, cellValue, config);
};

const isPuzzleComplete = (
  currentInput: number[][],
  originalPuzzle: number[][],
  config: GridConfig
): boolean => {
  for (let row = 0; row < config.size; row++) {
    for (let col = 0; col < config.size; col++) {
      if (!isCellComplete(currentInput, originalPuzzle, config, row, col)) {
        return false;
      }
    }
  }
  return true;
};

const isCellSelected = (
  selectedCell: CellPosition | null,
  row: number,
  col: number
) => selectedCell?.row === row && selectedCell?.col === col;

const isCellHinted = (
  hintCell: CellPosition | null,
  row: number,
  col: number
) => hintCell?.row === row && hintCell?.col === col;

const isCellInError = (
  isFixed: boolean,
  currentValue: number,
  userInput: number[][],
  row: number,
  col: number,
  gridConfig: GridConfig
) =>
  !isFixed &&
  currentValue !== 0 &&
  hasConflict(userInput, row, col, currentValue, gridConfig);

const getCellClassName = (
  isFixed: boolean,
  isSelected: boolean,
  hasError: boolean,
  isHinted: boolean,
  styles: Record<string, string>
) =>
  [
    styles.sudokuCell,
    isFixed ? 'fixed' : 'editable',
    isSelected ? styles.selected : '',
    hasError ? styles.error : '',
    isHinted ? styles.hinted : '',
  ]
    .filter(Boolean)
    .join(' ');

interface SudokuCellProps {
  cellKey: string;
  num: number;
  currentValue: number;
  rowIndex: number;
  colIndex: number;
  isFixed: boolean;
  isSelected: boolean;
  isHinted: boolean;
  hasError: boolean;
  disabled: boolean;
  borderStyle: React.CSSProperties;
  gridConfig: GridConfig;
  childMode: boolean;
  accessibility: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
  };
  onCellClick: (row: number, col: number) => void;
  onCellKeyDown: (event: React.KeyboardEvent, row: number, col: number) => void;
  onInputChange: (row: number, col: number, value: number) => void;
  onInputKeyDown: (
    event: React.KeyboardEvent,
    row: number,
    col: number
  ) => void;
  onInputFocus: (row: number, col: number) => void;
  onInputBlur: () => void;
  onLongPress?: (row: number, col: number) => void;
  setCellRef: (key: string) => (element: HTMLInputElement | null) => void;
}

const SudokuCell = ({
  cellKey,
  num,
  currentValue,
  rowIndex,
  colIndex,
  isFixed,
  isSelected,
  isHinted,
  hasError,
  disabled,
  borderStyle,
  gridConfig,
  childMode,
  accessibility,
  onCellClick,
  onCellKeyDown,
  onInputChange,
  onInputKeyDown,
  onInputFocus,
  onInputBlur,
  onLongPress,
  setCellRef,
}: SudokuCellProps) => {
  const isFocusable = !isFixed && !disabled;
  const { maxValue } = gridConfig;

  const { handleTouchStart, handleTouchEnd, handleTouchMove } =
    useCellTouchHandlers({
      disabled,
      isFixed,
      onLongPress,
      reducedMotion: Boolean(accessibility.reducedMotion),
      rowIndex,
      colIndex,
      onCellClick,
    });

  const handleInputChange = useCellInputHandler(
    maxValue,
    onInputChange,
    rowIndex,
    colIndex,
    Boolean(accessibility.reducedMotion)
  );

  return (
    <td
      className={getCellClassName(
        isFixed,
        isSelected,
        hasError,
        isHinted,
        styles
      )}
      style={borderStyle}
      onClick={() => onCellClick(rowIndex, colIndex)}
      onKeyDown={event => onCellKeyDown(event, rowIndex, colIndex)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      tabIndex={isFocusable ? 0 : -1}
      data-testid={`sudoku-cell-${rowIndex}-${colIndex}`}
      data-cell-type={isFixed ? 'fixed' : 'editable'}
      data-has-error={hasError}
      data-is-hinted={isHinted}
      data-is-selected={isSelected}
      data-grid-size={gridConfig.size}
      data-child-mode={childMode}
    >
      {isFixed ? (
        <span
          className={`${styles.fixedNumber} ${
            accessibility.largeText ? styles.largeText : ''
          }`}
          data-testid="fixed-number"
        >
          {num}
        </span>
      ) : (
        <>
          <input
            ref={setCellRef(cellKey)}
            id={cellKey}
            type="text"
            inputMode="numeric"
            value={currentValue || ''}
            onChange={handleInputChange}
            onKeyDown={event => onInputKeyDown(event, rowIndex, colIndex)}
            onFocus={() => onInputFocus(rowIndex, colIndex)}
            onBlur={onInputBlur}
            disabled={disabled}
            className={`${styles.cellInput} ${
              accessibility.largeText ? styles.largeText : ''
            }`}
            aria-label={getCellAriaLabel({
              rowIndex,
              colIndex,
              currentValue,
              maxValue,
              hasError,
              isHinted,
            })}
            aria-describedby={`${cellKey}-description`}
            aria-invalid={hasError}
            aria-required="false"
            maxLength={1}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <div
            id={`${cellKey}-description`}
            className={styles.srOnly}
            aria-hidden="true"
          >
            {getCellDescription({
              rowIndex,
              colIndex,
              gridConfig,
              hasError,
              isHinted,
            })}
          </div>
        </>
      )}
    </td>
  );
};

/**
 * Enhanced Sudoku grid component with React 19 features, multi-size support, and child-friendly visual feedback
 */
const SudokuGrid = memo<SudokuGridProps>(
  ({
    puzzle,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    gridConfig,
    childMode = false,
    accessibility = {},
    onCorrectMove,
    onIncorrectMove,
    onPuzzleComplete,
  }) => {
    'use memo'; // React Compiler directive for automatic memoization

    // React 19: useTransition for non-urgent input updates
    const [, startInputTransition] = useTransition();

    const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
    const incorrectMoveCountRef = useRef(0);
    const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Memoize accessibility settings to prevent unnecessary re-renders
    const accessibilitySettings = useMemo(
      () => ({
        highContrast: false,
        reducedMotion: false,
        largeText: false,
        screenReaderMode: false,
        audioFeedback: false,
        keyboardNavigation: false,
        voiceInput: false,
        adaptiveTouchTargets: false,
        ...accessibility,
      }),
      [accessibility]
    );

    const {
      highContrast,
      reducedMotion,
      screenReaderMode,
      audioFeedback,
      keyboardNavigation,
      voiceInput,
      adaptiveTouchTargets,
    } = accessibilitySettings;

    // Motion preferences for reduced motion support
    const { preferences: _motionPreferences } = useMotionPreferences({
      respectSystemPreference: true,
      customPreference: reducedMotion ? 'reduce' : 'no-preference',
      animationScale: reducedMotion ? 0 : 1,
    });

    // Voice input hook for hands-free number entry
    const [_voiceState, voiceHandlers] = useVoiceInput(
      gridConfig,
      number => {
        if (selectedCell && !disabled) {
          handleInputChangeWithFeedback(
            selectedCell.row,
            selectedCell.col,
            number
          );
        }
      },
      command => {
        if (command === 'clear' && selectedCell) {
          handleInputChangeWithFeedback(selectedCell.row, selectedCell.col, 0);
        }
      }
    );

    const voiceHandlersRef = useRef(voiceHandlers);

    useEffect(() => {
      voiceHandlersRef.current = voiceHandlers;
    }, [voiceHandlers]);

    useEffect(() => {
      if (voiceInput) {
        voiceHandlersRef.current.enableVoiceInput();
      } else {
        voiceHandlersRef.current.disableVoiceInput();
      }
    }, [voiceInput]);

    // Adaptive touch targets for motor accessibility
    const [_touchTargetState, touchTargetHandlers] = useAdaptiveTouchTargets();

    // Enable adaptive touch targets if requested
    useEffect(() => {
      if (adaptiveTouchTargets) {
        touchTargetHandlers.enableAdaptation();
      } else {
        touchTargetHandlers.disableAdaptation();
      }
    }, [adaptiveTouchTargets, touchTargetHandlers]);

    // Visual feedback hook with memoized configuration
    const visualFeedbackConfig = useMemo(
      () => ({
        childMode,
        highContrast,
        reducedMotion,
        enableHapticFeedback: true,
        enableSoundEffects: false, // Can be enabled based on user preference
      }),
      [childMode, highContrast, reducedMotion]
    );

    const visualFeedback = useVisualFeedback(visualFeedbackConfig);

    // Initialize accessibility manager
    const accessibilityManager = useRef(getAccessibilityManager());

    // Audio accessibility hook for speech synthesis
    const [_audioState, audioHandlers] = useAudioAccessibility(
      accessibilitySettings
    );

    // Keyboard navigation hook for enhanced navigation
    const [_keyboardState, keyboardHandlers] = useKeyboardNavigation({
      gridConfig,
      disabled,
      onCellFocus: (row, col) => {
        setSelectedCell({ row, col });
        if (screenReaderMode) {
          const cellInfo = {
            value: userInput[row]?.[col] || 0,
            isFixed: puzzle[row]?.[col] !== 0,
            hasConflict: hasConflict(
              userInput,
              row,
              col,
              userInput[row]?.[col] || 0,
              gridConfig
            ),
            isHinted: hintCell?.row === row && hintCell?.col === col,
          };
          audioHandlers.speakCellDescription(row, col, gridConfig, cellInfo);
        }
      },
      onCellActivate: (row, col) => {
        handleCellClick(row, col);
      },
      onValueInput: (row, col, value) => {
        handleInputChangeWithFeedback(row, col, value);
      },
    });

    // Enhanced input change handler with visual feedback and React 19 transitions
    const handleInputChangeWithFeedback = useCallback(
      (row: number, col: number, value: number) => {
        const previousValue = userInput[row]?.[col] || 0;

        // React 19: useTransition for non-urgent updates with pending tracking
        startInputTransition(() => {
          // Call the original input change handler
          onInputChange(row, col, value);
        });

        if (value > 0 && value !== previousValue) {
          const hasConflictAfterMove = hasConflict(
            userInput,
            row,
            col,
            value,
            gridConfig
          );

          if (hasConflictAfterMove) {
            handleIncorrectMoveFeedback({
              row,
              col,
              value,
              childMode,
              highContrast,
              audioFeedback,
              screenReaderMode,
              visualFeedback,
              audioHandlers,
              accessibilityManager,
              cellRefs,
            });
            incorrectMoveCountRef.current += 1;
            onIncorrectMove?.();
            return;
          }

          handleCorrectMoveFeedback({
            row,
            col,
            value,
            childMode,
            reducedMotion,
            audioFeedback,
            screenReaderMode,
            visualFeedback,
            audioHandlers,
            accessibilityManager,
            cellRefs,
          });
          incorrectMoveCountRef.current = 0;
          onCorrectMove?.();

          if (isPuzzleComplete(userInput, puzzle, gridConfig)) {
            handlePuzzleCompletionFeedback({
              visualFeedback,
              audioFeedback,
              screenReaderMode,
              audioHandlers,
              accessibilityManager,
              onPuzzleComplete,
            });
          }
          return;
        }

        if (value === 0 && previousValue > 0) {
          handleCellClearedFeedback({
            row,
            col,
            audioFeedback,
            screenReaderMode,
            audioHandlers,
            accessibilityManager,
          });
        }
      },
      [
        userInput,
        onInputChange,
        gridConfig,
        childMode,
        visualFeedback,
        onCorrectMove,
        onIncorrectMove,
        onPuzzleComplete,
        puzzle,
        highContrast,
        reducedMotion,
        audioFeedback,
        screenReaderMode,
        audioHandlers,
      ]
    );

    const setCellRef = useCallback(
      (key: string) => {
        return (element: HTMLInputElement | null) => {
          if (element) {
            cellRefs.current[key] = element;
            // Register with keyboard navigation
            const parts = key.split('-');
            const row = Number(parts[1]);
            const col = Number(parts[2]);
            if (!Number.isNaN(row) && !Number.isNaN(col)) {
              keyboardHandlers.registerCellRef(row, col, element);
            }
          } else {
            delete cellRefs.current[key];
          }
        };
      },
      [keyboardHandlers]
    );

    const handleCellClick = useCallback(
      (row: number, col: number) => {
        if (disabled) return;
        const puzzleRow = puzzle[row];
        if (puzzleRow?.[col] === 0) {
          // Only select editable cells
          setSelectedCell({ row, col });
        }
      },
      [disabled, puzzle]
    );

    const handleLongPress = useCallback(
      (_row: number, _col: number) => {
        // Long press could trigger hint or special action in child mode
        if (childMode && !disabled) {
          // Future: trigger hint system
        }
      },
      [childMode, disabled]
    );

    const _handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent, row: number, col: number) => {
        if (disabled) return;

        const { key } = e;
        const { maxValue } = gridConfig;

        // Handle number input with dynamic range
        if (new RegExp(`[1-${maxValue}]`).test(key)) {
          e.preventDefault();
          const value = Number.parseInt(key, 10);
          handleInputChangeWithFeedback(row, col, value);
        }
        // Handle deletion
        else if (key === 'Backspace' || key === 'Delete' || key === '0') {
          e.preventDefault();
          handleInputChangeWithFeedback(row, col, 0);
        }
        // Handle navigation
        else if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
        ) {
          e.preventDefault();
          let newRow = row;
          let newCol = col;
          const maxIndex = gridConfig.size - 1;

          switch (key) {
            case 'ArrowUp':
              newRow = Math.max(0, row - 1);
              break;
            case 'ArrowDown':
              newRow = Math.min(maxIndex, row + 1);
              break;
            case 'ArrowLeft':
              newCol = Math.max(0, col - 1);
              break;
            case 'ArrowRight':
              newCol = Math.min(maxIndex, col + 1);
              break;
          }

          setSelectedCell({ row: newRow, col: newCol });
          // Focus the new cell using ref
          const newCellKey = generateCellKey(newRow, newCol);
          const newCell = cellRefs.current[newCellKey];
          newCell?.focus();
        }
      },
      [disabled, handleInputChangeWithFeedback, gridConfig]
    );

    const _handleCellKeyDown = useCallback(
      (event: React.KeyboardEvent, row: number, col: number) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCellClick(row, col);
          const newCellKey = generateCellKey(row, col);
          cellRefs.current[newCellKey]?.focus();
        }
      },
      [disabled, handleCellClick]
    );

    // Effect to announce grid size changes and initialize audio feedback
    useEffect(() => {
      if (screenReaderMode || audioFeedback) {
        // Announce grid configuration
        accessibilityManager.current.announce({
          message: accessibilityManager.current.describeGameStateChange(
            'puzzle-loaded',
            {
              gridSize: gridConfig.size,
              difficulty: getPuzzleDifficultyLabel(puzzle, gridConfig),
              clueCount: puzzle.flat().filter(cell => cell !== 0).length,
            }
          ),
          priority: 'polite',
          category: 'game-state',
        });

        // Initialize audio feedback for game state
        if (audioFeedback) {
          audioHandlers.speakGameState(gridConfig, {
            clueCount: puzzle.flat().filter(cell => cell !== 0).length,
            difficulty: getPuzzleDifficultyLabel(puzzle, gridConfig),
          });
        }
      }
    }, [gridConfig, screenReaderMode, audioFeedback, puzzle, audioHandlers]);

    // Effect to focus first editable cell when keyboard navigation is enabled
    useEffect(() => {
      if (keyboardNavigation && !disabled) {
        // Focus first editable cell after a short delay
        const timer = setTimeout(() => {
          keyboardHandlers.focusFirstEditableCell();
        }, 100);

        return () => clearTimeout(timer);
      }
      return undefined;
    }, [keyboardNavigation, disabled, keyboardHandlers]);

    return (
      <div
        className={`${styles.sudokuContainer} ${
          childMode ? styles.childMode : ''
        }`}
        data-testid="sudoku-container"
        data-grid-size={gridConfig.size}
        data-child-mode={childMode}
        data-high-contrast={accessibilitySettings.highContrast}
      >
        {/* Screen reader instructions */}
        <div id="grid-instructions" className={styles.srOnly}>
          {accessibilityManager.current.getKeyboardInstructions(gridConfig)}
        </div>

        {/* Live region for announcements */}
        <div
          id="accessibility-announcer"
          aria-live="polite"
          aria-atomic="true"
          className={styles.srOnly}
        />

        <table
          className={styles.sudokuGrid}
          aria-label={`${gridConfig.size}×${gridConfig.size} Sudoku puzzle grid with ${gridConfig.boxRows}×${gridConfig.boxCols} sub-grids. Use arrow keys to navigate between cells and number keys to enter values.`}
          aria-describedby="grid-instructions"
          data-testid="sudoku-grid"
          data-grid-size={gridConfig.size}
        >
          <tbody>
            {puzzle.map((row, rowIndex) => {
              const rowKey = `row-${rowIndex}`;
              const inputRow = userInput[rowIndex];

              return (
                <tr
                  key={rowKey}
                  aria-label={`Row ${rowIndex + 1} of ${gridConfig.size}`}
                >
                  {row.map((num, colIndex) => {
                    const isFixed = num !== 0;
                    const cellKey = generateCellKey(rowIndex, colIndex);
                    const currentValue = inputRow?.[colIndex] ?? 0;
                    const isSelected = isCellSelected(
                      selectedCell,
                      rowIndex,
                      colIndex
                    );
                    const isHinted = isCellHinted(hintCell, rowIndex, colIndex);
                    const hasError = isCellInError(
                      isFixed,
                      currentValue,
                      userInput,
                      rowIndex,
                      colIndex,
                      gridConfig
                    );
                    const borderStyle = getCellBorderStyle(
                      rowIndex,
                      colIndex,
                      gridConfig
                    );

                    return (
                      <SudokuCell
                        key={cellKey}
                        cellKey={cellKey}
                        num={num}
                        currentValue={currentValue}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        isFixed={isFixed}
                        isSelected={isSelected}
                        isHinted={isHinted}
                        hasError={hasError}
                        disabled={disabled}
                        borderStyle={borderStyle}
                        gridConfig={gridConfig}
                        childMode={childMode}
                        accessibility={accessibilitySettings}
                        onCellClick={handleCellClick}
                        onCellKeyDown={keyboardHandlers.handleCellKeyDown}
                        onInputChange={handleInputChangeWithFeedback}
                        onInputKeyDown={keyboardHandlers.handleCellKeyDown}
                        onInputFocus={(row, col) =>
                          setSelectedCell({ row, col })
                        }
                        onInputBlur={() => setSelectedCell(null)}
                        onLongPress={handleLongPress}
                        setCellRef={setCellRef}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

SudokuGrid.displayName = 'SudokuGrid';

export default SudokuGrid;
