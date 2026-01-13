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
  showingTitle: 'volume' | 'chapter' | null;
  previousVolumeId: string;
  previousChapterId: string;
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
    showingTitle: null,
    previousVolumeId: '',
    previousChapterId: '',
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
          const hasRealVolumes = book.structure.volumes.length > 1 || 
            (book.structure.volumes.length === 1 && book.structure.volumes[0].title !== '');
          const firstChapter = firstVolume.chapters[0];
          const shouldShowVolumeTitle = hasRealVolumes && firstVolume.title !== '';
          const shouldShowChapterTitle = firstChapter.title !== '';
          
          setState((prev) => ({
            ...prev,
            volumeId: firstVolume.id,
            chapterId: firstChapter.id,
            sentenceIndex: 0,
            wordIndex: 0,
            showingTitle: shouldShowVolumeTitle ? 'volume' : (shouldShowChapterTitle ? 'chapter' : null),
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
            showingTitle: null, // Don't show title when loading from progress
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
  const getCurrentWord = useCallback((): { firstPart: string; middleLetter: string; secondPart: string; punctuation?: string } | null => {
    if (!iteratorRef.current) return null;
    
    // Don't return word parts when showing a title - titles are handled separately
    if (state.showingTitle) return null;
    
    // Normal word from sentence
    const word = iteratorRef.current.getWord(
      state.volumeId,
      state.chapterId,
      state.sentenceIndex,
      state.wordIndex
    );
    
    if (!word) return null;
    
    const language = iteratorRef.current.getLanguage();
    const parts = getWordParts(word, language);
    
    // Extract punctuation from the word (if it's the last word of the sentence)
    const sentence = iteratorRef.current.getSentence(state.volumeId, state.chapterId, state.sentenceIndex);
    const isLastWord = sentence && state.wordIndex === sentence.length - 1;
    let punctuation: string | undefined;
    
    if (isLastWord) {
      // Extract punctuation from the last word
      const punctuationMatch = word.match(/[.!?…]+$/);
      if (punctuationMatch) {
        punctuation = punctuationMatch[0];
      }
    }
    
    return {
      firstPart: parts.before,
      middleLetter: parts.vowel,
      secondPart: parts.after,
      punctuation,
    };
  }, [state.volumeId, state.chapterId, state.sentenceIndex, state.wordIndex, state.showingTitle]);

  // Get sentence punctuation (for showing above words)
  const getSentencePunctuation = useCallback((): string | null => {
    if (!iteratorRef.current || state.showingTitle) return null;
    
    const sentence = iteratorRef.current.getSentence(state.volumeId, state.chapterId, state.sentenceIndex);
    if (!sentence || sentence.length === 0) return null;
    
    const lastWord = sentence[sentence.length - 1];
    const punctuationMatch = lastWord.match(/[!?]+$/);
    return punctuationMatch ? punctuationMatch[0] : null;
  }, [state.volumeId, state.chapterId, state.sentenceIndex, state.showingTitle]);

  // Get current title (volume or chapter)
  const getCurrentTitle = useCallback((): string | null => {
    if (!book || !state.showingTitle) return null;
    
    if (state.showingTitle === 'volume') {
      const volume = book.structure.volumes.find(v => v.id === state.volumeId);
      return volume?.title || null;
    } else if (state.showingTitle === 'chapter') {
      const volume = book.structure.volumes.find(v => v.id === state.volumeId);
      const chapter = volume?.chapters.find(c => c.id === state.chapterId);
      return chapter?.title || null;
    }
    
    return null;
  }, [book, state.showingTitle, state.volumeId, state.chapterId]);
  
  // Get current sentence
  const getCurrentSentence = useCallback((): string[] => {
    if (!iteratorRef.current) return [];
    // If showing a title, return empty array (no sentence to show)
    if (state.showingTitle) return [];
    return iteratorRef.current.getSentence(state.volumeId, state.chapterId, state.sentenceIndex) || [];
  }, [state.volumeId, state.chapterId, state.sentenceIndex, state.showingTitle]);

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

  // Check if we're at the end of the last sentence
  const isAtEnd = useCallback((): boolean => {
    if (!iteratorRef.current) return false;
    
    const sentenceCount = iteratorRef.current.getSentenceCount(state.volumeId, state.chapterId);
    const sentenceWordCount = iteratorRef.current.getWordCount(
      state.volumeId,
      state.chapterId,
      state.sentenceIndex
    );
    
    // Check if we're at the last word of the last sentence in current chapter
    const isLastSentence = state.sentenceIndex === sentenceCount - 1;
    const isLastWord = state.wordIndex === sentenceWordCount - 1;
    
    if (!isLastSentence || !isLastWord) return false;
    
    // Check if there are more chapters after this one
    const nextChapter = findNextChapter(state.volumeId, state.chapterId);
    return nextChapter === null;
  }, [state.volumeId, state.chapterId, state.sentenceIndex, state.wordIndex, findNextChapter]);

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
    if (!iteratorRef.current || !book) return;
    
    setState((prev) => {
      // If currently showing a title, move to first sentence and start autoplay
      if (prev.showingTitle) {
        return {
          ...prev,
          showingTitle: null,
          sentenceIndex: 0,
          wordIndex: 0,
          isPlaying: true, // Start autoplay after title
        };
      }
      
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
        const newVolume = book.structure.volumes.find(v => v.id === nextChapter.volumeId);
        const hasRealVolumes = book.structure.volumes.length > 1 || 
          (book.structure.volumes.length === 1 && book.structure.volumes[0].title !== '');
        
        // Check if we're entering a new volume
        const isNewVolume = prev.volumeId !== nextChapter.volumeId;
        const shouldShowVolumeTitle = isNewVolume && hasRealVolumes && newVolume && newVolume.title !== '';
        
        // Always show chapter title when entering new chapter
        const newChapter = newVolume?.chapters.find(c => c.id === nextChapter.chapterId);
        const shouldShowChapterTitle = newChapter && newChapter.title !== '';
        
        return {
          ...prev,
          volumeId: nextChapter.volumeId,
          chapterId: nextChapter.chapterId,
          sentenceIndex: 0,
          wordIndex: 0,
          isPlaying: false, // Don't autoplay when showing title
          showingTitle: shouldShowVolumeTitle ? 'volume' : (shouldShowChapterTitle ? 'chapter' : null),
          previousVolumeId: prev.volumeId,
          previousChapterId: prev.chapterId,
        };
      }

      // Reached end of book
      return prev;
    });
  }, [findNextChapter, book]);
  
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

  // Navigate to previous sentence beginning
  // If not at the beginning of current sentence, jump to current sentence beginning
  // If already at the beginning, jump to previous sentence beginning
  const prevSentenceStart = useCallback(() => {
    if (!iteratorRef.current || !book) return;
    
    setState((prev) => {
      // If not at the beginning of current sentence, jump to current sentence beginning
      if (prev.wordIndex > 0) {
        return {
          ...prev,
          wordIndex: 0,
          isPlaying: false,
        };
      }

      // Already at the beginning, jump to previous sentence beginning
      if (prev.sentenceIndex > 0) {
        return {
          ...prev,
          sentenceIndex: prev.sentenceIndex - 1,
          wordIndex: 0,
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
          // Show chapter title when going to previous chapter
          const newVolume = book.structure.volumes.find(v => v.id === prevChapter.volumeId);
          const newChapter = newVolume?.chapters.find(c => c.id === prevChapter.chapterId);
          const shouldShowChapterTitle = newChapter && newChapter.title !== '';
          
          return {
            ...prev,
            volumeId: prevChapter.volumeId,
            chapterId: prevChapter.chapterId,
            sentenceIndex: prevChapterSentenceCount - 1,
            wordIndex: 0,
            isPlaying: false,
            showingTitle: shouldShowChapterTitle ? 'chapter' : null,
            previousVolumeId: prev.volumeId,
            previousChapterId: prev.chapterId,
          };
        }
      }

      // Can't go back further, stay at current position
      return {
        ...prev,
        isPlaying: false,
      };
    });
  }, [findPrevChapter, book]);

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
    if (!iteratorRef.current || !book) return;
    
    setState((prev) => {
      const newVolume = book.structure.volumes.find(v => v.id === volumeId);
      const hasRealVolumes = book.structure.volumes.length > 1 || 
        (book.structure.volumes.length === 1 && book.structure.volumes[0].title !== '');
      
      // Check if we're entering a new volume
      const isNewVolume = prev.volumeId !== volumeId;
      const shouldShowVolumeTitle = isNewVolume && hasRealVolumes && newVolume && newVolume.title !== '';
      
      // Always show chapter title when navigating to a chapter
      const newChapter = newVolume?.chapters.find(c => c.id === chapterId);
      const shouldShowChapterTitle = newChapter && newChapter.title !== '';
      
      return {
        ...prev,
        volumeId,
        chapterId,
        sentenceIndex: 0,
        wordIndex: 0,
        isPlaying: false,
        showingTitle: shouldShowVolumeTitle ? 'volume' : (shouldShowChapterTitle ? 'chapter' : null),
        previousVolumeId: prev.volumeId,
        previousChapterId: prev.chapterId,
      };
    });
  }, [book]);
  
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
    // Don't autoplay when showing titles
    if (state.isPlaying && iteratorRef.current && !state.showingTitle) {
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
  }, [state.isPlaying, state.wordIndex, state.sentenceIndex, state.showingTitle, calculateCurrentWPM, nextWord]);
  
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
    getCurrentTitle,
    getCurrentSentence,
    getSentencePunctuation,
    getCurrentChapterSentenceCount,
    getWordIndexInSentence,
    isAtEnd,
    nextWord,
    prevWord,
    nextSentence,
    prevSentence,
    nextChapter,
    prevChapter,
    goToChapter,
    restartSentence,
    prevSentenceStart,
    togglePlay,
    setWPM,
    toggleFullSentence,
  };
}
