/**
 * Core types for text processing and playback service
 */

/**
 * A processed word with metadata
 */
export interface ProcessedWord {
  text: string;              // Word text with punctuation
  charIndex: number;         // Character index in original text
  sentenceIndex: number;     // Which sentence this word belongs to
  wordIndex: number;         // Index within sentence
}

/**
 * Special non-word elements that indicate structural boundaries
 */
export interface SpecialElement {
  type: 'paragraph-break' | 'sentence-end';
  charIndex: number;
  sentenceIndex: number;
}

/**
 * Discriminated union type for all text elements
 */
export type TextElement = ProcessedWord | SpecialElement;

/**
 * Type guard to check if an element is a word
 */
export function isProcessedWord(element: TextElement): element is ProcessedWord {
  return 'text' in element && 'wordIndex' in element;
}

/**
 * Type guard to check if an element is a special element
 */
export function isSpecialElement(element: TextElement): element is SpecialElement {
  return 'type' in element && !('wordIndex' in element);
}

/**
 * Processed text structure containing all elements
 */
export interface ProcessedText {
  elements: TextElement[];    // Flat array of words and special elements
  words: ProcessedWord[];     // Words only
  sentences: ProcessedWord[][]; // Words grouped by sentence
}

/**
 * Playback state snapshot
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentWordIndex: number;
  currentSentenceIndex: number;
  currentWord: ProcessedWord | null;
  currentSentence: ProcessedWord[] | null;
  maxSentenceIndex: number;
  wpm: number;
}

/**
 * Configuration for playback controller
 */
export interface PlaybackConfig {
  wpm?: number;
  onStateChange?: (state: PlaybackState) => void;
}

/**
 * Configuration for text processor
 */
export interface TextProcessorConfig {
  locale?: string;
}
