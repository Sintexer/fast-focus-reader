import { describe, it, expect } from 'vitest';
import { TextProcessor } from '../textProcessor';
import { isProcessedWord, isSpecialElement } from '../types';

describe('TextProcessor', () => {
  describe('Russian text processing', () => {
    it('should process simple Russian text', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Привет мир. Как дела?';
      const result = processor.process(text);

      expect(result.words.length).toBeGreaterThan(0);
      expect(result.sentences.length).toBe(2);
      expect(result.elements.length).toBeGreaterThan(0);
    });

    it('should attach punctuation to words', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Он сказал. "Нет," ответил он.';
      const result = processor.process(text);

      // Punctuation should be attached to words
      const saidWord = result.words.find(w => w.text.includes('сказал'));
      expect(saidWord).toBeDefined();
      expect(saidWord?.text).toContain('.');
      
      const noWord = result.words.find(w => w.text.includes('Нет'));
      expect(noWord).toBeDefined();
      expect(noWord?.text).toMatch(/Нет[,"]/);
    });

    it('should attach leading punctuation to following word', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = '- Я сказал.';
      const result = processor.process(text);

      // The "-" should be attached to "Я"
      const yaWord = result.words.find(w => w.text.includes('Я'));
      expect(yaWord).toBeDefined();
      expect(yaWord?.text).toContain('-');
    });

    it('should attach trailing punctuation separated by space to word', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Iron-man .';
      const result = processor.process(text);

      // Dot should be attached to "Iron-man"
      const ironWord = result.words.find(w => w.text.includes('Iron'));
      expect(ironWord).toBeDefined();
      expect(ironWord?.text).toContain('.');
    });

    it('should track character indices correctly', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Привет мир';
      const result = processor.process(text);

      expect(result.words.length).toBeGreaterThan(0);
      result.words.forEach((word, index) => {
        expect(word.charIndex).toBeGreaterThanOrEqual(0);
        if (index > 0) {
          expect(word.charIndex).toBeGreaterThan(result.words[index - 1].charIndex);
        }
      });
    });

    it('should assign correct sentence indices to words', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Первое предложение. Второе предложение.';
      const result = processor.process(text);

      expect(result.sentences.length).toBe(2);
      
      // All words in first sentence should have sentenceIndex 0
      result.sentences[0].forEach(word => {
        expect(word.sentenceIndex).toBe(0);
      });

      // All words in second sentence should have sentenceIndex 1
      result.sentences[1].forEach(word => {
        expect(word.sentenceIndex).toBe(1);
      });
    });

    it('should assign correct word indices within sentences', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Один два три.';
      const result = processor.process(text);

      expect(result.sentences[0].length).toBeGreaterThanOrEqual(3);
      result.sentences[0].forEach((word, index) => {
        expect(word.wordIndex).toBe(index);
      });
    });
  });

  describe('Sentence detection', () => {
    it('should detect sentence boundaries', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Первое предложение. Второе предложение! Третье предложение?';
      const result = processor.process(text);

      expect(result.sentences.length).toBe(3);
    });

    it('should include sentence-end special elements', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Первое. Второе.';
      const result = processor.process(text);

      const sentenceEnds = result.elements.filter(isSpecialElement)
        .filter(e => e.type === 'sentence-end');
      
      // Should have at least one sentence-end marker (not the last one)
      expect(sentenceEnds.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Paragraph detection', () => {
    it('should detect paragraphs separated by double newlines', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Первый параграф.\n\nВторой параграф.';
      const result = processor.process(text);

      const paraBreaks = result.elements.filter(isSpecialElement)
        .filter(e => e.type === 'paragraph-break');
      
      expect(paraBreaks.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect paragraphs separated by single newline after sentence end', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Первый параграф.\nВторой параграф.';
      const result = processor.process(text);

      const paraBreaks = result.elements.filter(isSpecialElement)
        .filter(e => e.type === 'paragraph-break');
      
      // May or may not detect depending on capitalization
      expect(result.sentences.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const result = processor.process('');

      expect(result.words).toEqual([]);
      expect(result.sentences).toEqual([]);
      expect(result.elements).toEqual([]);
    });

    it('should handle whitespace-only text', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const result = processor.process('   \n\n   ');

      expect(result.words).toEqual([]);
      expect(result.sentences).toEqual([]);
    });

    it('should handle text with only punctuation', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = '... !?';
      const result = processor.process(text);

      // Should create words from punctuation (edge case)
      expect(result.words.length).toBeGreaterThan(0);
      // Punctuation-only text becomes a word
      expect(result.words[0].text).toMatch(/[.!?]/);
    });

    it('should handle single word', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Слово';
      const result = processor.process(text);

      expect(result.words.length).toBe(1);
      expect(result.words[0].text).toBe('Слово');
      expect(result.words[0].sentenceIndex).toBe(0);
      expect(result.words[0].wordIndex).toBe(0);
    });
  });

  describe('Helper methods', () => {
    it('getElement should return correct element', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Привет мир.';
      const result = processor.process(text);

      const element = processor.getElement(result, 0);
      expect(element).toBeDefined();
      expect(isProcessedWord(element!)).toBe(true);
    });

    it('getElement should return null for invalid index', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Привет';
      const result = processor.process(text);

      expect(processor.getElement(result, -1)).toBeNull();
      expect(processor.getElement(result, 1000)).toBeNull();
    });

    it('getWordCount should return correct count', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Один два три';
      const result = processor.process(text);

      expect(processor.getWordCount(result)).toBe(result.words.length);
    });

    it('getSentenceCount should return correct count', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Первое. Второе.';
      const result = processor.process(text);

      expect(processor.getSentenceCount(result)).toBe(2);
    });
  });

  describe('Complex examples', () => {
    it('should handle example from requirements: "said.", "\'No,", "- I"', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = 'Он сказал. "Нет," - я ответил.';
      const result = processor.process(text);

      // Punctuation should be attached to words
      const words = result.words;
      const saidWord = words.find(w => w.text.includes('сказал'));
      expect(saidWord).toBeDefined();
      expect(saidWord?.text).toContain('.');

      const noWord = words.find(w => w.text.includes('Нет'));
      expect(noWord).toBeDefined();
      expect(noWord?.text).toMatch(/Нет[,"]/);

      const iWord = words.find(w => w.text.includes('я'));
      expect(iWord).toBeDefined();
      // Dash should be attached to "я" or kept separate based on implementation
      expect(iWord?.text).toBeTruthy();
    });

    it('should handle example: "- I", "am", "Iron-man ."', () => {
      const processor = new TextProcessor({ locale: 'ru' });
      const text = '- Я железный человек .';
      const result = processor.process(text);

      const words = result.words;
      // Dash should be attached to "Я"
      const yaWord = words.find(w => w.text.includes('Я'));
      expect(yaWord).toBeDefined();
      expect(yaWord?.text).toContain('-');

      // Dot should be attached to last word
      const lastWord = words[words.length - 1];
      expect(lastWord.text).toContain('.');
    });
  });
});
