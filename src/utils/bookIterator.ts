import type { Book, Chapter } from './db';
import { 
  processText, 
  processTextEnriched,
  type ProcessedText,
  type EnrichedProcessedText,
  type EnrichedWord
} from './textProcessor';

interface CachedChapter {
  chapterId: string;
  processed: ProcessedText;
  enriched?: EnrichedProcessedText;
  lastAccessed: number;
}

export class BookIterator {
  private book: Book;
  private cache: Map<string, CachedChapter>;
  private maxCacheSize: number;
  private currentChapterId: string | null = null;

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

  // Convert paragraphs structure to text string for processing
  private paragraphsToText(paragraphs: string[][]): string {
    return paragraphs
      .map(paragraph => paragraph.join(' '))
      .join('\n\n');
  }

  private processChapter(chapter: Chapter): ProcessedText {
    // Use paragraphs if available, otherwise fall back to content string
    if (chapter.paragraphs && chapter.paragraphs.length > 0) {
      const text = this.paragraphsToText(chapter.paragraphs);
      return processText(text);
    }
    // Legacy: convert content string to paragraphs structure
    if (chapter.content) {
      return processText(chapter.content);
    }
    // Empty chapter
    return { paragraphs: [], sentences: [], words: [], language: 'en' };
  }

  private processChapterEnriched(chapter: Chapter): EnrichedProcessedText {
    // Use paragraphs if available, otherwise fall back to content string
    if (chapter.paragraphs && chapter.paragraphs.length > 0) {
      const text = this.paragraphsToText(chapter.paragraphs);
      return processTextEnriched(text);
    }
    // Legacy: convert content string to paragraphs structure
    if (chapter.content) {
      return processTextEnriched(chapter.content);
    }
    // Empty chapter
    return { paragraphs: [], sentences: [], words: [], language: 'en' };
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

  private getEnrichedProcessedChapter(volumeId: string, chapterId: string): EnrichedProcessedText | null {
    // Track current chapter
    if (this.currentChapterId !== chapterId) {
      this.currentChapterId = chapterId;
    }

    // Check cache first
    const cached = this.getCachedChapter(chapterId);
    if (cached) {
      cached.lastAccessed = Date.now();
      
      // Return cached enriched data if available
      if (cached.enriched) {
        return cached.enriched;
      }
      
      // Otherwise, create enriched version from processed
      const chapter = this.getChapter(volumeId, chapterId);
      if (!chapter) return null;
      
      const enriched = this.processChapterEnriched(chapter);
      cached.enriched = enriched;
      return enriched;
    }

    // Process on demand
    const chapter = this.getChapter(volumeId, chapterId);
    if (!chapter) return null;

    const processed = this.processChapter(chapter);
    const enriched = this.processChapterEnriched(chapter);
    
    this.cacheChapter(chapterId, processed);
    // Update cache with enriched data
    const existing = this.cache.get(chapterId);
    if (existing) {
      existing.enriched = enriched;
    }
    
    return enriched;
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
    // Use enriched sentence for accurate count (accounts for grouped initials, etc.)
    const enrichedSentence = this.getEnrichedSentence(volumeId, chapterId, sentenceIndex);
    if (enrichedSentence) {
      return enrichedSentence.length;
    }
    // Fallback to regular sentence
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

  // Enhanced methods for enriched words

  getEnrichedSentence(volumeId: string, chapterId: string, sentenceIndex: number): EnrichedWord[] | null {
    const enriched = this.getEnrichedProcessedChapter(volumeId, chapterId);
    if (!enriched || sentenceIndex < 0 || sentenceIndex >= enriched.sentences.length) {
      return null;
    }
    
    const sentence = enriched.sentences[sentenceIndex];
    
    return sentence;
  }

  getEnrichedWord(volumeId: string, chapterId: string, sentenceIndex: number, wordIndex: number): EnrichedWord | null {
    const sentence = this.getEnrichedSentence(volumeId, chapterId, sentenceIndex);
    if (!sentence || wordIndex < 0 || wordIndex >= sentence.length) {
      return null;
    }
    return sentence[wordIndex];
  }

  // Get paragraph information
  getParagraphCount(volumeId: string, chapterId: string): number {
    const enriched = this.getEnrichedProcessedChapter(volumeId, chapterId);
    return enriched?.paragraphs.length || 0;
  }

  // Get sentence index within a paragraph (for a given global sentence index)
  getParagraphAndSentenceIndex(volumeId: string, chapterId: string, sentenceIndex: number): { paragraphIndex: number; sentenceIndexInParagraph: number } | null {
    const enriched = this.getEnrichedProcessedChapter(volumeId, chapterId);
    if (!enriched) return null;
    
    let currentSentenceIndex = 0;
    for (let paraIndex = 0; paraIndex < enriched.paragraphs.length; paraIndex++) {
      const paragraph = enriched.paragraphs[paraIndex];
      for (let sentIndex = 0; sentIndex < paragraph.length; sentIndex++) {
        if (currentSentenceIndex === sentenceIndex) {
          return { paragraphIndex: paraIndex, sentenceIndexInParagraph: sentIndex };
        }
        currentSentenceIndex++;
      }
    }
    
    return null;
  }

  // Get all sentences in a paragraph
  getParagraphSentences(volumeId: string, chapterId: string, paragraphIndex: number): EnrichedWord[][] | null {
    const enriched = this.getEnrichedProcessedChapter(volumeId, chapterId);
    if (!enriched || paragraphIndex < 0 || paragraphIndex >= enriched.paragraphs.length) {
      return null;
    }
    return enriched.paragraphs[paragraphIndex];
  }

  getCurrentContext(): { inQuotes: boolean; inBrackets: boolean } {
    // Get context from current word if available
    // This is a simplified version - context is now per-word
    return { inQuotes: false, inBrackets: false };
  }
}
