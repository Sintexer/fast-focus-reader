import type { Book, Chapter } from './db';
import { processText, type ProcessedText } from './textProcessor';

interface CachedChapter {
  chapterId: string;
  processed: ProcessedText;
  lastAccessed: number;
}

export class BookIterator {
  private book: Book;
  private cache: Map<string, CachedChapter>;
  private maxCacheSize: number;

  constructor(book: Book, maxCacheSize: number = 10) {
    this.book = book;
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;
  }

  private getChapter(volumeId: string, chapterId: string): Chapter | null {
    const volume = this.book.structure.volumes.find(v => v.id === volumeId);
    if (!volume) return null;
    
    const chapter = volume.chapters.find(c => c.id === chapterId);
    return chapter || null;
  }

  private processChapter(chapter: Chapter): ProcessedText {
    return processText(chapter.content);
  }

  private getCachedChapter(chapterId: string): CachedChapter | null {
    return this.cache.get(chapterId) || null;
  }

  private cacheChapter(chapterId: string, processed: ProcessedText): void {
    // If cache is full, evict least recently used
    if (this.cache.size >= this.maxCacheSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, value] of this.cache.entries()) {
        if (value.lastAccessed < oldestTime) {
          oldestTime = value.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(chapterId, {
      chapterId,
      processed,
      lastAccessed: Date.now(),
    });
  }

  private getProcessedChapter(volumeId: string, chapterId: string): ProcessedText | null {
    // Check cache first
    const cached = this.getCachedChapter(chapterId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.processed;
    }

    // Process on demand
    const chapter = this.getChapter(volumeId, chapterId);
    if (!chapter) return null;

    const processed = this.processChapter(chapter);
    this.cacheChapter(chapterId, processed);
    return processed;
  }

  getSentence(volumeId: string, chapterId: string, sentenceIndex: number): string[] | null {
    const processed = this.getProcessedChapter(volumeId, chapterId);
    if (!processed || sentenceIndex < 0 || sentenceIndex >= processed.sentences.length) {
      return null;
    }
    return processed.sentences[sentenceIndex];
  }

  getWord(volumeId: string, chapterId: string, sentenceIndex: number, wordIndex: number): string | null {
    const sentence = this.getSentence(volumeId, chapterId, sentenceIndex);
    if (!sentence || wordIndex < 0 || wordIndex >= sentence.length) {
      return null;
    }
    return sentence[wordIndex];
  }

  getSentenceCount(volumeId: string, chapterId: string): number {
    const processed = this.getProcessedChapter(volumeId, chapterId);
    return processed?.sentences.length || 0;
  }

  getWordCount(volumeId: string, chapterId: string, sentenceIndex: number): number {
    const sentence = this.getSentence(volumeId, chapterId, sentenceIndex);
    return sentence?.length || 0;
  }

  getAllSentences(volumeId: string, chapterId: string): string[][] | null {
    const processed = this.getProcessedChapter(volumeId, chapterId);
    return processed?.sentences || null;
  }

  getLanguage(): 'en' | 'ru' {
    return this.book.language;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
