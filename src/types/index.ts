export type GridSize = 4 | 6 | 9;

export interface GridConfig {
  readonly size: GridSize;
  readonly boxRows: number;
  readonly boxCols: number;
  readonly maxValue: number;
  readonly minClues: number;
  readonly maxClues: number;
  readonly difficultyLevels: number;
  readonly cellSize: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  readonly childFriendly: {
    enableAnimations: boolean;
    showHelpText: boolean;
    useExtraLargeTargets: boolean;
  };
}

export interface GridDimensions {
  cellSize: number;
  gridSize: number;
  padding: number;
  borderWidth: number;
}

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  largeText: boolean;
  audioFeedback: boolean;
  keyboardNavigation: boolean;
  voiceInput: boolean;
  adaptiveTouchTargets: boolean;
}

export interface ProgressStats {
  puzzlesCompleted: number;
  totalTime: number;
  averageTime: number;
  bestTime: number;
  hintsUsed: number;
  achievements: string[];
  streakCount: number;
  longestStreak: number;
  perfectGames: number;
  lastPlayed: Date | null;
  dailyStreak: number;
  weeklyGoalProgress: number;
  starsEarned: number;
  badgesEarned: number;
  stickersEarned: number;
  improvementRate: number;
  consistencyScore: number;
  difficultyProgression: number;
}

export interface GameState {
  // Core game state
  puzzle: number[][] | null;
  solution: number[][] | null;
  difficulty: number;
  error: string | null;
  userInput: number[][];
  history: number[][][];
  time: number;
  timerActive: boolean;
  isCorrect: boolean | null;
  isPaused: boolean;
  isLoading: boolean;
  hintsUsed: number;
  showHint: { row: number; col: number; message: string } | null;

  // Multi-size support
  gridConfig: GridConfig;

  // Child-friendly features
  childMode: boolean;

  // Accessibility features
  accessibility: AccessibilitySettings;

  // Progress tracking per grid size
  progress: Record<string, ProgressStats>; // key format: "4x4", "6x6", "9x9"
}

