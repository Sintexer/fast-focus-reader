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
const SENTENCE_PUNCTUATION_REGEX = /[.!?…]/;
const RUSSIAN_CAPITAL_LETTER_REGEX = /[А-ЯЁ]/;
const DEFAULT_LOCALE = 'ru';

/**
 * Punctuation that should be attached to the preceding word
 */
const ATTACHABLE_PUNCTUATION = /[,;:—–]/;
const END_OF_SENTENCE_PUNCTUATION = /[.!?…]/;

/**
 * Text range with extracted text
 */
interface TextRange {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * Result of processing a paragraph
 */
interface ParagraphResult {
  readonly sentences: ProcessedWord[][];
  readonly words: ProcessedWord[];
}

/**
 * Interface for word processing strategy
 * Allows swapping word parsing implementations
 */
interface WordProcessingStrategy {
  process(sentence: string, sentenceIndex: number, baseCharIndex: number): ProcessedWord[];
}

/**
 * Word processor that splits by spaces and attaches punctuation to words.
 * 
 * This approach:
 * - Splits sentence by whitespace
 * - Attaches punctuation (commas, dots, semicolons) to words
 * - Filters out empty/whitespace-only segments
 */
class SpaceBasedWordProcessor implements WordProcessingStrategy {
  /**
   * Process a sentence into words by splitting on spaces.
   * Punctuation is attached to words:
   * - Trailing punctuation (.,;:) attaches to previous word
   * - Leading punctuation (-) attaches to following word
   */
  process(sentence: string, sentenceIndex: number, baseCharIndex: number): ProcessedWord[] {
    const words: ProcessedWord[] = [];
    // Split by whitespace and filter empty tokens
    const tokens = sentence.split(/\s+/).filter(token => token.trim().length > 0);
    
    let wordIndex = 0;

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      const hasLetters = /[\p{L}\d]/u.test(token);
      
      if (!hasLetters) {
        // Pure punctuation token - attach to adjacent word
        if (words.length > 0) {
          // Attach to previous word (trailing punctuation)
          const prevWord = words[words.length - 1];
          prevWord.text += token;
        } else {
          // Leading punctuation - collect consecutive punctuation and attach to next word
          let punctuationText = token;
          let nextWordIndex = i + 1;
          
          // Collect consecutive punctuation tokens
          while (nextWordIndex < tokens.length && !/[\p{L}\d]/u.test(tokens[nextWordIndex])) {
            punctuationText += tokens[nextWordIndex];
            nextWordIndex++;
          }
          
          // Attach to next word if found
          if (nextWordIndex < tokens.length) {
            const nextToken = tokens[nextWordIndex];
            const charIndex = baseCharIndex + this.findTokenPosition(sentence, nextToken, nextWordIndex, tokens);
            words.push({
              text: punctuationText + nextToken,
              charIndex,
              sentenceIndex,
              wordIndex,
            });
            wordIndex++;
            i = nextWordIndex; // Skip processed tokens
            continue;
          }
          
          // No word found - create word from punctuation (edge case)
          const charIndex = baseCharIndex + this.findTokenPosition(sentence, token, i, tokens);
          words.push({
            text: punctuationText,
            charIndex,
            sentenceIndex,
            wordIndex,
          });
          wordIndex++;
        }
      } else {
        // This is a word (may already contain punctuation like "said.")
        const charIndex = baseCharIndex + this.findTokenPosition(sentence, token, i, tokens);
        words.push({
          text: token,
          charIndex,
          sentenceIndex,
          wordIndex,
        });
        wordIndex++;
      }
    }

    return words;
  }

  /**
   * Find the actual start position of a token in the sentence.
   */
  private findTokenPosition(
    sentence: string,
    token: string,
    tokenIndex: number,
    allTokens: string[]
  ): number {
    if (tokenIndex === 0) {
      const index = sentence.indexOf(token);
      return index >= 0 ? index : 0;
    }

    // Find where previous tokens end
    let searchStart = 0;
    for (let i = 0; i < tokenIndex; i++) {
      const prevToken = allTokens[i];
      const prevIndex = sentence.indexOf(prevToken, searchStart);
      if (prevIndex >= 0) {
        searchStart = prevIndex + prevToken.length;
        // Skip whitespace to find next token
        while (searchStart < sentence.length && /\s/.test(sentence[searchStart])) {
          searchStart++;
        }
      }
    }

    const index = sentence.indexOf(token, Math.max(0, searchStart - 1));
    return index >= 0 ? index : searchStart;
  }
}

/**
 * Sentence processor - handles sentence segmentation within a paragraph
 */
