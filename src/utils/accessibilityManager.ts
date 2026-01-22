/**
 * Accessibility Manager - Comprehensive screen reader and keyboard navigation support
 * Implements WCAG AAA compliance with audio descriptions and keyboard navigation
 */

import type { AccessibilitySettings, GridConfig } from '@/types';

type GameStateChangeDetails = {
  gridSize?: number;
  difficulty?: string;
  clueCount?: number;
  isCorrect?: boolean;
  value?: number;
  row?: number;
  col?: number;
  timeFormatted?: string;
  hintsUsed?: number;
  hintsRemaining?: number;
  message?: string;
  errorType?: string;
};

const describePuzzleLoaded = (details: GameStateChangeDetails) =>
  `New ${details.gridSize}×${details.gridSize} Sudoku puzzle loaded with ${details.difficulty} difficulty. ${details.clueCount} numbers are provided as clues.`;

const describeMoveMade = (details: GameStateChangeDetails) => {
  const moveResult = details.isCorrect ? 'correct' : 'incorrect';
  const row = typeof details.row === 'number' ? details.row + 1 : 'unknown';
  const col = typeof details.col === 'number' ? details.col + 1 : 'unknown';
  const value = typeof details.value === 'number' ? details.value : 'unknown';
  return `Number ${value} entered in row ${row}, column ${col}. Move is ${moveResult}.`;
};

const describeHintUsed = (details: GameStateChangeDetails) => {
  const row = typeof details.row === 'number' ? details.row + 1 : 'unknown';
  const col = typeof details.col === 'number' ? details.col + 1 : 'unknown';
  const value = typeof details.value === 'number' ? details.value : 'unknown';
  const hintsRemaining =
    typeof details.hintsRemaining === 'number'
      ? `${details.hintsRemaining} hints remaining.`
      : '';
  return `Hint revealed: Number ${value} goes in row ${row}, column ${col}. ${hintsRemaining}`.trim();
};

const describeErrorOccurred = (details: GameStateChangeDetails) =>
  `Error: ${details.message ?? 'An unexpected error occurred.'} Please try again.`;

export interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  delay?: number;
  category: 'game-state' | 'error' | 'success' | 'navigation' | 'hint';
}

export interface KeyboardNavigationState {
  currentCell: { row: number; col: number } | null;
  focusedElement: string | null;
  navigationMode: 'grid' | 'controls' | 'menu';
  tabOrder: string[];
}

export interface AudioDescription {
  text: string;
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

class AccessibilityManager {
  private announcer: HTMLElement | null = null;
  private keyboardState: KeyboardNavigationState;
  private speechSynthesis: SpeechSynthesis | null = null;
  private announcementQueue: ScreenReaderAnnouncement[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.keyboardState = {
      currentCell: null,
      focusedElement: null,
      navigationMode: 'grid',
      tabOrder: [],
    };

    this.initializeScreenReader();
    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize screen reader support with live regions
   */
  private initializeScreenReader(): void {
    // Create or find the live region for announcements
    this.announcer = document.getElementById('accessibility-announcer');

    if (!this.announcer) {
      this.announcer = document.createElement('div');
      this.announcer.id = 'accessibility-announcer';
      this.announcer.setAttribute('aria-live', 'polite');
      this.announcer.setAttribute('aria-atomic', 'true');
      this.announcer.setAttribute('aria-relevant', 'additions text');
      this.announcer.style.position = 'absolute';
      this.announcer.style.left = '-10000px';
      this.announcer.style.width = '1px';
      this.announcer.style.height = '1px';
      this.announcer.style.overflow = 'hidden';
      document.body.appendChild(this.announcer);
    }
  }

  /**
   * Initialize speech synthesis for audio descriptions
   */
  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in globalThis) {
      this.speechSynthesis = globalThis.speechSynthesis;
    }
  }

