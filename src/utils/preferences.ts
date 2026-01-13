import type { AccessibilitySettings, ProgressStats, GridConfig } from '@/types';

/**
 * Keys for localStorage
 */
const STORAGE_KEYS = {
  ACCESSIBILITY: 'sudoku-accessibility-settings',
  PROGRESS: 'sudoku-progress-stats',
  CHILD_MODE: 'sudoku-child-mode',
  GRID_CONFIG: 'sudoku-grid-config',
  DIFFICULTY: 'sudoku-difficulty',
} as const;

/**
 * User preferences interface
 */
export interface UserPreferences {
  accessibility: AccessibilitySettings;
  progress: Record<string, ProgressStats>;
  childMode: boolean;
  gridConfig: GridConfig;
  difficulty: number;
}

/**
 * Default preferences
 */
const defaultAccessibilitySettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  screenReaderMode: false,
  largeText: false,
  audioFeedback: false,
  keyboardNavigation: false,
  voiceInput: false,
  adaptiveTouchTargets: false,
};

const defaultProgressStats: ProgressStats = {
  puzzlesCompleted: 0,
  totalTime: 0,
  averageTime: 0,
  bestTime: 0,
  hintsUsed: 0,
  achievements: [],
  streakCount: 0,
  longestStreak: 0,
  perfectGames: 0,
  lastPlayed: null,
  dailyStreak: 0,
  weeklyGoalProgress: 0,
  starsEarned: 0,
  badgesEarned: 0,
  stickersEarned: 0,
  improvementRate: 0,
  consistencyScore: 0,
  difficultyProgression: 0,
};

const createDefaultProgressStats = (): ProgressStats => ({
  ...defaultProgressStats,
  achievements: [...defaultProgressStats.achievements],
});

const isAccessibilitySettings = (
  value: unknown
): value is AccessibilitySettings => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as AccessibilitySettings;
  return (
    typeof candidate.highContrast === 'boolean' &&
    typeof candidate.reducedMotion === 'boolean' &&
    typeof candidate.screenReaderMode === 'boolean' &&
    typeof candidate.largeText === 'boolean' &&
    typeof candidate.audioFeedback === 'boolean' &&
    typeof candidate.keyboardNavigation === 'boolean' &&
    typeof candidate.voiceInput === 'boolean' &&
    typeof candidate.adaptiveTouchTargets === 'boolean'
  );
};

const getLocalStorage = (): Storage | undefined => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return (globalThis as { localStorage?: Storage }).localStorage;
  }
  return undefined;
};

const normalizeDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const normalizeNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeAchievements = (value: unknown) =>
  Array.isArray(value) && value.every(item => typeof item === 'string')
    ? value
    : [];