class SentenceProcessor {
  private readonly segmenter: Intl.Segmenter;
  private readonly wordStrategy: WordProcessingStrategy;

  constructor(locale: string, wordStrategy: WordProcessingStrategy) {
    this.segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' });
    this.wordStrategy = wordStrategy;
  }

  /**
   * Process a paragraph into sentences, then words within each sentence.
   */
  process(
    paragraph: string,
    paragraphStartIndex: number,
    startSentenceIndex: number
  ): ParagraphResult {
    const sentences: ProcessedWord[][] = [];
    const allWords: ProcessedWord[] = [];
    const sentenceSegments = Array.from(this.segmenter.segment(paragraph));
    
    let currentSentenceIndex = startSentenceIndex;

    for (const segment of sentenceSegments) {
      const sentenceText = segment.segment;
      const sentenceStartIndex = paragraphStartIndex + segment.index;
      const words = this.wordStrategy.process(sentenceText, currentSentenceIndex, sentenceStartIndex);

      if (words.length > 0) {
        sentences.push(words);
        allWords.push(...words);
        currentSentenceIndex++;
      }
    }

    // Fallback: if no sentences found, treat entire paragraph as one sentence
    if (sentences.length === 0 && paragraph.trim().length > 0) {
      const words = this.wordStrategy.process(paragraph, startSentenceIndex, paragraphStartIndex);
      if (words.length > 0) {
        sentences.push(words);
        allWords.push(...words);
      }
    }

    return { sentences, words: allWords };
  }
}

/**
 * Interface for paragraph boundary detection strategy
 */
interface ParagraphBoundaryStrategy {
  findRanges(text: string): TextRange[];
}

/**
 * Paragraph boundary detector using double newlines
 */
class DoubleNewlineBoundaryStrategy implements ParagraphBoundaryStrategy {
  findRanges(text: string): TextRange[] {
    const ranges: TextRange[] = [];
    let lastIndex = 0;
    let match;

    DOUBLE_NEWLINE_REGEX.lastIndex = 0;
    while ((match = DOUBLE_NEWLINE_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        ranges.push({
          start: lastIndex,
          end: match.index,
          text: text.slice(lastIndex, match.index),
        });
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      ranges.push({
        start: lastIndex,
        end: text.length,
        text: text.slice(lastIndex),
      });
    }

    return ranges;
  }
}

/**
 * Paragraph boundary detector using single newlines after sentence endings
 */
class SingleNewlineBoundaryStrategy implements ParagraphBoundaryStrategy {
  findRanges(text: string): TextRange[] {
    const ranges: TextRange[] = [];
    let start = 0;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') {
        const beforeNewline = text.slice(Math.max(0, i - 50), i).trim();
        const lastChar = beforeNewline.slice(-1);

        if (SENTENCE_PUNCTUATION_REGEX.test(lastChar)) {
          const afterNewline = text.slice(i + 1).trimStart();
          if (afterNewline.length > 0 && RUSSIAN_CAPITAL_LETTER_REGEX.test(afterNewline[0])) {
            if (i > start) {
              ranges.push({
                start,
                end: i,
                text: text.slice(start, i),
              });
            }
            start = i + 1;
          }
        }
      }
    }

    if (start < text.length) {
      ranges.push({
        start,
        end: text.length,
        text: text.slice(start),
      });
    }

    return ranges;
  }
}

/**
 * Factory function to create default boundary strategy
 */
function createDefaultBoundaryStrategy(): ParagraphBoundaryStrategy {
  const doubleNewline = new DoubleNewlineBoundaryStrategy();
  const singleNewline = new SingleNewlineBoundaryStrategy();
  
  return {
    findRanges: (text: string) => {
      const ranges = doubleNewline.findRanges(text);
      return ranges.length > 1 ? ranges : singleNewline.findRanges(text);
    },
  };
}

/**
 * Paragraph processor - handles paragraph segmentation and processing
 */
class ParagraphProcessor {
  private readonly sentenceProcessor: SentenceProcessor;
  private readonly boundaryStrategy: ParagraphBoundaryStrategy;

  constructor(
    locale: string,
    wordStrategy: WordProcessingStrategy,
    boundaryStrategy: ParagraphBoundaryStrategy
  ) {
    this.sentenceProcessor = new SentenceProcessor(locale, wordStrategy);
    this.boundaryStrategy = boundaryStrategy;
  }

  /**
   * Find paragraph boundaries in text.
   */
  findRanges(text: string): TextRange[] {
    const ranges = this.boundaryStrategy.findRanges(text);
    return ranges.filter(range => range.end > range.start);
  }

