import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlaybackController } from '../playbackController';
import { TextProcessor } from '../textProcessor';
import type { ProcessedText } from '../types';

describe('PlaybackController', () => {
  let processor: TextProcessor;
  let processedText: ProcessedText;

  beforeEach(() => {
    processor = new TextProcessor({ locale: 'ru' });
    processedText = processor.process('Первое слово. Второе слово. Третье слово.');
  });

  describe('Initialization', () => {
    it('should initialize with first word', () => {
      const controller = new PlaybackController(processedText);
      const state = controller.getState();

      expect(state.currentWordIndex).toBe(0);
      expect(state.currentSentenceIndex).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.currentWord).toBeDefined();
      expect(state.wpm).toBe(200); // default
    });

    it('should initialize with custom WPM', () => {
      const controller = new PlaybackController(processedText, { wpm: 300 });
      const state = controller.getState();

      expect(state.wpm).toBe(300);
    });

    it('should call onStateChange callback on state updates', () => {
      const onStateChange = vi.fn();
      const controller = new PlaybackController(processedText, { onStateChange });

      expect(onStateChange).toHaveBeenCalled();
    });
  });

  describe('Play/Pause', () => {
    it('should start playback', () => {
      const controller = new PlaybackController(processedText);
      controller.play();
      const state = controller.getState();

      expect(state.isPlaying).toBe(true);
    });

    it('should pause playback', () => {
      const controller = new PlaybackController(processedText);
      controller.play();
      controller.pause();
      const state = controller.getState();

      expect(state.isPlaying).toBe(false);
    });

    it('should not start playback if already playing', () => {
      const controller = new PlaybackController(processedText);
      controller.play();
      const state1 = controller.getState();
      controller.play();
      const state2 = controller.getState();

      expect(state1.isPlaying).toBe(true);
      expect(state2.isPlaying).toBe(true);
    });

    it('should not pause if already paused', () => {
      const controller = new PlaybackController(processedText);
      controller.pause();
      const state = controller.getState();

      expect(state.isPlaying).toBe(false);
    });
  });

  describe('Word Navigation', () => {
    it('should move to next word', () => {
      const controller = new PlaybackController(processedText);
      const state1 = controller.getState();
      controller.nextWord();
      const state2 = controller.getState();

      expect(state2.currentWordIndex).toBe(state1.currentWordIndex + 1);
      expect(state2.currentWord).toBeDefined();
    });

    it('should move to previous word', () => {
      const controller = new PlaybackController(processedText);
      controller.nextWord();
      const state1 = controller.getState();
      controller.prevWord();
      const state2 = controller.getState();

      expect(state2.currentWordIndex).toBe(state1.currentWordIndex - 1);
    });

    it('should not move beyond last word', () => {
      const controller = new PlaybackController(processedText);
      
      // Move to last word
      while (controller.getState().currentWordIndex < processedText.words.length - 1) {
        controller.nextWord();
      }

      const lastIndex = controller.getState().currentWordIndex;
      controller.nextWord();
      const finalIndex = controller.getState().currentWordIndex;

      expect(finalIndex).toBe(lastIndex);
      expect(controller.getState().isPlaying).toBe(false);
    });

    it('should not move before first word', () => {
      const controller = new PlaybackController(processedText);
      controller.prevWord();
      const state = controller.getState();

      expect(state.currentWordIndex).toBe(0);
    });
  });

  describe('Sentence Navigation', () => {
    it('should skip to next sentence', () => {
      const controller = new PlaybackController(processedText);
      const state1 = controller.getState();
      controller.nextSentence();
      const state2 = controller.getState();

      expect(state2.currentSentenceIndex).toBeGreaterThan(state1.currentSentenceIndex);
      expect(state2.currentWordIndex).toBeGreaterThanOrEqual(0);
    });

    it('should skip to previous sentence', () => {
      const controller = new PlaybackController(processedText);
      controller.nextSentence();
      const state1 = controller.getState();
      controller.prevSentence();
      const state2 = controller.getState();

      expect(state2.currentSentenceIndex).toBeLessThan(state1.currentSentenceIndex);
    });

    it('should not skip beyond last sentence', () => {
      const controller = new PlaybackController(processedText);
      
      // Move to last sentence
      while (controller.getState().currentSentenceIndex < controller.getState().maxSentenceIndex) {
        controller.nextSentence();
      }

      const lastSentenceIndex = controller.getState().currentSentenceIndex;
      controller.nextSentence();
      const finalSentenceIndex = controller.getState().currentSentenceIndex;

      expect(finalSentenceIndex).toBe(lastSentenceIndex);
    });

    it('should not skip before first sentence', () => {
      const controller = new PlaybackController(processedText);
      controller.prevSentence();
      const state = controller.getState();

      expect(state.currentSentenceIndex).toBe(0);
    });
  });

  describe('Reset', () => {
    it('should reset to beginning', () => {
      const controller = new PlaybackController(processedText);
      controller.nextWord();
      controller.nextWord();
      controller.play();
      
      controller.reset();
      const state = controller.getState();

      expect(state.currentWordIndex).toBe(0);
      expect(state.currentSentenceIndex).toBe(0);
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('WPM Control', () => {
    it('should update WPM', () => {
      const controller = new PlaybackController(processedText);
      controller.setWPM(300);
      const state = controller.getState();

      expect(state.wpm).toBe(300);
    });

    it('should not set invalid WPM', () => {
      const controller = new PlaybackController(processedText);
      const originalWPM = controller.getState().wpm;
      controller.setWPM(0);
      controller.setWPM(-10);
      const state = controller.getState();

      expect(state.wpm).toBe(originalWPM);
    });

    it('should restart timer with new WPM when playing', (done) => {
      vi.useFakeTimers();
      const controller = new PlaybackController(processedText, { wpm: 60 }); // 1 word per second
      controller.play();
      
      // Change WPM while playing
      controller.setWPM(120); // 2 words per second
      
      // Fast-forward time
      vi.advanceTimersByTime(500); // 0.5 seconds
      
      // Should have advanced (with new speed)
      const state = controller.getState();
      expect(state.currentWordIndex).toBeGreaterThan(0);
      
      vi.useRealTimers();
      done();
    });
  });

  describe('Auto-pause at sentence end', () => {
    it('should auto-pause when reaching sentence end', (done) => {
      vi.useFakeTimers();
      
      // Create text with sentence ending
      const textWithEnd = processor.process('Первое слово. Второе слово.');
      const controller = new PlaybackController(textWithEnd, { wpm: 60 });
      
      // Find word that ends with period
      const wordWithPeriod = textWithEnd.words.find(w => w.text.includes('.'));
      if (wordWithPeriod) {
        const wordIndex = textWithEnd.words.indexOf(wordWithPeriod);
        
        // Move to word before sentence end
        for (let i = 0; i < wordIndex; i++) {
          controller.nextWord();
        }
        
        controller.play();
        
        // Advance time - should move to sentence end and pause
        vi.advanceTimersByTime(2000);
        
        const state = controller.getState();
        // Should have paused at sentence end
        expect(state.isPlaying).toBe(false);
      }
      
      vi.useRealTimers();
      done();
    });
  });

  describe('Timing', () => {
    it('should advance words based on WPM', (done) => {
      vi.useFakeTimers();
      
      const controller = new PlaybackController(processedText, { wpm: 60 }); // 1 word per second
      controller.play();
      
      const initialIndex = controller.getState().currentWordIndex;
      
      // Advance 1 second
      vi.advanceTimersByTime(1000);
      
      const newIndex = controller.getState().currentWordIndex;
      expect(newIndex).toBeGreaterThan(initialIndex);
      
      vi.useRealTimers();
      done();
    });
  });

  describe('Update Processed Text', () => {
    it('should update when text changes', () => {
      const controller = new PlaybackController(processedText);
      controller.nextWord();
      controller.nextWord();
      
      const newText = processor.process('Новый текст.');
      controller.updateProcessedText(newText);
      
      const state = controller.getState();
      expect(state.maxSentenceIndex).toBe(newText.sentences.length - 1);
    });

    it('should adjust indices when text becomes shorter', () => {
      const controller = new PlaybackController(processedText);
      
      // Move to a high index
      for (let i = 0; i < 10; i++) {
        controller.nextWord();
      }
      
      const shortText = processor.process('Короткий.');
      controller.updateProcessedText(shortText);
      
      const state = controller.getState();
      expect(state.currentWordIndex).toBeLessThanOrEqual(shortText.words.length - 1);
    });
  });

  describe('Cleanup', () => {
    it('should clear timer on destroy', () => {
      const controller = new PlaybackController(processedText);
      controller.play();
      controller.destroy();
      
      const state = controller.getState();
      expect(state.isPlaying).toBe(false);
    });
  });
});
