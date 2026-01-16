import type {
  ProcessedText,
  ProcessedWord,
  PlaybackState,
  PlaybackConfig,
  PauseConfig,
} from './types';

/**
 * Default pause configuration (in milliseconds)
 */
const DEFAULT_PAUSE_CONFIG: Required<PauseConfig> = {
  comma: 200,           // Small pause for comma
  semicolon: 400,       // Medium pause for semicolon
  colon: 300,           // Medium pause for colon
  period: 800,          // Big pause for period
  question: 800,        // Big pause for question mark
  exclamation: 800,     // Big pause for exclamation mark
  ellipsis: 600,        // Medium-long pause for ellipsis
  sentenceEnd: 600,     // Default pause at sentence end
  paragraphEnd: 1200,   // Long pause at paragraph end
};

/**
 * Playback controller that manages text playback state and timing
 */
export class PlaybackController {
  private processedText: ProcessedText;
  private state: PlaybackState;
  private config: PlaybackConfig;
  private pauseConfig: Required<PauseConfig>;
  private timerId: number | null = null;

  private autoStopOnSentenceEnd: boolean;
  private autoStopOnParagraphEnd: boolean;

  constructor(processedText: ProcessedText, config: PlaybackConfig = {}) {
    this.processedText = processedText;
    this.config = config;
    
    // Merge pause config with defaults
    this.pauseConfig = {
      ...DEFAULT_PAUSE_CONFIG,
      ...(config.pauseConfig || {}),
    };
    
    // Auto-stop configuration
    this.autoStopOnSentenceEnd = config.autoStopOnSentenceEnd ?? false;
    this.autoStopOnParagraphEnd = config.autoStopOnParagraphEnd ?? false;
    
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
      isStoppedAtSentenceEnd: false,
      isStoppedAtParagraphEnd: false,
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
   * Restart current sentence from the beginning
   */
  restartSentence(): void {
    this.clearTimer();

    const sentence = this.getSentenceAt(this.state.currentSentenceIndex);
    if (sentence && sentence.length > 0) {
      const firstWordIndex = this.findWordIndexForSentence(
        this.state.currentSentenceIndex,
        0
      );
      
      if (firstWordIndex !== null) {
        this.moveToWordIndex(firstWordIndex);
      }
    }

    // Pause playback when restarting
    this.setState({
      ...this.state,
      isPlaying: false,
    });
  }

  /**
   * Advance to next sentence (only works when stopped at sentence end)
   */
  advanceToNextSentence(): void {
    if (!this.state.isStoppedAtSentenceEnd) {
      return;
    }

    this.clearTimer();
    this.nextSentence();
    
    // Clear stopped flags and resume playing
    // If we were stopped at sentence end, we were playing before, so resume
    this.setState({
      ...this.state,
      isStoppedAtSentenceEnd: false,
      isStoppedAtParagraphEnd: false,
      isPlaying: true,
    });
    
    // Resume playback
    this.scheduleNextWord();
  }

  /**
   * Skip to previous sentence (jumps to start of previous sentence)
   */
  prevSentence(): void {
    this.clearTimer();

    if (this.state.currentSentenceIndex > 0) {
      const prevSentenceIndex = this.state.currentSentenceIndex - 1;
      const sentence = this.getSentenceAt(prevSentenceIndex);
      
      if (sentence && sentence.length > 0) {
        const firstWordIndex = this.findWordIndexForSentence(
          prevSentenceIndex,
          0
        );
        
        if (firstWordIndex !== null) {
          this.moveToWordIndex(firstWordIndex);
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
   * Set auto-stop on sentence end
   */
  setAutoStopOnSentenceEnd(enabled: boolean): void {
    this.autoStopOnSentenceEnd = enabled;
  }

  /**
   * Set auto-stop on paragraph end
   */
  setAutoStopOnParagraphEnd(enabled: boolean): void {
    this.autoStopOnParagraphEnd = enabled;
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
      // Clear stopped flags when manually moving
      isStoppedAtSentenceEnd: false,
      isStoppedAtParagraphEnd: false,
    });
  }

  /**
   * Check if current word is at the end of a sentence
   */
  private isAtSentenceEnd(word: ProcessedWord): boolean {
    const sentence = this.getSentenceAt(word.sentenceIndex);
    if (!sentence || sentence.length === 0) {
      return false;
    }
    const lastWord = sentence[sentence.length - 1];
    return lastWord.charIndex === word.charIndex &&
           lastWord.wordIndex === word.wordIndex;
  }

  /**
   * Check if current word is at the end of a paragraph
   */
  private isAtParagraphEnd(word: ProcessedWord): boolean {
    return word.isParagraphEnd === true;
  }

  /**
   * Calculate pause duration for the current word based on punctuation
   */
  private calculatePauseDuration(word: ProcessedWord | null): number {
    if (!word) {
      return (60 / this.state.wpm) * 1000; // Default word timing
    }

    // Always pause at paragraph end (regardless of punctuation)
    if (word.isParagraphEnd) {
      return this.pauseConfig.paragraphEnd;
    }

    // Check for punctuation in the word text (check from end to beginning for priority)
    const text = word.text;
    
    // Check for specific punctuation marks (in order of priority, checking if they appear)
    // We check the end of the word first, then anywhere in the word
    if (text.endsWith('…') || text.includes('…')) {
      return this.pauseConfig.ellipsis;
    }
    if (text.endsWith('!') || text.includes('!')) {
      return this.pauseConfig.exclamation;
    }
    if (text.endsWith('?') || text.includes('?')) {
      return this.pauseConfig.question;
    }
    if (text.endsWith('.') || text.includes('.')) {
      return this.pauseConfig.period;
    }
    if (text.endsWith(';') || text.includes(';')) {
      return this.pauseConfig.semicolon;
    }
    if (text.endsWith(':') || text.includes(':')) {
      return this.pauseConfig.colon;
    }
    if (text.endsWith(',') || text.includes(',')) {
      return this.pauseConfig.comma;
    }

    // Check if this is the last word of a sentence
    const sentence = this.getSentenceAt(word.sentenceIndex);
    if (sentence && sentence.length > 0) {
      const lastWordInSentence = sentence[sentence.length - 1];
      if (lastWordInSentence.charIndex === word.charIndex &&
          lastWordInSentence.wordIndex === word.wordIndex) {
        // This is the last word of the sentence - use sentence end pause
        return this.pauseConfig.sentenceEnd;
      }
    }

    // Default: normal word timing based on WPM
    return (60 / this.state.wpm) * 1000;
  }

  private scheduleNextWord(): void {
    if (!this.state.isPlaying) {
      return;
    }

    const currentWord = this.state.currentWord;
    if (!currentWord) {
      return;
    }

    // Check if we should auto-stop at sentence or paragraph end
    const isAtSentenceEnd = this.isAtSentenceEnd(currentWord);
    const isAtParagraphEnd = this.isAtParagraphEnd(currentWord);

    if (isAtParagraphEnd && this.autoStopOnParagraphEnd) {
      // Stop at paragraph end
      this.setState({
        ...this.state,
        isPlaying: false,
        isStoppedAtSentenceEnd: true, // Also mark as sentence end
        isStoppedAtParagraphEnd: true,
      });
      return;
    }

    if (isAtSentenceEnd && this.autoStopOnSentenceEnd) {
      // Stop at sentence end
      this.setState({
        ...this.state,
        isPlaying: false,
        isStoppedAtSentenceEnd: true,
        isStoppedAtParagraphEnd: isAtParagraphEnd,
      });
      return;
    }

    // Continue playing - calculate delay and schedule next word
    const delayMs = this.calculatePauseDuration(currentWord);

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
