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
  isParagraphEnd?: boolean;  // True if this word ends a paragraph
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
  isStoppedAtSentenceEnd?: boolean; // True if stopped at sentence end (for Next button)
  isStoppedAtParagraphEnd?: boolean; // True if stopped at paragraph end
}

/**
 * Pause configuration for different punctuation marks
 * Values are in milliseconds
 */
export interface PauseConfig {
  comma?: number;        // Pause for comma (,)
  semicolon?: number;    // Pause for semicolon (;)
  colon?: number;        // Pause for colon (:)
  period?: number;       // Pause for period (.)
  question?: number;     // Pause for question mark (?)
  exclamation?: number; // Pause for exclamation mark (!)
  ellipsis?: number;     // Pause for ellipsis (…)
  sentenceEnd?: number;  // Pause at sentence end (default if no specific punctuation match)
  paragraphEnd?: number; // Pause at paragraph end (always applied if word is at paragraph end)
}

/**
 * Configuration for playback controller
 */
export interface PlaybackConfig {
  wpm?: number;
  pauseConfig?: PauseConfig;
  autoStopOnSentenceEnd?: boolean; // Auto-stop at sentence end (default: false)
  autoStopOnParagraphEnd?: boolean; // Auto-stop at paragraph end (default: false)
  onStateChange?: (state: PlaybackState) => void;
}

/**
 * Configuration for text processor
 */
export interface TextProcessorConfig {
  locale?: string;
}
