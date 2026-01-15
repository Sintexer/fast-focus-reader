import type {
  ProcessedText,
  ProcessedWord,
  PlaybackState,
  PlaybackConfig,
  TextElement,
} from './types';
import { isSpecialElement } from './types';

/**
 * Playback controller that manages text playback state and timing
 */
export class PlaybackController {
  private processedText: ProcessedText;
  private state: PlaybackState;
  private config: PlaybackConfig;
  private timerId: number | null = null;

  constructor(processedText: ProcessedText, config: PlaybackConfig = {}) {
    this.processedText = processedText;
    this.config = config;
    
    const maxSentenceIndex = processedText.sentences.length > 0
      ? processedText.sentences.length - 1
      : 0;

    this.state = {
      isPlaying: false,
      currentWordIndex: 0,
      currentSentenceIndex: 0,
      currentWord: this.getWordAt(0),
      currentSentence: this.getSentenceAt(0),
      maxSentenceIndex,
      wpm: config.wpm || 200,
    };
    
    // Notify initial state
    if (this.config.onStateChange) {
      this.config.onStateChange(this.state);
    }
  }

  /**
   * Start playback
   */
  play(): void {
    if (this.state.isPlaying) {
      return;
    }

    this.setState({
      ...this.state,
      isPlaying: true,
    });

    this.scheduleNextWord();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.state.isPlaying) {
      return;
    }

