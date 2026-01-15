import type {
  ProcessedWord,
  SpecialElement,
  TextElement,
  ProcessedText,
  TextProcessorConfig,
} from './types';

/**
 * Constants for text processing patterns
 */
const DOUBLE_NEWLINE_REGEX = /\n\s*\n/g;
const SENTENCE_END_REGEX = /[.!?…]+(?:\s+|$)/g;
const SENTENCE_PUNCTUATION_REGEX = /[.!?…]/;
const RUSSIAN_CAPITAL_LETTER_REGEX = /[А-ЯЁ]/;

/**
 * Default locale for text processing
 */
const DEFAULT_LOCALE = 'ru';

/**
 * Text processor using Intl.Segmenter for accurate text segmentation.
 * 
 * This processor segments text into words and sentences, treating each
 * segment (including punctuation) as a separate word element.
 */
export class TextProcessor {
  private readonly locale: string;
  private readonly wordSegmenter: Intl.Segmenter;
  private readonly sentenceSegmenter: Intl.Segmenter;

  constructor(config: TextProcessorConfig = {}) {
    this.locale = config.locale || DEFAULT_LOCALE;
    this.wordSegmenter = new Intl.Segmenter(this.locale, { granularity: 'word' });
    this.sentenceSegmenter = new Intl.Segmenter(this.locale, { granularity: 'sentence' });
  }

  /**
   * Process text into structured format with words and special elements.
   * 
   * @param text - The raw text to process
   * @returns Processed text with words, sentences, and special elements
   */
  process(text: string): ProcessedText {
    if (this.isEmpty(text)) {
      return this.createEmptyResult();
    }

    const paragraphRanges = this.findParagraphRanges(text);
    return this.processParagraphs(text, paragraphRanges);
  }

  /**
   * Get element at specific index from processed text.
   * 
   * @param processedText - The processed text result
   * @param index - The index of the element to retrieve
   * @returns The element at the given index, or null if invalid
   */
  getElement(processedText: ProcessedText, index: number): TextElement | null {
    if (index < 0 || index >= processedText.elements.length) {
      return null;
    }
    return processedText.elements[index];
  }

  /**
   * Get total word count from processed text.
   * 
   * @param processedText - The processed text result
   * @returns The number of words
   */
  getWordCount(processedText: ProcessedText): number {
    return processedText.words.length;
  }

  /**
   * Get total sentence count from processed text.
   * 
   * @param processedText - The processed text result
   * @returns The number of sentences
   */
  getSentenceCount(processedText: ProcessedText): number {
    return processedText.sentences.length;
  }

  // Private helper methods

  /**
   * Check if text is empty or whitespace-only.
   */
  private isEmpty(text: string): boolean {
    return !text || text.trim().length === 0;
  }

  /**
   * Create an empty processed text result.
   */
  private createEmptyResult(): ProcessedText {
    return {
      elements: [],
      words: [],
      sentences: [],
    };
  }

  /**
   * Process all paragraphs and build the final result.
   */
  private processParagraphs(
    text: string,
    paragraphRanges: Array<{ start: number; end: number }>
  ): ProcessedText {
    const allWords: ProcessedWord[] = [];
    const allSentences: ProcessedWord[][] = [];
    const allElements: TextElement[] = [];
    let globalSentenceIndex = 0;

    for (let paraIndex = 0; paraIndex < paragraphRanges.length; paraIndex++) {
      const { start, end } = paragraphRanges[paraIndex];
      const paragraph = text.slice(start, end);
      const isFirstParagraph = paraIndex === 0;

      // Add paragraph break marker (except before first paragraph)
      if (!isFirstParagraph) {
        const paraBreak = this.createParagraphBreak(start, globalSentenceIndex);
        allElements.push(paraBreak);
      }

      // Process sentences in this paragraph
      const sentenceRanges = this.findSentenceRanges(paragraph, start);
      const result = this.processSentences(
        text,
        sentenceRanges,
        globalSentenceIndex,
        paraIndex,
        paragraphRanges.length
      );

      allWords.push(...result.words);
      allSentences.push(...result.sentences);
      allElements.push(...result.elements);

      globalSentenceIndex += result.sentences.length;
    }

    return {
      elements: allElements,
      words: allWords,
      sentences: allSentences,
    };
  }

