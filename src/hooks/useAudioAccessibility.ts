/**
 * Audio Accessibility Hook - Speech synthesis and audio descriptions
 * Provides comprehensive audio feedback for visually impaired users
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GridConfig, AccessibilitySettings } from '@/types';
import { getAccessibilityManager } from '@/utils/accessibilityManager';

export interface AudioSettings {
  enabled: boolean;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
  announceGameState: boolean;
  announceMoves: boolean;
  announceErrors: boolean;
  announceHints: boolean;
  announceNavigation: boolean;
}

export interface AudioAccessibilityState {
  isSupported: boolean;
  isEnabled: boolean;
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
  currentSettings: AudioSettings;
}

export interface AudioAccessibilityHandlers {
  enableAudio: () => void;
  disableAudio: () => void;
  updateSettings: (settings: Partial<AudioSettings>) => void;
  speakGameState: (gridConfig: GridConfig, puzzleInfo?: PuzzleInfo) => void;
  speakMove: (
    row: number,
    col: number,
    value: number,
    isCorrect: boolean
  ) => void;
  speakError: (message: string, isChildFriendly?: boolean) => void;
  speakHint: (
    row: number,
    col: number,
    value: number,
    explanation?: string
  ) => void;
  speakNavigation: (message: string) => void;
  speakCellDescription: (
    row: number,
    col: number,
    gridConfig: GridConfig,
    cellInfo: CellInfo
  ) => void;
  speakPuzzleCompletion: (timeFormatted: string, hintsUsed: number) => void;
  stopSpeaking: () => void;
  testVoice: (voice: SpeechSynthesisVoice) => void;
}

export interface PuzzleInfo {
  clueCount?: number;
  difficulty?: string;
}

export interface CellInfo {
  value: number;
  isFixed: boolean;
  hasConflict: boolean;
  isHinted: boolean;
}

const defaultAudioSettings: AudioSettings = {
  enabled: false,
  rate: 0.9,
  pitch: 1.0,
  volume: 0.8,
  announceGameState: true,
  announceMoves: true,
  announceErrors: true,
  announceHints: true,
  announceNavigation: true,
};

export const useAudioAccessibility = (
  accessibilitySettings: AccessibilitySettings
): [AudioAccessibilityState, AudioAccessibilityHandlers] => {
  const resolveSpeechSynthesis = useCallback((): SpeechSynthesis | null => {
    if (
      typeof globalThis.window !== 'undefined' &&
      'speechSynthesis' in globalThis
    ) {
      return (
        (globalThis as { speechSynthesis?: SpeechSynthesis }).speechSynthesis ??
        null
      );
    }
    return null;
  }, []);

  const speechSynthesis = useRef<SpeechSynthesis | null>(
    resolveSpeechSynthesis()
  );
  const [state, setState] = useState<AudioAccessibilityState>(() => ({
    isSupported: Boolean(speechSynthesis.current),
    isEnabled: accessibilitySettings.audioFeedback,
    isSpeaking: false,
    availableVoices: [],
    currentSettings: {
      ...defaultAudioSettings,
      enabled: accessibilitySettings.audioFeedback,
    },
  }));

  const accessibilityManager = useRef(getAccessibilityManager());
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (!('speechSynthesis' in globalThis) || !globalThis.speechSynthesis) {
      return undefined;
    }

    speechSynthesis.current = globalThis.speechSynthesis;

    setState(prev => ({
      ...prev,
      isSupported: true,
      isEnabled: accessibilitySettings.audioFeedback,
      currentSettings: {
        ...prev.currentSettings,
        enabled: accessibilitySettings.audioFeedback,
      },
    }));

    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesis.current?.getVoices() || [];
      const englishVoice =
        voices.find(voice => voice.lang.startsWith('en') && voice.default) ||
        voices.find(voice => voice.lang.startsWith('en'));

      setState(prev => {
        const nextVoice = prev.currentSettings.voice ?? englishVoice;
        return {
          ...prev,
          availableVoices: voices,
          currentSettings: nextVoice
            ? { ...prev.currentSettings, voice: nextVoice }
            : prev.currentSettings,
        };
      });
    };

    // Load voices immediately and on voiceschanged event
    loadVoices();
    speechSynthesis.current.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.current?.removeEventListener('voiceschanged', loadVoices);
    };
  }, [accessibilitySettings.audioFeedback]);

  // Create speech utterance with current settings
  const createUtterance = useCallback(
    (text: string): SpeechSynthesisUtterance => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.voice = state.currentSettings.voice || null;
      utterance.rate = state.currentSettings.rate;
      utterance.pitch = state.currentSettings.pitch;
      utterance.volume = state.currentSettings.volume;
      utterance.lang = 'en-US';

      // Set up event listeners
      utterance.onstart = () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
      };

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        currentUtterance.current = null;
      };

      utterance.onerror = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        currentUtterance.current = null;
      };

      return utterance;
    },
    [state.currentSettings]
  );

  // Speak text with current settings
  const speak = useCallback(
    (text: string, interrupt: boolean = false) => {
      const synth = speechSynthesis.current ?? resolveSpeechSynthesis();

      const isEnabled = state.isEnabled || accessibilitySettings.audioFeedback;

      if (!synth || !isEnabled || !text.trim()) return;

      speechSynthesis.current = synth;

      if (interrupt) {
        synth.cancel();
      }

      const utterance = createUtterance(text);
      currentUtterance.current = utterance;
      synth.speak(utterance);
    },
    [
      state.isEnabled,
      accessibilitySettings.audioFeedback,
      createUtterance,
      resolveSpeechSynthesis,
    ]
  );

  // Enable audio feedback
  const enableAudio = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: true,
      currentSettings: {
        ...prev.currentSettings,
        enabled: true,
      },
    }));

    speak(
      'Audio descriptions enabled. You will now hear spoken feedback for game actions.'
    );
  }, [speak]);

  // Disable audio feedback
  const disableAudio = useCallback(() => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }

    setState(prev => ({
      ...prev,
      isEnabled: false,
      isSpeaking: false,
      currentSettings: {
        ...prev.currentSettings,
        enabled: false,
      },
    }));
  }, []);

  // Update audio settings
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setState(prev => ({
      ...prev,
      currentSettings: {
        ...prev.currentSettings,
        ...newSettings,
      },
    }));
  }, []);

  // Speak game state information
  const speakGameState = useCallback(
    (gridConfig: GridConfig, puzzleInfo?: PuzzleInfo) => {
      if (!state.currentSettings.announceGameState) return;

      const { size } = gridConfig;
      const clueCount = puzzleInfo?.clueCount || 'several';
      const difficulty = puzzleInfo?.difficulty || 'medium';

      const message = `New ${size} by ${size} Sudoku puzzle loaded. Difficulty level: ${difficulty}. ${clueCount} clues provided. Use arrow keys to navigate and number keys to enter values.`;

      speak(message);
    },
    [state.currentSettings.announceGameState, speak]
  );

  // Speak move information
  const speakMove = useCallback(
    (row: number, col: number, value: number, isCorrect: boolean) => {
      if (!state.currentSettings.announceMoves) return;

      const result = isCorrect ? 'Correct' : 'Incorrect';
      const message =
        value === 0
          ? `Cell cleared at row ${row + 1}, column ${col + 1}`
          : `${result} move: Number ${value} entered at row ${
              row + 1
            }, column ${col + 1}`;

      speak(message);
    },
    [state.currentSettings.announceMoves, speak]
  );

  // Speak error messages with child-friendly language
  const speakError = useCallback(
    (message: string, isChildFriendly: boolean = false) => {
      if (!state.currentSettings.announceErrors) return;

      const friendlyMessage = isChildFriendly
        ? `Oops! ${message} Let's try again!`
        : `Error: ${message}`;

      speak(friendlyMessage, true); // Interrupt other speech for errors
    },
    [state.currentSettings.announceErrors, speak]
  );

  // Speak hint information
  const speakHint = useCallback(
    (row: number, col: number, value: number, explanation?: string) => {
      if (!state.currentSettings.announceHints) return;

      let message = `Hint: Number ${value} goes in row ${row + 1}, column ${
        col + 1
      }`;

      if (explanation) {
        message += `. ${explanation}`;
      }

      speak(message);
    },
    [state.currentSettings.announceHints, speak]
  );

  // Speak navigation information
  const speakNavigation = useCallback(
    (message: string) => {
      if (!state.currentSettings.announceNavigation) return;

      speak(message);
    },
    [state.currentSettings.announceNavigation, speak]
  );

  // Speak detailed cell description
  const speakCellDescription = useCallback(
    (
      row: number,
      col: number,
      gridConfig: GridConfig,
      cellInfo: {
        value: number;
        isFixed: boolean;
        hasConflict: boolean;
        isHinted: boolean;
      }
    ) => {
      const description = accessibilityManager.current.describeSudokuCell(
        row,
        col,
        cellInfo.value,
        cellInfo.isFixed,
        gridConfig,
        cellInfo.hasConflict,
        cellInfo.isHinted
      );

      speak(description);
    },
    [speak]
  );

  // Speak puzzle completion
  const speakPuzzleCompletion = useCallback(
    (timeFormatted: string, hintsUsed: number) => {
      const message = `Congratulations! Puzzle completed successfully in ${timeFormatted}. You used ${hintsUsed} hints. Great job!`;

      speak(message, true); // Interrupt other speech for celebration
    },
    [speak]
  );

  // Stop current speech
  const stopSpeaking = useCallback(() => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }
    setState(prev => ({ ...prev, isSpeaking: false }));
    currentUtterance.current = null;
  }, []);

  // Test voice with sample text
  const testVoice = useCallback(
    (voice: SpeechSynthesisVoice) => {
      if (!speechSynthesis.current) return;

      speechSynthesis.current.cancel();

      const utterance = new SpeechSynthesisUtterance(
        'This is a test of the selected voice. You are listening to audio descriptions for the Sudoku game.'
      );

      utterance.voice = voice;
      utterance.rate = state.currentSettings.rate;
      utterance.pitch = state.currentSettings.pitch;
      utterance.volume = state.currentSettings.volume;

      speechSynthesis.current.speak(utterance);
    },
    [state.currentSettings]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

  return [
    state,
    {
      enableAudio,
      disableAudio,
      updateSettings,
      speakGameState,
      speakMove,
      speakError,
      speakHint,
      speakNavigation,
      speakCellDescription,
      speakPuzzleCompletion,
      stopSpeaking,
      testVoice,
    },
  ];
};