export type GameAction =
  | { type: 'SET_PUZZLE'; payload: SudokuPuzzle }
  | { type: 'SET_ERROR'; payload: string }
  | {
      type: 'UPDATE_USER_INPUT';
      payload: { row: number; col: number; value: number };
    }
  | { type: 'SET_DIFFICULTY'; payload: number }
  | { type: 'CHECK_ANSWER' }
  | { type: 'TICK' }
  | { type: 'RESET' }
  | { type: 'RESET_AND_FETCH' }
  | { type: 'PAUSE_RESUME' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UNDO' }
  | { type: 'USE_HINT' }
  | {
      type: 'SHOW_HINT';
      payload: { row: number; col: number; message: string };
    }
  | { type: 'CLEAR_HINT' }
  // Multi-size support actions
  | { type: 'CHANGE_GRID_SIZE'; payload: GridConfig }
  | { type: 'SET_GRID_CONFIG'; payload: GridConfig }
  // Child-friendly feature actions
  | { type: 'TOGGLE_CHILD_MODE' }
  | { type: 'SET_CHILD_MODE'; payload: boolean }
  // Accessibility actions
  | { type: 'UPDATE_ACCESSIBILITY'; payload: Partial<AccessibilitySettings> }
  | { type: 'TOGGLE_HIGH_CONTRAST' }
  | { type: 'TOGGLE_REDUCED_MOTION' }
  | { type: 'TOGGLE_SCREEN_READER_MODE' }
  | { type: 'TOGGLE_VOICE_INPUT' }
  | { type: 'TOGGLE_ADAPTIVE_TOUCH_TARGETS' }
  // Progress tracking actions
  | {
      type: 'UPDATE_PROGRESS';
      payload: { gridSize: string; stats: Partial<ProgressStats> };
    }
  | {
      type: 'COMPLETE_PUZZLE';
      payload: { gridSize: string; time: number; hintsUsed: number };
    }
  | {
      type: 'ADD_ACHIEVEMENT';
      payload: { gridSize: string; achievement: string };
    };

export interface TimerProps {
  time: number;
  isActive: boolean;
  isPaused: boolean;
}

export interface DifficultySelectProps {
  difficulty: number;
  onChange: (difficulty: number) => void;
  disabled?: boolean;
  isLoading?: boolean;
  gridSize?: 4 | 6 | 9; // Grid size to determine available difficulty levels
}

export interface GameControlsProps {
  onSubmit: () => void;
  onReset: () => void;
  onPauseResume: () => void;
  onUndo: () => void;
  onHint: () => void;
  isCorrect: boolean | null;
  isPaused: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  canUndo?: boolean;
  hintsUsed?: number;
}

export interface PWAGridSelectorProps {
  currentSize: 4 | 6 | 9;
  onSizeChange: (size: 4 | 6 | 9) => void;
  childMode?: boolean;
  showDescriptions?: boolean;
  disabled?: boolean;
  // PWA features
  offlineMode?: boolean;
  onInstallPrompt?: () => void;
  notificationPermission?: NotificationPermission;
}

export interface TouchOptimizedControlsProps {
  onHint: () => void;
  onCelebrate: () => void;
  onEncourage: () => void;
  hintsRemaining: number;
  showMagicWand: boolean;
  disabled?: boolean;
  childMode?: boolean;
  gridConfig: GridConfig;
  // Modern touch features
  hapticFeedback?: {
    success: () => void;
    error: () => void;
    hint: () => void;
  };
  gestureHandlers?: {
    onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void;
    onLongPress: () => void;
    onPinch: (scale: number) => void;
  };
  // Accessibility
  reducedMotion?: boolean;
  highContrast?: boolean;
}

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;

  // Cell colors
  cellBackground: string;
  cellBackgroundFilled: string;
  cellBackgroundSelected: string;
  cellBackgroundHighlight: string;
  cellBorder: string;
  cellBorderThick: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnSecondary: string;

  // State colors
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  error: string;
  errorBackground: string;
  info: string;
  infoBackground: string;

  // Child-friendly colors
  celebration: string;
  encouragement: string;
  hint: string;
  hintBackground: string;

  // Focus and interaction
  focus: string;
  focusBackground: string;
  hover: string;
  active: string;
}

export interface ThemeAccessibility {
  // WCAG AAA compliance
  contrastRatio: number;
  largeTextContrastRatio: number;

  // Focus indicators
  focusIndicatorWidth: number;
  focusIndicatorStyle: 'solid' | 'dashed' | 'dotted';
  focusIndicatorOffset: number;

  // Touch targets
  minimumTouchTarget: number;
  recommendedTouchTarget: number;

  // Animation and motion
  animationDuration: number;
  reducedMotionDuration: number;

  // Text and spacing
  minimumFontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface ThemeChildFriendly {
  // Visual design
  roundedCorners: number;
  shadowIntensity: number;
  borderWidth: number;

  // Animations
  enableAnimations: boolean;
  celebrationIntensity: 'subtle' | 'moderate' | 'festive';

  // Feedback
  enableSoundEffects: boolean;
  enableHapticFeedback: boolean;
  enableVisualFeedback: boolean;

  // Layout
  extraPadding: number;
  largerButtons: boolean;
  simplifiedLayout: boolean;
}

export interface ThemeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'child-friendly' | 'standard' | 'high-contrast' | 'custom';

  colors: ThemeColors;
  accessibility: ThemeAccessibility;
  childFriendly: ThemeChildFriendly;

  // Theme metadata
  isDefault: boolean;
  supportsDarkMode: boolean;
  supportsHighContrast: boolean;
  ageGroup: 'all' | 'children' | 'adults';

  // CSS custom properties mapping
  cssVariables: Record<string, string>;
}

export interface ThemeContextValue {
  currentTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  setTheme: (themeId: string) => void;
  toggleHighContrast: () => void;
  isHighContrastMode: boolean;
  validateThemeCompliance: (theme: ThemeConfig) => boolean;
}
