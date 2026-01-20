/**
 * Voice Input Hook - Speech recognition for number entry
 * Provides voice input support for accessibility and hands-free interaction
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GridConfig } from '@/types';

export interface VoiceInputSettings {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidence: number;
}

export interface VoiceInputState {
  isSupported: boolean;
  isListening: boolean;
  isEnabled: boolean;
  lastTranscript: string;
  confidence: number;
  error: string | null;
  currentSettings: VoiceInputSettings;
}

export interface VoiceInputHandlers {
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  enableVoiceInput: () => void;
  disableVoiceInput: () => void;
  updateSettings: (settings: Partial<VoiceInputSettings>) => void;
  processVoiceCommand: (transcript: string, confidence: number) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const defaultSettings: VoiceInputSettings = {
  enabled: false,
  language: 'en-US',
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
  confidence: 0.7,
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

const SAFE_NUMBER_PATTERN = String.raw`(?:${Object.keys(NUMBER_WORDS).join('|')}|\d{1,2})`;

const CONTEXT_NUMBER_PATTERNS = [
  new RegExp(
    String.raw`\b(?:enter|put|place|set)\s+(${SAFE_NUMBER_PATTERN})\b`
  ),
  new RegExp(String.raw`\b(${SAFE_NUMBER_PATTERN})\s+(?:please|now)\b`),
];

export const useVoiceInput = (
  gridConfig: GridConfig,
  onNumberInput?: (value: number) => void,
  onVoiceCommand?: (command: string) => void
): [VoiceInputState, VoiceInputHandlers] => {
  const [state, setState] = useState<VoiceInputState>({
    isSupported: false,
    isListening: false,
    isEnabled: false,
    lastTranscript: '',
    confidence: 0,
    error: null,
    currentSettings: defaultSettings,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  // biome-ignore lint/correctness/useExhaustiveDependencies: processVoiceCommand is stable and referenced in effect
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return undefined;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.continuous = state.currentSettings.continuous;
    recognition.interimResults = state.currentSettings.interimResults;
    recognition.lang = state.currentSettings.language;
    recognition.maxAlternatives = state.currentSettings.maxAlternatives;

    // Event handlers
    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      if (!result?.[0]) return;
      const transcript = result[0].transcript.trim().toLowerCase();
      const confidence = result[0].confidence;

      setState(prev => ({
        ...prev,
        lastTranscript: transcript,
        confidence,
      }));

      // Process the voice input
      processVoiceCommand(transcript, confidence);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState(prev => ({
        ...prev,
        isListening: false,
        error: `Speech recognition error: ${event.error}`,
      }));
    };

    return () => {
      recognition.abort();
    };
  }, [state.currentSettings]);

  // Process voice commands and number input
  const processVoiceCommand = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: voice command parsing is complex
    (transcript: string, confidence: number) => {
      if (confidence < state.currentSettings.confidence) {
        return; // Confidence too low
      }

      // Check for direct number input
      const directNumber = parseInt(transcript, 10);
      if (
        !Number.isNaN(directNumber) &&
        directNumber >= 0 &&
        directNumber <= gridConfig.maxValue
      ) {
        onNumberInput?.(directNumber);
        return;
      }

      // Check for spoken numbers
      const spokenNumber = NUMBER_WORDS[transcript];
      if (
        spokenNumber !== undefined &&
        spokenNumber >= 0 &&
        spokenNumber <= gridConfig.maxValue
      ) {
        onNumberInput?.(spokenNumber);
        return;
      }

      // Check for commands
      const commands: Record<string, string> = {
        clear: 'clear',
        delete: 'clear',
        remove: 'clear',
        erase: 'clear',
        hint: 'hint',
        help: 'help',
        undo: 'undo',
        back: 'undo',
        submit: 'submit',
        check: 'submit',
        pause: 'pause',
        stop: 'stop',
      };

      // Check for partial matches in transcript
      for (const [word, command] of Object.entries(commands)) {
        if (transcript.includes(word)) {
          onVoiceCommand?.(command);
          return;
        }
      }

      // Check for number with context (e.g., "enter five", "put three")
      for (const pattern of CONTEXT_NUMBER_PATTERNS) {
        const match = transcript.match(pattern);
        if (match?.[1]) {
          const word = match[1];
          const number = NUMBER_WORDS[word] ?? parseInt(word, 10);
          if (
            !Number.isNaN(number) &&
            number >= 0 &&
            number <= gridConfig.maxValue
          ) {
            onNumberInput?.(number);
            return;
          }
        }
      }
    },
    [
      state.currentSettings.confidence,
      gridConfig.maxValue,
      onNumberInput,
      onVoiceCommand,
    ]
  );

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [state.isListening]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !state.isEnabled || state.isListening)
      return;

    try {
      recognitionRef.current.start();

      // Auto-stop after 5 seconds to prevent battery drain
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 5000);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to start voice recognition: ${error}`,
      }));
    }
  }, [state.isEnabled, state.isListening, stopListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Enable voice input
  const enableVoiceInput = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: true,
      currentSettings: {
        ...prev.currentSettings,
        enabled: true,
      },
    }));
  }, []);

  // Disable voice input
  const disableVoiceInput = useCallback(() => {
    stopListening();
    setState(prev => ({
      ...prev,
      isEnabled: false,
      currentSettings: {
        ...prev.currentSettings,
        enabled: false,
      },
    }));
  }, [stopListening]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<VoiceInputSettings>) => {
      setState(prev => ({
        ...prev,
        currentSettings: {
          ...prev.currentSettings,
          ...newSettings,
        },
      }));

      // Update recognition settings if available
      if (recognitionRef.current) {
        const recognition = recognitionRef.current;
        if (newSettings.continuous !== undefined) {
          recognition.continuous = newSettings.continuous;
        }
        if (newSettings.interimResults !== undefined) {
          recognition.interimResults = newSettings.interimResults;
        }
        if (newSettings.language !== undefined) {
          recognition.lang = newSettings.language;
        }
        if (newSettings.maxAlternatives !== undefined) {
          recognition.maxAlternatives = newSettings.maxAlternatives;
        }
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stopListening]);

  return [
    state,
    {
      startListening,
      stopListening,
      toggleListening,
      enableVoiceInput,
      disableVoiceInput,
      updateSettings,
      processVoiceCommand,
    },
  ];
};