  /**
   * Process sentences within a paragraph.
   */
  private processSentences(
    text: string,
    sentenceRanges: Array<{ start: number; end: number }>,
    startSentenceIndex: number,
    paragraphIndex: number,
    totalParagraphs: number
  ): {
    words: ProcessedWord[];
    sentences: ProcessedWord[][];
    elements: TextElement[];
  } {
    const words: ProcessedWord[] = [];
    const sentences: ProcessedWord[][] = [];
    const elements: TextElement[] = [];

    for (let sentIndex = 0; sentIndex < sentenceRanges.length; sentIndex++) {
      const sentRange = sentenceRanges[sentIndex];
      const sentence = text.slice(sentRange.start, sentRange.end);
      const sentenceIndex = startSentenceIndex + sentIndex;
      const sentenceWords = this.processSentence(sentence, sentenceIndex, sentRange.start);

      if (sentenceWords.length > 0) {
        sentences.push(sentenceWords);
        words.push(...sentenceWords);
        elements.push(...sentenceWords);

        // Add sentence end marker (except for last sentence in last paragraph)
        const isLastSentence = sentIndex === sentenceRanges.length - 1 && 
                                paragraphIndex === totalParagraphs - 1;
        if (!isLastSentence) {
          const sentenceEnd = this.createSentenceEnd(sentRange.end, sentenceIndex);
          elements.push(sentenceEnd);
        }
      }
    }

    return { words, sentences, elements };
  }

  /**
   * Create a paragraph break special element.
   */
  private createParagraphBreak(charIndex: number, sentenceIndex: number): SpecialElement {
    return {
      type: 'paragraph-break',
      charIndex,
      sentenceIndex,
    };
  }

  /**
   * Create a sentence end special element.
   */
  private createSentenceEnd(charIndex: number, sentenceIndex: number): SpecialElement {
    return {
      type: 'sentence-end',
      charIndex,
      sentenceIndex,
    };
  }

  /**
   * Find paragraph ranges in text.
   * 
   * First tries to split by double newlines, then falls back to
   * single newlines after sentence endings.
   */
  private findParagraphRanges(text: string): Array<{ start: number; end: number }> {
    const ranges = this.findParagraphsByDoubleNewline(text);
    
    // Fallback to single newline detection if no double newlines found
    if (ranges.length <= 1) {
      return this.findParagraphsBySingleNewline(text);
    }
    
    return ranges.filter(range => range.end > range.start);
  }

  /**
   * Find paragraphs by splitting on double newlines.
   */
  private findParagraphsByDoubleNewline(text: string): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    let lastIndex = 0;
    let match;

    DOUBLE_NEWLINE_REGEX.lastIndex = 0; // Reset regex
    while ((match = DOUBLE_NEWLINE_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        ranges.push({ start: lastIndex, end: match.index });
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      ranges.push({ start: lastIndex, end: text.length });
    }

    return ranges;
  }

  /**
   * Find paragraphs by detecting single newlines after sentence endings.
   */
  private findParagraphsBySingleNewline(text: string): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    let start = 0;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        const beforeNewline = text.slice(Math.max(0, i - 50), i).trim();
        const lastChar = beforeNewline.slice(-1);

        if (SENTENCE_PUNCTUATION_REGEX.test(lastChar)) {
          const afterNewline = text.slice(i + 1).trimStart();
          if (afterNewline.length > 0 && RUSSIAN_CAPITAL_LETTER_REGEX.test(afterNewline[0])) {
            if (i > start) {
              ranges.push({ start, end: i });
            }
            start = i + 1;
          }
        }
      }
    }

    if (start < text.length) {
      ranges.push({ start, end: text.length });
    }

    return ranges;
  }

  /**
   * Find sentence ranges in text.
   * 
   * Uses regex to detect sentence-ending punctuation followed by whitespace.
   */
  private findSentenceRanges(
    text: string,
    baseIndex: number
  ): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    let lastIndex = 0;
    let match;

    SENTENCE_END_REGEX.lastIndex = 0; // Reset regex
    while ((match = SENTENCE_END_REGEX.exec(text)) !== null) {
      const sentenceEnd = match.index + match[0].length;

      if (match.index > lastIndex) {
        ranges.push({
          start: baseIndex + lastIndex,
          end: baseIndex + sentenceEnd,
        });
      }
      lastIndex = sentenceEnd;
    }

    // Add remaining text as last sentence if any
    if (lastIndex < text.length) {
      ranges.push({
        start: baseIndex + lastIndex,
        end: baseIndex + text.length,
      });
    }

    // If no sentences found (no punctuation), treat entire text as one sentence
    if (ranges.length === 0) {
      ranges.push({
        start: baseIndex,
        end: baseIndex + text.length,
      });
    }

    return ranges.filter(range => range.end > range.start);
  }

  /**
   * Process a sentence into words.
   * 
   * Each segment from Intl.Segmenter (whether word or punctuation) is treated
   * as a separate word element. This simplifies the logic by not trying to
   * attach punctuation to adjacent words.
   */
  private processSentence(
    sentence: string,
    sentenceIndex: number,
    baseCharIndex: number
  ): ProcessedWord[] {
    const segments = Array.from(this.wordSegmenter.segment(sentence));
    const words: ProcessedWord[] = [];

    segments.forEach((segment, index) => {
      const word: ProcessedWord = {
        text: segment.segment,
        charIndex: baseCharIndex + segment.index,
        sentenceIndex,
        wordIndex: index,
      };
      words.push(word);
    });

    return words;
  }
}
