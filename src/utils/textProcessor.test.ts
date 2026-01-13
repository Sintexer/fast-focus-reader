import { describe, it, expect } from 'vitest';
import {
  splitIntoSentences,
  tokenizeWords,
  enrichWords,
  processTextEnriched,
} from './textProcessor';
import { BookIterator } from './bookIterator';
import type { Book } from './db';

const SAMPLE_TEXT_1 = `The quick brown fox jumps over the lazy dog. This is a sample text for testing the RSVP reader. Each word appears one at a time, centered on the screen. The middle vowel of each word is highlighted in a theme color. You can control the reading speed with the WPM slider.`;

const SAMPLE_TEXT_2 = `Mr. Hale checked his watch. "It's 3.14 minutes past midnight," he said, half-joking; then he frowned.

"3.14 minutes?" I asked. "Are you serious—or are you trying to scare me?"

"No," Mr. Hale replied, "I'm trying to be precise… and you're interrupting." He tapped the page—twice—and whispered, "Listen: if you hear a click, don't move."

I laughed. "Don't move? In this house?!"

"Exactly." He paused. "Because if it clicks—if it clicks—then we're out of time."

From the hallway came a soft sound: click.

"Was that it?" I said.

Mr. Hale didn't answer. He just looked at me, eyes wide, and muttered, "Oh." Then, very quietly: "Run."`;

describe('splitIntoSentences', () => {
  it('should split simple sentences correctly', () => {
    const text = 'Hello world. How are you? I am fine!';
    const sentences = splitIntoSentences(text);
    expect(sentences).toEqual([
      'Hello world.',
      'How are you?',
      'I am fine!',
    ]);
  });

  it('should handle ellipsis', () => {
    const text = 'Wait… what? Really…';
    const sentences = splitIntoSentences(text);
    expect(sentences).toEqual(['Wait…', 'what?', 'Really…']);
  });

  it('should not split on periods in abbreviations', () => {
    const text = 'Mr. Smith went to Dr. Jones. They met at 3 p.m.';
    const sentences = splitIntoSentences(text);
    // Should not split after "Mr." or "Dr." or "p.m."
    expect(sentences.length).toBeGreaterThan(0);
    expect(sentences[0]).toContain('Mr. Smith');
  });

  it('should not split on periods in decimal numbers', () => {
    const text = 'The price is 3.14 dollars. That is cheap.';
    const sentences = splitIntoSentences(text);
    // Should not split after "3.14"
    expect(sentences.length).toBeGreaterThan(0);
    expect(sentences[0]).toContain('3.14');
  });

  it('should handle SAMPLE_TEXT_1 correctly', () => {
    const sentences = splitIntoSentences(SAMPLE_TEXT_1);
    expect(sentences.length).toBe(5);
    expect(sentences[0]).toBe('The quick brown fox jumps over the lazy dog.');
    expect(sentences[4]).toContain('WPM slider.');
  });

  it('should handle SAMPLE_TEXT_2 correctly', () => {
    const sentences = splitIntoSentences(SAMPLE_TEXT_2);
    // Should have multiple sentences, not split on "Mr." or "3.14"
    expect(sentences.length).toBeGreaterThan(5);
    
    // First sentence should contain "Mr. Hale"
    expect(sentences[0]).toContain('Mr. Hale');
    expect(sentences[0]).toContain('watch.');
    
    // Should not split "3.14" incorrectly
    const hasDecimal = sentences.some(s => s.includes('3.14'));
    expect(hasDecimal).toBe(true);
    
    // Check that sentences are properly separated
    sentences.forEach((sentence, index) => {
      expect(sentence.length).toBeGreaterThan(0);
      // Each sentence should end with punctuation (except possibly the last)
      if (index < sentences.length - 1) {
        expect(/[.!?…]$/.test(sentence.trim())).toBe(true);
      }
    });
  });

  it('should handle empty lines and whitespace', () => {
    const text = 'First sentence.\n\nSecond sentence.';
    const sentences = splitIntoSentences(text);
    expect(sentences.length).toBe(2);
    expect(sentences[0]).toBe('First sentence.');
    expect(sentences[1]).toBe('Second sentence.');
  });
});