    this.clearTimer();
    this.setState({
      ...this.state,
      isPlaying: false,
    });
  }

  /**
   * Move to next word
   */
  nextWord(): void {
    this.clearTimer();

    const nextIndex = this.findNextWordIndex(this.state.currentWordIndex);
    
    if (nextIndex !== null) {
      this.moveToWordIndex(nextIndex);
      
      // If playing, continue to next word
      if (this.state.isPlaying) {
        this.scheduleNextWord();
      }
    } else {
      // Reached end - pause
      this.setState({
        ...this.state,
        isPlaying: false,
      });
    }
  }

  /**
   * Move to previous word
   */
  prevWord(): void {
    this.clearTimer();

    const prevIndex = this.findPrevWordIndex(this.state.currentWordIndex);
    
    if (prevIndex !== null) {
      this.moveToWordIndex(prevIndex);
    }
  }

  /**
   * Skip to next sentence
   */
  nextSentence(): void {
    this.clearTimer();

    if (this.state.currentSentenceIndex < this.state.maxSentenceIndex) {
      const nextSentenceIndex = this.state.currentSentenceIndex + 1;
      const sentence = this.getSentenceAt(nextSentenceIndex);
      
      if (sentence && sentence.length > 0) {
        const firstWordIndex = this.findWordIndexForSentence(nextSentenceIndex, 0);
        
        if (firstWordIndex !== null) {
          this.moveToWordIndex(firstWordIndex);
        }
      }
    }
  }

  /**
   * Skip to previous sentence
   */
  prevSentence(): void {
    this.clearTimer();

    if (this.state.currentSentenceIndex > 0) {
      const prevSentenceIndex = this.state.currentSentenceIndex - 1;
      const sentence = this.getSentenceAt(prevSentenceIndex);
      
      if (sentence && sentence.length > 0) {
        const lastWordIndex = this.findWordIndexForSentence(
          prevSentenceIndex,
          sentence.length - 1
        );
        
        if (lastWordIndex !== null) {
          this.moveToWordIndex(lastWordIndex);
        }
      }
    }
  }

  /**
   * Reset to beginning
   */
  reset(): void {
    this.clearTimer();
    this.moveToWordIndex(0);
    this.setState({
      ...this.state,
      isPlaying: false,
    });
  }

  /**
   * Set words per minute
   */
  setWPM(wpm: number): void {
    if (wpm <= 0) {
      return;
    }

    this.setState({
      ...this.state,
      wpm,
    });

    // If playing, restart timer with new speed
    if (this.state.isPlaying) {
      this.clearTimer();
      this.scheduleNextWord();
    }
  }

  /**
   * Get current state
   */
  getState(): PlaybackState {
    return { ...this.state };
  }

  /**
   * Update processed text (e.g., when text changes)
   */
  updateProcessedText(processedText: ProcessedText): void {
    this.processedText = processedText;
    
    const maxSentenceIndex = processedText.sentences.length > 0
      ? processedText.sentences.length - 1
      : 0;

    // Adjust current indices if they're out of bounds
    const currentWordIndex = Math.min(
      this.state.currentWordIndex,
      processedText.words.length > 0 ? processedText.words.length - 1 : 0
    );
    const currentSentenceIndex = Math.min(
      this.state.currentSentenceIndex,
      maxSentenceIndex
    );

    this.setState({
      ...this.state,
      currentWordIndex,
      currentSentenceIndex,
      currentWord: this.getWordAt(currentWordIndex),
      currentSentence: this.getSentenceAt(currentSentenceIndex),
      maxSentenceIndex,
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearTimer();
    this.setState({
      ...this.state,
      isPlaying: false,
    });
  }

  // Private helper methods

  private setState(newState: PlaybackState): void {
    this.state = newState;
    
    if (this.config.onStateChange) {
      this.config.onStateChange(this.state);
    }
  }

  private getWordAt(wordIndex: number): ProcessedWord | null {
    if (wordIndex < 0 || wordIndex >= this.processedText.words.length) {
      return null;
    }
    return this.processedText.words[wordIndex];
  }

  private getSentenceAt(sentenceIndex: number): ProcessedWord[] | null {
    if (sentenceIndex < 0 || sentenceIndex >= this.processedText.sentences.length) {
      return null;
    }
    return this.processedText.sentences[sentenceIndex];
  }

  private findNextWordIndex(currentIndex: number): number | null {
    // Simply move to next word in words array
    if (currentIndex < this.processedText.words.length - 1) {
      return currentIndex + 1;
    }
    return null;
  }

  private findPrevWordIndex(currentIndex: number): number | null {
    // Simply move to previous word in words array
    if (currentIndex > 0) {
      return currentIndex - 1;
    }
    return null;
  }

  private findWordIndexForSentence(sentenceIndex: number, wordIndexInSentence: number): number | null {
    const sentence = this.getSentenceAt(sentenceIndex);
    if (!sentence || wordIndexInSentence >= sentence.length) {
      return null;
    }

    const targetWord = sentence[wordIndexInSentence];
    const wordIndex = this.processedText.words.findIndex(
      w => w.charIndex === targetWord.charIndex &&
           w.sentenceIndex === targetWord.sentenceIndex &&
           w.wordIndex === targetWord.wordIndex
    );

    return wordIndex !== -1 ? wordIndex : null;
  }

  private moveToWordIndex(wordIndex: number): void {
    const word = this.getWordAt(wordIndex);
    if (!word) {
      return;
    }

    const sentence = this.getSentenceAt(word.sentenceIndex);

    this.setState({
      ...this.state,
      currentWordIndex: wordIndex,
      currentSentenceIndex: word.sentenceIndex,
      currentWord: word,
      currentSentence: sentence || null,
    });
  }

  private scheduleNextWord(): void {
    if (!this.state.isPlaying) {
      return;
    }

    // Check if current word ends a sentence (has sentence-end punctuation)
    const currentWord = this.state.currentWord;
    if (currentWord) {
      const endsWithPunctuation = /[.!?…]/.test(currentWord.text.slice(-1));
      if (endsWithPunctuation) {
        // Auto-pause at sentence end
        this.setState({
          ...this.state,
          isPlaying: false,
        });
        return;
      }
    }

    // Calculate delay based on WPM
    const delayMs = (60 / this.state.wpm) * 1000;

    const setTimeoutFn = typeof window !== 'undefined' ? window.setTimeout : globalThis.setTimeout;
    this.timerId = setTimeoutFn(() => {
      this.timerId = null;
      this.nextWord();
    }, delayMs) as unknown as number;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