  /**
   * Announce message to screen readers with priority handling
   */
  public announce(announcement: ScreenReaderAnnouncement): void {
    this.announcementQueue.push(announcement);

    if (!this.isProcessingQueue) {
      this.processAnnouncementQueue();
    }
  }

  /**
   * Process the announcement queue with proper timing
   */
  private async processAnnouncementQueue(): Promise<void> {
    if (this.announcementQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const announcement = this.announcementQueue.shift();
    if (!announcement) {
      this.isProcessingQueue = false;
      return;
    }

    // Handle high priority announcements immediately
    if (announcement.priority === 'assertive') {
      this.clearPreviousAnnouncements();
    }

    // Wait for delay if specified
    if (announcement.delay) {
      await new Promise(resolve => setTimeout(resolve, announcement.delay));
    }

    // Make the announcement
    if (this.announcer) {
      this.announcer.setAttribute('aria-live', announcement.priority);
      this.announcer.textContent = announcement.message;
    }

    // Continue processing queue after a brief pause
    setTimeout(() => {
      this.processAnnouncementQueue();
    }, 500);
  }

  /**
   * Clear previous announcements for urgent messages
   */
  private clearPreviousAnnouncements(): void {
    if (this.announcer) {
      this.announcer.textContent = '';
    }
    this.announcementQueue = [];
  }

  /**
   * Provide audio description using speech synthesis
   */
  public speakDescription(description: AudioDescription): void {
    if (!this.speechSynthesis || !description.text) return;

    // Cancel any current speech
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(description.text);

    // Configure voice settings
    if (description.voice) {
      utterance.voice = description.voice;
    }
    utterance.rate = description.rate ?? 0.9;
    utterance.pitch = description.pitch ?? 1;
    utterance.volume = description.volume ?? 0.8;

    // Set language for better pronunciation
    utterance.lang = 'en-US';

    this.speechSynthesis.speak(utterance);
  }

  /**
   * Stop current audio description
   */
  public stopSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  /**
   * Get available voices for speech synthesis
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.speechSynthesis) return [];
    return this.speechSynthesis.getVoices();
  }

  /**
   * Generate comprehensive cell description for screen readers
   */
  public describeSudokuCell(
    row: number,
    col: number,
    value: number,
    isFixed: boolean,
    gridConfig: GridConfig,
    hasConflict: boolean = false,
    isHinted: boolean = false
  ): string {
    const { boxRows, boxCols } = gridConfig;

    // Calculate sub-grid position
    const subGridRow = Math.floor(row / boxRows) + 1;
    const subGridCol = Math.floor(col / boxCols) + 1;
    const subGridPosition = `sub-grid ${subGridRow}, ${subGridCol}`;

    // Build description parts
    const parts: string[] = [];

    // Cell position
    parts.push(`Cell row ${row + 1}, column ${col + 1}`);
    parts.push(`in ${subGridPosition}`);

    // Cell value and type
    if (isFixed) {
      parts.push(`contains fixed number ${value}`);
    } else if (value > 0) {
      parts.push(`contains entered number ${value}`);
    } else {
      parts.push('is empty');
    }

    // Conflict status
    if (hasConflict) {
      parts.push('has conflict with other numbers');
    }

    // Hint status
    if (isHinted) {
      parts.push('is highlighted as a hint');
    }

    // Valid range
    parts.push(`Valid numbers are 1 to ${gridConfig.maxValue}`);

    return `${parts.join(', ')}.`;
  }

  /**
   * Describe game state changes for screen readers
   */
  public describeGameStateChange(
    type:
      | 'puzzle-loaded'
      | 'move-made'
      | 'puzzle-completed'
      | 'hint-used'
      | 'error-occurred',
    details: GameStateChangeDetails = {}
  ): string {
    switch (type) {
      case 'puzzle-loaded':
        return describePuzzleLoaded(details);
      case 'move-made':
        return describeMoveMade(details);
      case 'puzzle-completed':
        return `Congratulations! Puzzle completed successfully in ${details.timeFormatted}. You used ${details.hintsUsed} hints.`;
      case 'hint-used':
        return describeHintUsed(details);
      case 'error-occurred':
        return describeErrorOccurred(details);
      default:
        return 'Game state changed.';
    }
  }

  /**
   * Update keyboard navigation state
   */
  public updateKeyboardNavigation(
    state: Partial<KeyboardNavigationState>
  ): void {
    this.keyboardState = { ...this.keyboardState, ...state };
  }

  /**
   * Get current keyboard navigation state
   */
  public getKeyboardState(): KeyboardNavigationState {
    return { ...this.keyboardState };
  }

  /**
   * Generate keyboard navigation instructions
   */
  public getKeyboardInstructions(gridConfig: GridConfig): string {
    const { size } = gridConfig;

    return [
      'Keyboard navigation instructions:',
      'Use arrow keys to move between cells.',
      `Press numbers 1 to ${gridConfig.maxValue} to enter values.`,
      'Press Backspace or Delete to clear a cell.',
      'Press Tab to move to game controls.',
      'Press Shift+Tab to move backwards.',
      'Press Enter or Space to activate buttons.',
      'Press Escape to return to the grid.',
      `Grid size is ${size} by ${size} with ${size} sub-grids.`,
    ].join(' ');
  }

  /**
   * Create ARIA labels for grid elements
   */
  public createGridAriaLabel(gridConfig: GridConfig): string {
    const { size, boxRows, boxCols } = gridConfig;
    return `${size} by ${size} Sudoku puzzle grid with ${boxRows} by ${boxCols} sub-grids. Use arrow keys to navigate and number keys to enter values.`;
  }

  /**
   * Create ARIA description for cell input
   */
  public createCellAriaDescription(
    row: number,
    col: number,
    gridConfig: GridConfig,
    isFixed: boolean
  ): string {
    if (isFixed) {
      return `Fixed cell in row ${row + 1}, column ${
        col + 1
      }. Cannot be edited.`;
    }

    return `Editable cell in row ${row + 1}, column ${
      col + 1
    }. Enter numbers 1 to ${
      gridConfig.maxValue
    }. Use arrow keys to navigate to other cells.`;
  }

  /**
   * Announce grid size change
   */
  public announceGridSizeChange(newSize: 4 | 6 | 9, oldSize?: 4 | 6 | 9): void {
    const message = oldSize
      ? `Grid size changed from ${oldSize}×${oldSize} to ${newSize}×${newSize}. New puzzle will be generated.`
      : `${newSize}×${newSize} grid selected. Generating new puzzle.`;

    this.announce({
      message,
      priority: 'polite',
      category: 'game-state',
      delay: 500,
    });
  }

  /**
   * Announce accessibility setting changes
   */
  public announceAccessibilityChange(
    setting: keyof AccessibilitySettings,
    enabled: boolean
  ): void {
    const settingNames: Record<keyof AccessibilitySettings, string> = {
      highContrast: 'High contrast mode',
      reducedMotion: 'Reduced motion',
      screenReaderMode: 'Screen reader mode',
      largeText: 'Large text',
      audioFeedback: 'Audio feedback',
      keyboardNavigation: 'Enhanced keyboard navigation',
      voiceInput: 'Voice input',
      adaptiveTouchTargets: 'Adaptive touch targets',
    };

    const message = `${settingNames[setting]} ${
      enabled ? 'enabled' : 'disabled'
    }.`;

    this.announce({
      message,
      priority: 'polite',
      category: 'navigation',
    });
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopSpeaking();
    this.announcementQueue = [];
    this.isProcessingQueue = false;

    this.announcer?.remove();
  }
}

// Singleton instance
let accessibilityManagerInstance: AccessibilityManager | null = null;

export const getAccessibilityManager = (): AccessibilityManager => {
  if (!accessibilityManagerInstance) {
    accessibilityManagerInstance = new AccessibilityManager();
  }
  return accessibilityManagerInstance;
};

export default AccessibilityManager;