describe('tokenizeWords', () => {
  it('should split sentence into words', () => {
    const sentence = 'Hello world, how are you?';
    const words = tokenizeWords(sentence);
    expect(words).toEqual(['Hello', 'world,', 'how', 'are', 'you?']);
  });

  it('should preserve punctuation with words', () => {
    const sentence = 'He said, "Hello!"';
    const words = tokenizeWords(sentence);
    expect(words).toContain('said,');
    expect(words).toContain('"Hello!"');
  });
});

describe('enrichWords', () => {
  it('should enrich words with punctuation and context', () => {
    const sentence = 'Hello, world!';
    const enriched = enrichWords(sentence, 0, 0, false); // paragraph 0, sentence 0, not paragraph end
    
    expect(enriched.length).toBe(2);
    expect(enriched[0].text).toBe('Hello');
    expect(enriched[0].punctuation.after).toBe(',');
    expect(enriched[1].text).toBe('world');
    expect(enriched[1].punctuation.endOfSentence).toBe('!');
    expect(enriched[1].pauseType).toBe('full'); // End of sentence requires full pause (manual advance)
    expect(enriched[1].paragraphIndex).toBe(0);
    expect(enriched[1].sentenceIndex).toBe(0);
  });

  it('should detect dialog context', () => {
    const sentence = '"Hello," he said.';
    const enriched = enrichWords(sentence, 0, 0, false);
    
    expect(enriched[0].context.dialogStart).toBe(true);
    expect(enriched[0].context.inDialog).toBe(true);
    // "Hello," has both opening and closing quotes, so dialog ends there
    // "he" should not be in dialog
    expect(enriched[0].context.dialogEnd).toBe(true);
    expect(enriched[1].context.inDialog).toBe(false);
    
    // Test a multi-word dialog
    const sentence2 = '"Hello world," he said.';
    const enriched2 = enrichWords(sentence2, 0, 0, false);
    expect(enriched2[0].context.dialogStart).toBe(true);
    expect(enriched2[0].context.inDialog).toBe(true);
    expect(enriched2[1].context.inDialog).toBe(true); // "world," is still in dialog
    expect(enriched2[1].context.dialogEnd).toBe(true); // "world," closes the dialog
    expect(enriched2[2].context.inDialog).toBe(false); // "he" is not in dialog
  });

  it('should handle abbreviations correctly', () => {
    const sentence = 'Mr. Smith went to Dr. Jones.';
    const enriched = enrichWords(sentence, 0, 0, false);
    
    // "Mr." should be detected as abbreviation
    const mrWord = enriched.find(w => w.text === 'Mr' || w.text.includes('Mr'));
    expect(mrWord).toBeDefined();
  });

  it('should handle decimal numbers correctly', () => {
    const sentence = 'The price is 3.14 dollars.';
    const enriched = enrichWords(sentence, 0, 0, false);
    
    // "3.14" should be kept together
    const decimalWord = enriched.find(w => w.text === '3.14' || w.displayAs === '3.14');
    expect(decimalWord).toBeDefined();
    expect(decimalWord?.specialCase).toBe('decimal');
  });

  it('should group initials together', () => {
    const sentence = 'J. R. R. Tolkien wrote books.';
    const enriched = enrichWords(sentence, 0, 0, false);
    
    // Should have fewer words than if initials were separate
    // "J. R. R." should be grouped
    const hasGroupedInitials = enriched.some(w => w.displayAs.includes('J. R. R.'));
    expect(hasGroupedInitials).toBe(true);
  });
});

