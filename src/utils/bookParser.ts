import { splitIntoParagraphs, splitIntoSentences, detectLanguage } from './textProcessor';
import type { Book, Chapter, Volume } from './db';
import { parseFB2, parseEPUB } from './bookParsers';

/**
 * Parse text content into Book structure
 * Attempts to detect chapters by looking for chapter markers (e.g., "Chapter 1", "Chapter I", etc.)
 * If no chapters are detected, creates a single chapter with all content
 */
export function parseTextToBook(
  text: string,
  options: {
    title?: string;
    author?: string;
    language?: 'en' | 'ru';
  } = {}
): Book {
  const language = options.language || detectLanguage(text);
  const paragraphs = splitIntoParagraphs(text);
  
  // Convert paragraphs to the format expected by Book structure
  // Each paragraph is an array of sentences (strings)
  const paragraphSentences: string[][] = [];
  
  for (const paragraph of paragraphs) {
    const sentences = splitIntoSentences(paragraph);
    paragraphSentences.push(sentences);
  }
  
  // Try to detect chapters by looking for chapter markers
  const chapters = detectChapters(paragraphSentences);
  
  // Create a single volume with all chapters
  const volume: Volume = {
    id: 'vol-1',
    title: '',
    chapters,
  };
  
  // Generate a unique ID for the book
  const bookId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  
  const book: Book = {
    id: bookId,
    title: options.title || 'Untitled Book',
    author: options.author,
    language,
    structure: {
      volumes: [volume],
    },
    createdAt: Date.now(),
    lastReadAt: 0,
  };
  
  return book;
}

/**
 * Parse a file (TXT, EPUB, or FB2) into Book structure
 */
export async function parseFileToBook(
  file: File,
  options: {
    title?: string;
    author?: string;
    language?: 'en' | 'ru';
  } = {}
): Promise<Book> {
  const fileName = file.name.toLowerCase();
  let parsedData: { title: string; author?: string; chapters: Array<{ title: string; paragraphs: string[][] }> };

  if (fileName.endsWith('.fb2')) {
    parsedData = await parseFB2(file);
  } else if (fileName.endsWith('.epub')) {
    parsedData = await parseEPUB(file);
  } else if (fileName.endsWith('.txt')) {
    // For TXT files, read as text and use existing parser
    const text = await file.text();
    const language = options.language || detectLanguage(text);
    const paragraphs = splitIntoParagraphs(text);
    const paragraphSentences: string[][] = [];
    
    for (const paragraph of paragraphs) {
      const sentences = splitIntoSentences(paragraph);
      paragraphSentences.push(sentences);
    }
    
    const chapters = detectChapters(paragraphSentences);
    parsedData = {
      title: options.title || file.name.replace(/\.(txt|epub|fb2)$/i, ''),
      author: options.author,
      chapters: chapters.map(ch => ({ title: ch.title, paragraphs: ch.paragraphs || [] })),
    };
  } else {
    throw new Error(`Unsupported file format. Supported: .txt, .epub, .fb2`);
  }

  // Convert to Book structure
  const language = options.language || detectLanguage(
    parsedData.chapters.flatMap(ch => ch.paragraphs.flat()).join(' ')
  );

  const chapters: Chapter[] = parsedData.chapters.map((ch, index) => ({
    id: `ch-${index + 1}`,
    title: ch.title,
    paragraphs: ch.paragraphs,
  }));

  const volume: Volume = {
    id: 'vol-1',
    title: '',
    chapters,
  };

  const bookId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const book: Book = {
    id: bookId,
    title: options.title || parsedData.title || 'Untitled Book',
    author: options.author || parsedData.author,
    language,
    structure: {
      volumes: [volume],
    },
    createdAt: Date.now(),
    lastReadAt: 0,
  };

  return book;
}

/**
 * Detect chapters in paragraph sentences by looking for chapter markers
 * If no markers are found, creates a single chapter
 */
function detectChapters(paragraphSentences: string[][]): Chapter[] {
  const chapters: Chapter[] = [];
  let currentChapterParagraphs: string[][] = [];
  let currentChapterTitle = 'Chapter 1';
  let chapterNumber = 1;
  
  // Patterns to detect chapter markers
  const chapterPatterns = [
    /^Chapter\s+(\d+|[IVX]+)/i,
    /^Chapter\s+([A-Z])/i,
    /^Ch\.\s*(\d+)/i,
    /^(\d+)\./,
    /^[IVX]+\./,
  ];
  
  for (let i = 0; i < paragraphSentences.length; i++) {
    const paragraph = paragraphSentences[i];
    if (paragraph.length === 0) continue;
    
    const firstSentence = paragraph[0];
    let isChapterMarker = false;
    let detectedTitle = '';
    
    // Check if first sentence looks like a chapter marker
    for (const pattern of chapterPatterns) {
      const match = firstSentence.match(pattern);
      if (match) {
        isChapterMarker = true;
        detectedTitle = firstSentence.trim();
        break;
      }
    }
    
    // Also check if it's a very short sentence (likely a title)
    if (!isChapterMarker && firstSentence.length < 100 && paragraph.length === 1) {
      // Check if next paragraph starts with capital letter (likely chapter start)
      if (i + 1 < paragraphSentences.length) {
        const nextParagraph = paragraphSentences[i + 1];
        if (nextParagraph.length > 0) {
          const nextFirstSentence = nextParagraph[0];
          if (/^[A-ZА-ЯЁ]/.test(nextFirstSentence)) {
            isChapterMarker = true;
            detectedTitle = firstSentence.trim();
          }
        }
      }
    }
    
    if (isChapterMarker && currentChapterParagraphs.length > 0) {
      // Save current chapter and start a new one
      chapters.push({
        id: `ch-${chapterNumber}`,
        title: currentChapterTitle,
        paragraphs: currentChapterParagraphs,
      });
      currentChapterParagraphs = [];
      currentChapterTitle = detectedTitle;
      chapterNumber++;
    } else if (isChapterMarker) {
      // First chapter marker found
      currentChapterTitle = detectedTitle;
    } else {
      // Regular paragraph, add to current chapter
      currentChapterParagraphs.push(paragraph);
    }
  }
  
  // Add the last chapter
  if (currentChapterParagraphs.length > 0) {
    chapters.push({
      id: `ch-${chapterNumber}`,
      title: currentChapterTitle,
      paragraphs: currentChapterParagraphs,
    });
  }
  
  // If no chapters were detected, create a single chapter with all content
  if (chapters.length === 0) {
    chapters.push({
      id: 'ch-1',
      title: 'Chapter 1',
      paragraphs: paragraphSentences,
    });
  }
  
  return chapters;
}