const normalizeProgressStats = (value: unknown): ProgressStats => {
  if (!value || typeof value !== 'object') {
    return createDefaultProgressStats();
  }

  const candidate = value as Partial<ProgressStats>;
  const defaults = createDefaultProgressStats();

  return {
    puzzlesCompleted: normalizeNumber(
      candidate.puzzlesCompleted,
      defaults.puzzlesCompleted
    ),
    totalTime: normalizeNumber(candidate.totalTime, defaults.totalTime),
    averageTime: normalizeNumber(candidate.averageTime, defaults.averageTime),
    bestTime: normalizeNumber(candidate.bestTime, defaults.bestTime),
    hintsUsed: normalizeNumber(candidate.hintsUsed, defaults.hintsUsed),
    achievements: normalizeAchievements(candidate.achievements),
    streakCount: normalizeNumber(candidate.streakCount, defaults.streakCount),
    lastPlayed: normalizeDate(candidate.lastPlayed),
    longestStreak: normalizeNumber(candidate.longestStreak, defaults.longestStreak),
    perfectGames: normalizeNumber(candidate.perfectGames, defaults.perfectGames),
    dailyStreak: normalizeNumber(candidate.dailyStreak, defaults.dailyStreak),
    weeklyGoalProgress: normalizeNumber(
      candidate.weeklyGoalProgress,
      defaults.weeklyGoalProgress
    ),
    starsEarned: normalizeNumber(candidate.starsEarned, defaults.starsEarned),
    badgesEarned: normalizeNumber(candidate.badgesEarned, defaults.badgesEarned),
    stickersEarned: normalizeNumber(
      candidate.stickersEarned,
      defaults.stickersEarned
    ),
    improvementRate: normalizeNumber(
      candidate.improvementRate,
      defaults.improvementRate
    ),
    consistencyScore: normalizeNumber(
      candidate.consistencyScore,
      defaults.consistencyScore
    ),
    difficultyProgression: normalizeNumber(
      candidate.difficultyProgression,
      defaults.difficultyProgression
    ),
  };
};

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  try {
    const test = '__localStorage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely get item from localStorage
 */
function getStorageItem<T>(key: string, defaultValue: T): T {
  const storage = getLocalStorage();
  if (!storage || !isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = storage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 */
function setStorageItem<T>(key: string, value: T): void {
  const storage = getLocalStorage();
  if (!storage || !isLocalStorageAvailable()) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if storage is full or unavailable
  }
}

/**
 * Load accessibility settings from localStorage
 */
export function loadAccessibilitySettings(): AccessibilitySettings {
  const stored = getStorageItem(
    STORAGE_KEYS.ACCESSIBILITY,
    defaultAccessibilitySettings
  );
  return isAccessibilitySettings(stored)
    ? stored
    : { ...defaultAccessibilitySettings };
}

/**
 * Save accessibility settings to localStorage
 */
export function saveAccessibilitySettings(
  settings: AccessibilitySettings
): void {
  setStorageItem(STORAGE_KEYS.ACCESSIBILITY, settings);
}

/**
 * Load progress statistics from localStorage
 */
export function loadProgressStats(): Record<string, ProgressStats> {
  const defaultProgress = {
    '4x4': createDefaultProgressStats(),
    '6x6': createDefaultProgressStats(),
    '9x9': createDefaultProgressStats(),
  };

  const stored = getStorageItem(STORAGE_KEYS.PROGRESS, defaultProgress);
  const storedProgress =
    stored && typeof stored === 'object'
      ? (stored as Record<string, unknown>)
      : {};

  // Ensure all grid sizes have progress data
  return {
    '4x4': normalizeProgressStats(storedProgress['4x4']),
    '6x6': normalizeProgressStats(storedProgress['6x6']),
    '9x9': normalizeProgressStats(storedProgress['9x9']),
  };
}

/**
 * Save progress statistics to localStorage
 */
export function saveProgressStats(
  progress: Record<string, ProgressStats>
): void {
  setStorageItem(STORAGE_KEYS.PROGRESS, progress);
}

/**
 * Update progress for a specific grid size
 */
export function updateGridProgress(
  gridSize: string,
  stats: Partial<ProgressStats>
): void {
  const currentProgress = loadProgressStats();
  const currentStats =
    currentProgress[gridSize] ?? createDefaultProgressStats();
  const nextStats: ProgressStats = { ...currentStats, ...stats };
  const updatedProgress: Record<string, ProgressStats> = {
    ...currentProgress,
    [gridSize]: nextStats,
  };
  saveProgressStats(updatedProgress);
}

/**
 * Load child mode preference from localStorage
 */
export function loadChildMode(): boolean {
  return getStorageItem(STORAGE_KEYS.CHILD_MODE, false);
}

/**
 * Save child mode preference to localStorage
 */
export function saveChildMode(childMode: boolean): void {
  setStorageItem(STORAGE_KEYS.CHILD_MODE, childMode);
}

/**
 * Load grid configuration from localStorage
 */
export function loadGridConfig(): GridConfig | null {
  return getStorageItem(STORAGE_KEYS.GRID_CONFIG, null);
}

/**
 * Save grid configuration to localStorage
 */
export function saveGridConfig(gridConfig: GridConfig): void {
  setStorageItem(STORAGE_KEYS.GRID_CONFIG, gridConfig);
}

/**
 * Load difficulty preference from localStorage
 */
export function loadDifficulty(): number {
  return getStorageItem(STORAGE_KEYS.DIFFICULTY, 1);
}

/**
 * Save difficulty preference to localStorage
 */
export function saveDifficulty(difficulty: number): void {
  setStorageItem(STORAGE_KEYS.DIFFICULTY, difficulty);
}

/**
 * Load all user preferences from localStorage
 */
export function loadUserPreferences(): Partial<UserPreferences> {
  const gridConfig = loadGridConfig();
  return {
    accessibility: loadAccessibilitySettings(),
    progress: loadProgressStats(),
    childMode: loadChildMode(),
    ...(gridConfig ? { gridConfig } : {}),
    difficulty: loadDifficulty(),
  };
}

/**
 * Save all user preferences to localStorage
 */
export function saveUserPreferences(
  preferences: Partial<UserPreferences>
): void {
  if (preferences.accessibility) {
    saveAccessibilitySettings(preferences.accessibility);
  }
  if (preferences.progress) {
    saveProgressStats(preferences.progress);
  }
  if (preferences.childMode !== undefined) {
    saveChildMode(preferences.childMode);
  }
  if (preferences.gridConfig) {
    saveGridConfig(preferences.gridConfig);
  }
  if (preferences.difficulty !== undefined) {
    saveDifficulty(preferences.difficulty);
  }
}

/**
 * Clear all preferences from localStorage
 */
export function clearAllPreferences(): void {
  const storage = getLocalStorage();
  if (!storage || !isLocalStorageAvailable()) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      storage.removeItem(key);
    } catch {
      // Silently fail
    }
  });
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): { available: boolean; usage?: number } {
  const storage = getLocalStorage();
  if (!storage || !isLocalStorageAvailable()) {
    return { available: false };
  }

  try {
    let totalSize = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = storage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    });

    return { available: true, usage: totalSize };
  } catch {
    return { available: false };
  }
}