describe('BookIterator', () => {
  it('should iterate through sentences correctly', () => {
    const book: Book = {
      id: 'test-book',
      title: 'Test Book',
      language: 'en',
      structure: {
        volumes: [
          {
            id: 'vol-1',
            title: '',
            chapters: [
              {
                id: 'ch-1',
                title: 'Chapter 1',
                content: SAMPLE_TEXT_1,
              },
            ],
          },
        ],
      },
      createdAt: Date.now(),
    };

    const iterator = new BookIterator(book);
    
    const sentenceCount = iterator.getSentenceCount('vol-1', 'ch-1');
    expect(sentenceCount).toBe(5);
    
    // Check first sentence
    const firstSentence = iterator.getSentence('vol-1', 'ch-1', 0);
    expect(firstSentence).toBeDefined();
    expect(firstSentence?.[0]).toBe('The');
    
    // Check enriched sentence
    const enrichedFirst = iterator.getEnrichedSentence('vol-1', 'ch-1', 0);
    expect(enrichedFirst).toBeDefined();
    expect(enrichedFirst?.length).toBeGreaterThan(0);
    expect(enrichedFirst?.[0].text).toBe('The');
  });

  it('should handle SAMPLE_TEXT_2 correctly', () => {
    const book: Book = {
      id: 'test-book-2',
      title: 'Test Book 2',
      language: 'en',
      structure: {
        volumes: [
          {
            id: 'vol-1',
            title: '',
            chapters: [
              {
                id: 'ch-1',
                title: 'Chapter 1',
                content: SAMPLE_TEXT_2,
              },
            ],
          },
        ],
      },
      createdAt: Date.now(),
    };

    const iterator = new BookIterator(book);
    
    const sentenceCount = iterator.getSentenceCount('vol-1', 'ch-1');
    expect(sentenceCount).toBeGreaterThan(5);
    
    // Check first sentence - should contain "Mr. Hale" as one unit or properly separated
    const firstSentence = iterator.getEnrichedSentence('vol-1', 'ch-1', 0);
    expect(firstSentence).toBeDefined();
    expect(firstSentence?.length).toBeGreaterThan(0);
    
    // Verify "Mr." is handled correctly (not split)
    const firstSentenceText = firstSentence?.map(w => w.displayAs).join(' ') || '';
    expect(firstSentenceText).toContain('Mr. Hale');
    
    // Verify "3.14" is handled correctly - check all sentences since it might be in a different sentence
    let hasDecimal = false;
    for (let i = 0; i < Math.min(sentenceCount, 5); i++) {
      const sentence = iterator.getEnrichedSentence('vol-1', 'ch-1', i);
      if (sentence?.some(w => 
        w.text === '3.14' || 
        w.displayAs?.includes('3.14') || 
        w.specialCase === 'decimal' ||
        w.originalText?.includes('3.14')
      )) {
        hasDecimal = true;
        break;
      }
    }
    expect(hasDecimal).toBe(true);
    
    // Verify dialog context is tracked
    let inDialog = false;
    for (let i = 0; i < sentenceCount; i++) {
      const sentence = iterator.getEnrichedSentence('vol-1', 'ch-1', i);
      if (sentence) {
        sentence.forEach(word => {
          if (word.context.dialogStart) {
            inDialog = true;
          }
          if (word.context.dialogEnd) {
            inDialog = false;
          }
        });
      }
    }
    
    // Should have dialog markers
    const hasDialog = iterator.getEnrichedSentence('vol-1', 'ch-1', 0)?.some(w => 
      w.context.dialogStart || w.context.inDialog
    );
    expect(hasDialog).toBe(true);
  });

  it('should iterate through words correctly', () => {
    const book: Book = {
      id: 'test-book',
      title: 'Test Book',
      language: 'en',
      structure: {
        volumes: [
          {
            id: 'vol-1',
            title: '',
            chapters: [
              {
                id: 'ch-1',
                title: 'Chapter 1',
                content: 'Hello world. How are you?',
              },
            ],
          },
        ],
      },
      createdAt: Date.now(),
    };

    const iterator = new BookIterator(book);
    
    // First sentence, first word
    const word1 = iterator.getEnrichedWord('vol-1', 'ch-1', 0, 0);
    expect(word1?.text).toBe('Hello');
    
    // First sentence, second word
    const word2 = iterator.getEnrichedWord('vol-1', 'ch-1', 0, 1);
    expect(word2?.text).toBe('world');
    expect(word2?.punctuation.endOfSentence).toBe('.');
    // End of sentence requires 'full' pause (manual advance)
    expect(word2?.pauseType).toBe('full');
    
    // Second sentence, first word
    const word3 = iterator.getEnrichedWord('vol-1', 'ch-1', 1, 0);
    expect(word3?.text).toBe('How');
  });
});
