import { useState, useEffect, useRef, useCallback } from 'react';
import { saveProgress, getProgress, type Settings, type Book } from '../utils/db';
import { getWordParts } from '../utils/textProcessor';
import { BookIterator } from '../utils/bookIterator';

export interface ReaderState {
  volumeId: string;
  chapterId: string;
  sentenceIndex: number;
  wordIndex: number;
  isPlaying: boolean;
  currentWPM: number;
  showFullSentence: boolean;
}

interface UseReaderOptions {
  book: Book | null;
  bookId: string | null;
  settings: Settings;
}

export function useReader({ book, bookId, settings }: UseReaderOptions) {
  const iteratorRef = useRef<BookIterator | null>(null);
  
  const [state, setState] = useState<ReaderState>({
    volumeId: '',
    chapterId: '',
    sentenceIndex: 0,
    wordIndex: 0,
    isPlaying: false,
    currentWPM: settings.initWPM,
    showFullSentence: false,
  });
  
  const [sessionStartTime] = useState(Date.now());
  const [wordsRead, setWordsRead] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const warmupStartTimeRef = useRef<number | null>(null);

  // Initialize iterator when book changes
  useEffect(() => {
    if (book) {
      iteratorRef.current = new BookIterator(book);
      
      // Initialize to first chapter if not set
      if (!state.volumeId || !state.chapterId) {
        const firstVolume = book.structure.volumes[0];
        if (firstVolume && firstVolume.chapters.length > 0) {
          setState((prev) => ({
            ...prev,
            volumeId: firstVolume.id,
            chapterId: firstVolume.chapters[0].id,
            sentenceIndex: 0,
            wordIndex: 0,
          }));
        }
      }
    }
  }, [book]);

  // Load progress on mount
  useEffect(() => {
    if (bookId && book && iteratorRef.current) {
      getProgress(bookId).then((progress) => {
        if (progress) {
          setState((prev) => ({
            ...prev,
            volumeId: progress.volumeId,
            chapterId: progress.chapterId,
            sentenceIndex: progress.sentenceIndex,
            wordIndex: progress.wordIndex,
          }));
        }
      });
    }
  }, [bookId, book]);
  
  // Reset warmup when settings change
  useEffect(() => {
    warmupStartTimeRef.current = null;
    setState((prev) => ({ ...prev, currentWPM: settings.initWPM }));
  }, [settings.initWPM, settings.maxWPM, settings.warmupDuration]);
  
  // Calculate current WPM with warmup
  const calculateCurrentWPM = useCallback(() => {
    if (!warmupStartTimeRef.current) {
      warmupStartTimeRef.current = Date.now();
    }
    
    const elapsed = Date.now() - warmupStartTimeRef.current;
    const warmupProgress = Math.min(elapsed / settings.warmupDuration, 1);
    
    const wpm = settings.initWPM + (settings.maxWPM - settings.initWPM) * warmupProgress;
    return Math.round(wpm);
  }, [settings]);


  // Get current word parts
  const getCurrentWord = useCallback((): { firstPart: string; middleLetter: string; secondPart: string } | null => {
    if (!iteratorRef.current) return null;
    
    const word = iteratorRef.current.getWord(
      state.volumeId,
      state.chapterId,
      state.sentenceIndex,
      state.wordIndex
    );
    
    if (!word) return null;
    
    const language = iteratorRef.current.getLanguage();
    const parts = getWordParts(word, language);
    return {
      firstPart: parts.before,
      middleLetter: parts.vowel,
      secondPart: parts.after,
    };
  }, [state.volumeId, state.chapterId, state.sentenceIndex, state.wordIndex]);
  
  // Get current sentence
  const getCurrentSentence = useCallback((): string[] => {
    if (!iteratorRef.current) return [];
    return iteratorRef.current.getSentence(state.volumeId, state.chapterId, state.sentenceIndex) || [];
  }, [state.volumeId, state.chapterId, state.sentenceIndex]);

  // Get current chapter sentence count
  const getCurrentChapterSentenceCount = useCallback((): number => {
    if (!iteratorRef.current) return 0;
    return iteratorRef.current.getSentenceCount(state.volumeId, state.chapterId);
  }, [state.volumeId, state.chapterId]);

  // Get word index within current sentence (always returns state.wordIndex for book structure)
  const getWordIndexInSentence = useCallback((): number => {
    return state.wordIndex;
  }, [state.wordIndex]);

  // Helper to find next chapter
  const findNextChapter = useCallback((currentVolumeId: string, currentChapterId: string): { volumeId: string; chapterId: string } | null => {
    if (!book) return null;

    const currentVolumeIndex = book.structure.volumes.findIndex(v => v.id === currentVolumeId);
    if (currentVolumeIndex === -1) return null;

    const currentVolume = book.structure.volumes[currentVolumeIndex];
    const currentChapterIndex = currentVolume.chapters.findIndex(c => c.id === currentChapterId);
    
    // Check if there's a next chapter in current volume
    if (currentChapterIndex < currentVolume.chapters.length - 1) {
      return {
        volumeId: currentVolumeId,
        chapterId: currentVolume.chapters[currentChapterIndex + 1].id,
      };
    }

    // Check if there's a next volume
    if (currentVolumeIndex < book.structure.volumes.length - 1) {
      const nextVolume = book.structure.volumes[currentVolumeIndex + 1];
      if (nextVolume.chapters.length > 0) {
        return {
          volumeId: nextVolume.id,
          chapterId: nextVolume.chapters[0].id,
        };
      }
    }

    return null;
  }, [book]);

  // Helper to find previous chapter
  const findPrevChapter = useCallback((currentVolumeId: string, currentChapterId: string): { volumeId: string; chapterId: string } | null => {
    if (!book) return null;

    const currentVolumeIndex = book.structure.volumes.findIndex(v => v.id === currentVolumeId);
    if (currentVolumeIndex === -1) return null;

    const currentVolume = book.structure.volumes[currentVolumeIndex];
    const currentChapterIndex = currentVolume.chapters.findIndex(c => c.id === currentChapterId);
    
    // Check if there's a previous chapter in current volume
    if (currentChapterIndex > 0) {
      return {
        volumeId: currentVolumeId,
        chapterId: currentVolume.chapters[currentChapterIndex - 1].id,
      };
    }

    // Check if there's a previous volume
    if (currentVolumeIndex > 0) {
      const prevVolume = book.structure.volumes[currentVolumeIndex - 1];
      if (prevVolume.chapters.length > 0) {
        return {
          volumeId: prevVolume.id,
          chapterId: prevVolume.chapters[prevVolume.chapters.length - 1].id,
        };
      }
    }

    return null;
  }, [book]);

  // Navigate to next word
  const nextWord = useCallback(() => {
    if (!iteratorRef.current) return;
    
    setState((prev) => {
      const sentenceWordCount = iteratorRef.current!.getWordCount(
        prev.volumeId,
        prev.chapterId,
        prev.sentenceIndex
      );

      // Check if we can move to next word in current sentence
      if (prev.wordIndex < sentenceWordCount - 1) {
        return {
          ...prev,
          wordIndex: prev.wordIndex + 1,
        };
      }

      // Move to next sentence
      const sentenceCount = iteratorRef.current!.getSentenceCount(prev.volumeId, prev.chapterId);
      if (prev.sentenceIndex < sentenceCount - 1) {
        return {
          ...prev,
          sentenceIndex: prev.sentenceIndex + 1,
          wordIndex: 0,
        };
      }

      // Reached end of chapter, stop playing
      return {
        ...prev,
        isPlaying: false,
      };
    });
    
    setWordsRead((prev) => prev + 1);
  }, []);
  
  // Navigate to previous word
  const prevWord = useCallback(() => {
    if (!iteratorRef.current) return;
    
    setState((prev) => {
      // If at start of sentence, jump to sentence start and pause
      if (prev.wordIndex === 0) {
        // Check if we can go to previous sentence
        if (prev.sentenceIndex > 0) {
          const prevSentenceWordCount = iteratorRef.current!.getWordCount(
            prev.volumeId,
            prev.chapterId,
            prev.sentenceIndex - 1
          );
          return {
            ...prev,
            sentenceIndex: prev.sentenceIndex - 1,
            wordIndex: prevSentenceWordCount - 1,
            isPlaying: false,
          };
        }

        // At first sentence, check if we can go to previous chapter
        const prevChapter = findPrevChapter(prev.volumeId, prev.chapterId);
        if (prevChapter) {
          const prevChapterSentenceCount = iteratorRef.current!.getSentenceCount(
            prevChapter.volumeId,
            prevChapter.chapterId
          );
          if (prevChapterSentenceCount > 0) {
            const lastSentenceWordCount = iteratorRef.current!.getWordCount(
              prevChapter.volumeId,
              prevChapter.chapterId,
              prevChapterSentenceCount - 1
            );
            return {
              ...prev,
              volumeId: prevChapter.volumeId,
              chapterId: prevChapter.chapterId,
              sentenceIndex: prevChapterSentenceCount - 1,
              wordIndex: lastSentenceWordCount - 1,
              isPlaying: false,
            };
          }
        }

        // Can't go back further
        return {
          ...prev,
          isPlaying: false,
        };
      }

      // Move to previous word in current sentence
      return {
        ...prev,
        wordIndex: prev.wordIndex - 1,
        isPlaying: false,
      };
    });
  }, [findPrevChapter]);
  
  // Navigate to next sentence
  const nextSentence = useCallback(() => {
    if (!iteratorRef.current) return;
    
    setState((prev) => {
      const sentenceCount = iteratorRef.current!.getSentenceCount(prev.volumeId, prev.chapterId);
      
      if (prev.sentenceIndex < sentenceCount - 1) {
        // Move to next sentence in current chapter
        return {
          ...prev,
          sentenceIndex: prev.sentenceIndex + 1,
          wordIndex: 0,
          isPlaying: true,
        };
      }

      // Move to next chapter
      const nextChapter = findNextChapter(prev.volumeId, prev.chapterId);
      if (nextChapter) {
        return {
          ...prev,
          volumeId: nextChapter.volumeId,
          chapterId: nextChapter.chapterId,
          sentenceIndex: 0,
          wordIndex: 0,
          isPlaying: true,
        };
      }

      // Reached end of book
      return prev;
    });
  }, [findNextChapter]);
  
  // Navigate to previous sentence
  const prevSentence = useCallback(() => {
    if (!iteratorRef.current) return;
    
    setState((prev) => {
      if (prev.sentenceIndex > 0) {
        // Move to previous sentence in current chapter
        const prevSentenceWordCount = iteratorRef.current!.getWordCount(
          prev.volumeId,
          prev.chapterId,
          prev.sentenceIndex - 1
        );
        return {
          ...prev,
          sentenceIndex: prev.sentenceIndex - 1,
          wordIndex: prevSentenceWordCount > 0 ? prevSentenceWordCount - 1 : 0,
        };
      }

      // Move to previous chapter
      const prevChapter = findPrevChapter(prev.volumeId, prev.chapterId);
      if (prevChapter) {
        const prevChapterSentenceCount = iteratorRef.current!.getSentenceCount(
          prevChapter.volumeId,
          prevChapter.chapterId
        );
        if (prevChapterSentenceCount > 0) {
          const lastSentenceWordCount = iteratorRef.current!.getWordCount(
            prevChapter.volumeId,
            prevChapter.chapterId,
            prevChapterSentenceCount - 1
          );
          return {
            ...prev,
            volumeId: prevChapter.volumeId,
            chapterId: prevChapter.chapterId,
            sentenceIndex: prevChapterSentenceCount - 1,
            wordIndex: lastSentenceWordCount > 0 ? lastSentenceWordCount - 1 : 0,
          };
        }
      }

      return prev;
    });
  }, [findPrevChapter]);
  
  // Restart current sentence
  const restartSentence = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wordIndex: 0,
    }));
  }, []);

  // Navigate to next chapter
  const nextChapter = useCallback(() => {
    if (!iteratorRef.current) return;
    
    setState((prev) => {
      const nextChapter = findNextChapter(prev.volumeId, prev.chapterId);
      if (nextChapter) {
        return {
          ...prev,
          volumeId: nextChapter.volumeId,
          chapterId: nextChapter.chapterId,
          sentenceIndex: 0,
          wordIndex: 0,
          isPlaying: true,
        };
      }
      return prev;
    });
  }, [findNextChapter]);

  // Navigate to previous chapter
  const prevChapter = useCallback(() => {
    if (!iteratorRef.current) return;
    
    setState((prev) => {
      const prevChapter = findPrevChapter(prev.volumeId, prev.chapterId);
      if (prevChapter) {
        return {
          ...prev,
          volumeId: prevChapter.volumeId,
          chapterId: prevChapter.chapterId,
          sentenceIndex: 0,
          wordIndex: 0,
          isPlaying: false,
        };
      }
      return prev;
    });
  }, [findPrevChapter]);

  // Jump to specific chapter
  const goToChapter = useCallback((volumeId: string, chapterId: string) => {
    if (!iteratorRef.current) return;
    
    setState((prev) => ({
      ...prev,
      volumeId,
      chapterId,
      sentenceIndex: 0,
      wordIndex: 0,
      isPlaying: false,
    }));
  }, []);
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);
  
  // Set WPM manually
  const setWPM = useCallback((wpm: number) => {
    setState((prev) => ({ ...prev, currentWPM: wpm }));
    warmupStartTimeRef.current = null;
  }, []);
  
  // Toggle full sentence display
  const toggleFullSentence = useCallback(() => {
    setState((prev) => ({ ...prev, showFullSentence: !prev.showFullSentence }));
  }, []);
  
  // Auto-advance timer
  useEffect(() => {
    if (state.isPlaying && iteratorRef.current) {
      const currentWPM = calculateCurrentWPM();
      setState((prev) => ({ ...prev, currentWPM: currentWPM }));
      
      const interval = (60 / currentWPM) * 1000;
      
      timerRef.current = window.setTimeout(() => {
        nextWord();
      }, interval);
      
      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
      };
    } else {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state.isPlaying, state.wordIndex, state.sentenceIndex, calculateCurrentWPM, nextWord]);
  
  // Auto-save progress
  useEffect(() => {
    if (bookId && book && state.volumeId && state.chapterId) {
      saveProgress({
        bookId,
        volumeId: state.volumeId,
        chapterId: state.chapterId,
        sentenceIndex: state.sentenceIndex,
        wordIndex: state.wordIndex,
        lastReadAt: Date.now(),
      });
    }
  }, [bookId, book, state.volumeId, state.chapterId, state.sentenceIndex, state.wordIndex]);
  
  // Calculate progress percentage (approximate based on chapters)
  const progress = book ? 0 : 0; // TODO: Calculate based on chapter progress
  
  // Calculate session time
  const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
  
  return {
    state,
    progress,
    wordsRead,
    sessionTime,
    getCurrentWord,
    getCurrentSentence,
    getCurrentChapterSentenceCount,
    getWordIndexInSentence,
    nextWord,
    prevWord,
    nextSentence,
    prevSentence,
    nextChapter,
    prevChapter,
    goToChapter,
    restartSentence,
    togglePlay,
    setWPM,
    toggleFullSentence,
  };
}
