import { useState, useEffect, useRef, useCallback } from 'react';
import { TextProcessor } from '../services/textProcessor';
import { PlaybackController } from '../services/playbackController';
import type {
  ProcessedWord,
  PlaybackState,
} from '../services/types';

export interface UseTextPlaybackOptions {
  text: string;
  locale?: string;
  initialWPM?: number;
}

export interface UseTextPlaybackReturn {
  // State
  isPlaying: boolean;
  currentWord: ProcessedWord | null;
  currentSentence: ProcessedWord[] | null;
  currentWordIndex: number;
  currentSentenceIndex: number;
  maxSentenceIndex: number;
  wpm: number;
  
  // Controls
  play: () => void;
  pause: () => void;
  nextWord: () => void;
  prevWord: () => void;
  nextSentence: () => void;
  prevSentence: () => void;
  reset: () => void;
  setWPM: (wpm: number) => void;
}

/**
 * React hook for text playback using Intl.Segmenter
 */
export function useTextPlayback(options: UseTextPlaybackOptions): UseTextPlaybackReturn {
  const { text, locale = 'ru', initialWPM = 200 } = options;

  const processorRef = useRef<TextProcessor | null>(null);
  const controllerRef = useRef<PlaybackController | null>(null);
  
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentWordIndex: 0,
    currentSentenceIndex: 0,
    currentWord: null,
    currentSentence: null,
    maxSentenceIndex: 0,
    wpm: initialWPM,
  });

  // Initialize processor
  useEffect(() => {
    processorRef.current = new TextProcessor({ locale });
  }, [locale]);

  // Process text and initialize/update controller
  useEffect(() => {
    if (!processorRef.current || !text) {
      return;
    }

    const processedText = processorRef.current.process(text);
    
    if (!controllerRef.current) {
      // Create new controller
      controllerRef.current = new PlaybackController(processedText, {
        wpm: initialWPM,
        onStateChange: (newState) => {
          setState(newState);
        },
      });
      
      // Set initial state
      setState(controllerRef.current.getState());
    } else {
      // Update existing controller
      controllerRef.current.updateProcessedText(processedText);
    }

    // Cleanup on unmount or text change
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
    };
  }, [text, initialWPM]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, []);

  // Control methods
  const play = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.pause();
    }
  }, []);

  const nextWord = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.nextWord();
    }
  }, []);

  const prevWord = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.prevWord();
    }
  }, []);

  const nextSentence = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.nextSentence();
    }
  }, []);

  const prevSentence = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.prevSentence();
    }
  }, []);

  const reset = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.reset();
    }
  }, []);

  const setWPM = useCallback((wpm: number) => {
    if (controllerRef.current) {
      controllerRef.current.setWPM(wpm);
    }
  }, []);

  return {
    // State
    isPlaying: state.isPlaying,
    currentWord: state.currentWord,
    currentSentence: state.currentSentence,
    currentWordIndex: state.currentWordIndex,
    currentSentenceIndex: state.currentSentenceIndex,
    maxSentenceIndex: state.maxSentenceIndex,
    wpm: state.wpm,
    
    // Controls
    play,
    pause,
    nextWord,
    prevWord,
    nextSentence,
    prevSentence,
    reset,
    setWPM,
  };
}
