import { splitIntoParagraphs, splitIntoSentences, detectLanguage } from './textProcessor';
import type { Book, Chapter, Volume } from './db';
import { parseFB2, parseEPUB } from './bookParsers';
import { isZipFile, unzipFile } from './fileUtils';

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
 * Parse a file (TXT, EPUB, FB2, or ZIP) into Book structure
 * If the file is a ZIP, it will be unpacked and the appropriate parser will be used
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
  let parsedData: { 
    title: string; 
    author?: string;
    language?: 'en' | 'ru';
    chapters?: Array<{ title: string; paragraphs: string[][] }>;
    volumes?: Array<{ title: string; chapters: Array<{ title: string; paragraphs: string[][] }> }>;
  };

  // Check file extension first - if it's a known format, parse directly
  // EPUB files are technically ZIP archives, but we should parse them as EPUB, not unpack them
  if (fileName.endsWith('.epub')) {
    // Parse EPUB directly (even though it's technically a ZIP)
    parsedData = await parseEPUB(file);
  } else if (fileName.endsWith('.fb2')) {
    parsedData = await parseFB2(file);
  } else if (fileName.endsWith('.txt')) {
    // For TXT files, read as text and use existing parser
    const text = await file.text();
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
  } else if (fileName.endsWith('.zip')) {
    // Only unpack if it's explicitly a .zip file
    const unpackedFiles = await unzipFile(file);
    
    // Check for EPUB files
    const epubFiles = Array.from(unpackedFiles.values()).filter((f) =>
      f.name.toLowerCase().endsWith('.epub')
    );
    
    // Check for FB2 files
    const fb2Files = Array.from(unpackedFiles.values()).filter((f) =>
      f.name.toLowerCase().endsWith('.fb2')
    );
    
    // Check for TXT files
    const txtFiles = Array.from(unpackedFiles.values()).filter((f) =>
      f.name.toLowerCase().endsWith('.txt')
    );
    
    // Determine which parser to use based on file types found
    if (epubFiles.length > 0) {
      if (epubFiles.length > 1) {
        throw new Error('Multiple EPUB files found in ZIP archive. Expected exactly one.');
      }
      // Create a File-like object from the unpacked EPUB
      // Convert Uint8Array to ArrayBuffer to ensure proper type
      const uint8Array = epubFiles[0].content;
      const arrayBuffer = new ArrayBuffer(uint8Array.length);
      const newView = new Uint8Array(arrayBuffer);
      newView.set(uint8Array);
      const epubBlob = new Blob([arrayBuffer], { type: 'application/epub+zip' });
      const epubFile = new File([epubBlob], epubFiles[0].name, { type: 'application/epub+zip' });
      parsedData = await parseEPUB(epubFile);
    } else if (fb2Files.length > 0) {
      if (fb2Files.length > 1) {
        throw new Error('Multiple FB2 files found in ZIP archive. Expected exactly one.');
      }
      parsedData = await parseFB2(unpackedFiles);
    } else if (txtFiles.length > 0) {
      if (txtFiles.length > 1) {
        throw new Error('Multiple TXT files found in ZIP archive. Expected exactly one.');
      }
      // For TXT files, read as text and use existing parser
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(txtFiles[0].content);
      const paragraphs = splitIntoParagraphs(text);
      const paragraphSentences: string[][] = [];
      
      for (const paragraph of paragraphs) {
        const sentences = splitIntoSentences(paragraph);
        paragraphSentences.push(sentences);
      }
      
      const chapters = detectChapters(paragraphSentences);
      parsedData = {
        title: options.title || txtFiles[0].name.replace(/\.txt$/i, ''),
        author: options.author,
        chapters: chapters.map(ch => ({ title: ch.title, paragraphs: ch.paragraphs || [] })),
      };
    } else {
      throw new Error('No supported file format found in ZIP archive. Supported: .txt, .epub, .fb2');
    }
  } else {
    // Unknown extension - check if it's a ZIP by magic bytes
    const isZip = await isZipFile(file);
    if (isZip) {
      throw new Error(`File appears to be a ZIP archive but doesn't have .zip extension. Please rename it to .zip or use a supported format (.txt, .epub, .fb2)`);
    } else {
      throw new Error(`Unsupported file format. Supported: .txt, .epub, .fb2, .zip`);
    }
  }

  // Convert to Book structure
  // Check if parsedData has volumes (EPUB) or chapters (FB2, TXT)
  let volumes: Volume[];
  
  if ('volumes' in parsedData && Array.isArray(parsedData.volumes)) {
    // EPUB format with volumes
    volumes = parsedData.volumes.map((vol, volIndex) => ({
      id: `vol-${volIndex + 1}`,
      title: vol.title || '',
      chapters: vol.chapters.map((ch, chIndex) => ({
        id: `ch-${volIndex + 1}-${chIndex + 1}`,
        title: ch.title,
        paragraphs: ch.paragraphs || [],
      })),
    }));
  } else if ('chapters' in parsedData && Array.isArray(parsedData.chapters)) {
    // FB2 or TXT format with flat chapters
    const chapters: Chapter[] = parsedData.chapters.map((ch, index) => ({
      id: `ch-${index + 1}`,
      title: ch.title,
      paragraphs: ch.paragraphs || [],
    }));

    volumes = [{
      id: 'vol-1',
      title: '',
      chapters,
    }];
  } else {
    throw new Error('Invalid parsed data structure');
  }

  // Determine language: use parsed language if available, otherwise use options, otherwise detect from content
  const language = parsedData.language || 
    options.language || 
    detectLanguage(
      volumes.flatMap(vol => vol.chapters.flatMap(ch => (ch.paragraphs || []).flat())).join(' ')
    );

  const bookId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const book: Book = {
    id: bookId,
    title: options.title || parsedData.title || 'Untitled Book',
    author: options.author || parsedData.author,
    language,
    structure: {
      volumes,
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