  /**
   * Process a paragraph into sentences and words.
   */
  process(paragraph: TextRange, startSentenceIndex: number): ParagraphResult {
    return this.sentenceProcessor.process(paragraph.text, paragraph.start, startSentenceIndex);
  }
}

/**
 * Factory function to create paragraph processor with default configuration
 */
function createParagraphProcessor(locale: string): ParagraphProcessor {
  const wordStrategy = new SpaceBasedWordProcessor();
  const boundaryStrategy = createDefaultBoundaryStrategy();
  return new ParagraphProcessor(locale, wordStrategy, boundaryStrategy);
}

/**
 * Factory functions for creating special elements
 */
const SpecialElementFactory = {
  createParagraphBreak(charIndex: number, sentenceIndex: number): SpecialElement {
    return {
      type: 'paragraph-break',
      charIndex,
      sentenceIndex,
    };
  },

  createSentenceEnd(charIndex: number, sentenceIndex: number): SpecialElement {
    return {
      type: 'sentence-end',
      charIndex,
      sentenceIndex,
    };
  },
};

/**
 * Text processor using Intl.Segmenter for sentence segmentation
 * and space-based splitting for word segmentation.
 * 
 * Uses hierarchical processing: Paragraphs → Sentences → Words
 * 
 * Words are split by spaces, and punctuation is attached to words.
 * This ensures no empty elements and proper punctuation handling.
 */
export class TextProcessor {
  private readonly paragraphProcessor: ParagraphProcessor;

  constructor(config: TextProcessorConfig = {}) {
    const locale = config.locale || DEFAULT_LOCALE;
    this.paragraphProcessor = createParagraphProcessor(locale);
  }

  /**
   * Process text into structured format with words and special elements.
   */
  process(text: string): ProcessedText {
    if (!text || text.trim().length === 0) {
      return { elements: [], words: [], sentences: [] };
    }

    const paragraphRanges = this.paragraphProcessor.findRanges(text);
    return this.buildProcessedText(paragraphRanges);
  }

  /**
   * Get element at specific index from processed text.
   */
  getElement(processedText: ProcessedText, index: number): TextElement | null {
    return index >= 0 && index < processedText.elements.length
      ? processedText.elements[index]
      : null;
  }

  /**
   * Get total word count from processed text.
   */
  getWordCount(processedText: ProcessedText): number {
    return processedText.words.length;
  }

  /**
   * Get total sentence count from processed text.
   */
  getSentenceCount(processedText: ProcessedText): number {
    return processedText.sentences.length;
  }

  /**
   * Build ProcessedText from paragraph ranges.
   */
  private buildProcessedText(paragraphRanges: TextRange[]): ProcessedText {
    const allWords: ProcessedWord[] = [];
    const allSentences: ProcessedWord[][] = [];
    const allElements: TextElement[] = [];
    let globalSentenceIndex = 0;

    for (let paraIndex = 0; paraIndex < paragraphRanges.length; paraIndex++) {
      const paragraph = paragraphRanges[paraIndex];
      
      // Add paragraph break (except before first paragraph)
      if (paraIndex > 0) {
        allElements.push(
          SpecialElementFactory.createParagraphBreak(paragraph.start, globalSentenceIndex)
        );
      }

      // Process paragraph
      const result = this.paragraphProcessor.process(paragraph, globalSentenceIndex);

      if (result.sentences.length > 0) {
        const isLastParagraph = paraIndex === paragraphRanges.length - 1;
        
        // Mark paragraph end on last word of last sentence in paragraph
        for (let sentIndex = 0; sentIndex < result.sentences.length; sentIndex++) {
          const sentence = result.sentences[sentIndex];
          const isLastSentenceInParagraph = sentIndex === result.sentences.length - 1;
          
          if (isLastSentenceInParagraph) {
            // Mark last word of paragraph as paragraph end
            const lastWord = sentence[sentence.length - 1];
            if (lastWord) {
              lastWord.isParagraphEnd = true;
            }
          }
        }
        
        allWords.push(...result.words);
        allSentences.push(...result.sentences);
        allElements.push(...result.words);

        // Add sentence end markers
        for (let sentIndex = 0; sentIndex < result.sentences.length; sentIndex++) {
          const isLastSentence = sentIndex === result.sentences.length - 1 && isLastParagraph;
          if (!isLastSentence) {
            const sentence = result.sentences[sentIndex];
            const lastWord = sentence[sentence.length - 1];
            allElements.push(
              SpecialElementFactory.createSentenceEnd(
                lastWord.charIndex + lastWord.text.length,
                globalSentenceIndex + sentIndex
              )
            );
          }
        }

        globalSentenceIndex += result.sentences.length;
      }
    }

    return { elements: allElements, words: allWords, sentences: allSentences };
  }
}
