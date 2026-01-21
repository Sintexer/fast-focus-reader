import ePub from 'epubjs';
import { splitIntoParagraphs, splitIntoSentences } from './textProcessor';
import type { UnpackedFile } from './fileUtils';

/**
 * Parse FB2 (FictionBook) file format
 * FB2 files are XML, so we can use native DOMParser
 * Can accept either a File or unpacked files collection
 */
export async function parseFB2(
  fileOrFiles: File | Map<string, UnpackedFile>
): Promise<{
  title: string;
  author?: string;
  language?: 'en' | 'ru';
  chapters: Array<{ title: string; paragraphs: string[][] }>;
}> {
  let text: string;
  
  if (fileOrFiles instanceof File) {
    text = await fileOrFiles.text();
  } else {
    // Get the FB2 file from unpacked files
    const fb2Files = Array.from(fileOrFiles.values()).filter((f) =>
      f.name.toLowerCase().endsWith('.fb2')
    );
    
    if (fb2Files.length === 0) {
      throw new Error('No FB2 file found in archive');
    }
    if (fb2Files.length > 1) {
      throw new Error('Multiple FB2 files found in archive. Expected exactly one.');
    }
    
    // Convert Uint8Array to text
    const decoder = new TextDecoder('utf-8');
    text = decoder.decode(fb2Files[0].content);
  }
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Extract metadata
  const titleElement = xmlDoc.querySelector('description title-info book-title');
  const title = titleElement?.textContent?.trim() || 'Unknown Title';

  const authorFirst = xmlDoc.querySelector('description title-info author first-name')?.textContent?.trim() || '';
  const authorLast = xmlDoc.querySelector('description title-info author last-name')?.textContent?.trim() || '';
  const author = (authorFirst + ' ' + authorLast).trim() || undefined;

  // Extract language from FB2 metadata
  // FB2 can have either <lang> or <language> tag in title-info
  let language: 'en' | 'ru' | undefined = undefined;
  const langElement = xmlDoc.querySelector('description title-info lang') || 
                      xmlDoc.querySelector('description title-info language');
  if (langElement) {
    const langValue = langElement.textContent?.trim().toLowerCase() || '';
    // Extract primary language code (e.g., "en" from "en-US", "ru" from "ru-RU")
    const primaryLang = langValue.split('-')[0];
    
    if (primaryLang === 'en') {
      language = 'en';
    } else if (primaryLang === 'ru') {
      language = 'ru';
    }
    // If language is not 'en' or 'ru', leave it undefined (will be detected from content)
  }

  // Extract chapters from body sections
  const sections = Array.from(xmlDoc.querySelectorAll('body > section'));
  
  const chapters: Array<{ title: string; paragraphs: string[][] }> = [];

  if (sections.length > 0) {
    // FB2 structure: sections are chapters
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const titleNode = section.querySelector('title');
      const chapterTitle = titleNode?.textContent?.trim() || `Chapter ${i + 1}`;

      // Extract all paragraphs from this section
      const paragraphNodes = Array.from(section.querySelectorAll('p'));
      const paragraphs: string[][] = [];

      for (const pNode of paragraphNodes) {
        const text = pNode.textContent?.trim() || '';
        if (text) {
          // Split paragraph into sentences
          const sentences = splitIntoSentences(text);
          paragraphs.push(sentences);
        }
      }

      // If no paragraphs found, try to extract text from the section directly
      if (paragraphs.length === 0) {
        const sectionText = section.textContent?.trim() || '';
        if (sectionText) {
          const sentences = splitIntoSentences(sectionText);
          if (sentences.length > 0) {
            paragraphs.push(sentences);
          }
        }
      }

      if (paragraphs.length > 0) {
        chapters.push({ title: chapterTitle, paragraphs });
      }
    }
  } else {
    // Fallback: treat entire body as one chapter
    const body = xmlDoc.querySelector('body');
    if (body) {
      const bodyText = body.textContent?.trim() || '';
      if (bodyText) {
        const paragraphs = splitIntoParagraphs(bodyText);
        const paragraphSentences: string[][] = [];
        for (const para of paragraphs) {
          const sentences = splitIntoSentences(para);
          paragraphSentences.push(sentences);
        }
        if (paragraphSentences.length > 0) {
          chapters.push({
            title: 'Chapter 1',
            paragraphs: paragraphSentences,
          });
        }
      }
    }
  }

  return { title, author, language, chapters };
}

/**
 * Keywords that indicate footnotes, endnotes, or other non-content sections
 */
const JUNK_KEYWORDS = [
  'примечания', 'примечание', 'notes', 'note', 'footnote', 'footnotes',
  'endnote', 'endnotes', 'сноска', 'сноски', 'комментарий', 'комментарии',
  'commentary', 'comments', 'annotation', 'annotations', 'appendix', 'приложение'
];

/**
 * Patterns to detect book/volume titles at the start of content
 * Examples: "Книга первая Ватерлоо", "Book 1: Title", "Part I: Title"
 */
const BOOK_VOLUME_PATTERNS = [
  /^(книга\s+(первая|вторая|третья|четвёртая|пятая|первая|вторая|третья|четвертая|пятая|1|2|3|4|5|i|ii|iii|iv|v)\s+[^\n]+)/i,
  /^(book\s+(\d+|i|ii|iii|iv|v|one|two|three|four|five)[:\s]+[^\n]+)/i,
  /^(part\s+(\d+|i|ii|iii|iv|v|one|two|three|four|five)[:\s]+[^\n]+)/i,
  /^(том\s+(\d+|i|ii|iii|iv|v|первый|второй|третий|четвёртый|пятый)[:\s]+[^\n]+)/i,
];

/**
 * Patterns to detect chapter titles
 */
const CHAPTER_PATTERNS = [
  /^(глава\s+(\d+|[ivx]+)[:\s]+[^\n]+)/i,
  /^(chapter\s+(\d+|[ivx]+)[:\s]+[^\n]+)/i,
  /^(ch\.\s*(\d+)[:\s]+[^\n]+)/i,
];

/**
 * Extract hierarchical titles (book/volume and chapter) from content
 * Returns { volumeTitle, chapterTitle, contentStartIndex }
 */
function extractHierarchicalTitles(text: string): {
  volumeTitle: string | null;
  chapterTitle: string | null;
  contentStartIndex: number;
} {
  let volumeTitle: string | null = null;
  let chapterTitle: string | null = null;
  let contentStartIndex = 0;

  // Split into lines to analyze structure
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) {
    return { volumeTitle: null, chapterTitle: null, contentStartIndex: 0 };
  }

  let lineIndex = 0;

  // Check first line for book/volume title
  const firstLine = lines[0];
  for (const pattern of BOOK_VOLUME_PATTERNS) {
    const match = firstLine.match(pattern);
    if (match) {
      volumeTitle = match[1].trim();
      lineIndex = 1;
      break;
    }
  }

  // Check next line (or first if no volume title) for chapter title
  if (lineIndex < lines.length) {
    const chapterLine = lines[lineIndex];
    for (const pattern of CHAPTER_PATTERNS) {
      const match = chapterLine.match(pattern);
      if (match) {
        chapterTitle = match[1].trim();
        lineIndex++;
        break;
      }
    }
  }

  // If we found titles, calculate where actual content starts
  if (volumeTitle || chapterTitle) {
    // Find the position in original text where content starts
    let charCount = 0;
    for (let i = 0; i < lineIndex; i++) {
      charCount += lines[i].length;
      if (i < lineIndex - 1) {
        // Add newline character
        const newlinePos = text.indexOf('\n', charCount);
        if (newlinePos !== -1) {
          charCount = newlinePos + 1;
        }
      }
    }
    contentStartIndex = charCount;
  }

  return { volumeTitle, chapterTitle, contentStartIndex };
}

/**
 * Check if a TOC label indicates junk content (footnotes, etc.)
 */
function isJunkContent(label: string): boolean {
  const lowerLabel = label.toLowerCase().trim();
  return JUNK_KEYWORDS.some(keyword => lowerLabel.includes(keyword));
}

/**
 * Parse EPUB file format using epubjs
 * Uses TOC (Table of Contents) to determine structure hierarchy
 * Filters out footnotes/endnotes using keyword heuristics
 * Extracts metadata from OPF file
 */
export async function parseEPUB(
  fileOrFiles: File | Map<string, UnpackedFile>
): Promise<{
  title: string;
  author?: string;
  language?: 'en' | 'ru';
  volumes: Array<{ title: string; chapters: Array<{ title: string; paragraphs: string[][] }> }>;
}> {
  let book: any;
  
  if (fileOrFiles instanceof File) {
    // Use epubjs to load the EPUB file directly
    // epubjs expects ArrayBuffer or URL, so convert File to ArrayBuffer
    const arrayBuffer = await fileOrFiles.arrayBuffer();
    book = ePub(arrayBuffer);
  } else {
    // For unpacked files, we need to reconstruct the EPUB structure
    // Find the EPUB file in the unpacked collection
    const epubFiles = Array.from(fileOrFiles.values()).filter((f) =>
      f.name.toLowerCase().endsWith('.epub')
    );
    
    if (epubFiles.length === 0) {
      throw new Error('No EPUB file found in archive');
    }
    if (epubFiles.length > 1) {
      throw new Error('Multiple EPUB files found in archive. Expected exactly one.');
    }
    
    // epubjs expects ArrayBuffer, so convert Uint8Array to ArrayBuffer
    // Create a new ArrayBuffer copy to ensure it's a proper ArrayBuffer
    const uint8Array = epubFiles[0].content;
    const arrayBuffer = new ArrayBuffer(uint8Array.length);
    const newView = new Uint8Array(arrayBuffer);
    newView.set(uint8Array);
    book = ePub(arrayBuffer as ArrayBuffer);
  }

  // Wait for book to be ready
  await book.ready;

  // Extract metadata from OPF (not from parsing content)
  const metadata = await book.loaded.metadata;
  const title = metadata.title?.trim() || 'Unknown Title';
  const author = metadata.creator?.trim() || undefined;
  
  // Extract language from metadata
  // EPUB uses dc:language which should be a BCP-47 language tag (e.g., "en", "en-US", "ru", "ru-RU")
  let language: 'en' | 'ru' | undefined = undefined;
  const metadataLanguage = metadata.language;
  if (metadataLanguage) {
    // Handle both string and array (some EPUBs have multiple language tags)
    const langValue = Array.isArray(metadataLanguage) ? metadataLanguage[0] : metadataLanguage;
    const langCode = String(langValue).toLowerCase().trim();
    
    // Extract primary language code (e.g., "en" from "en-US", "ru" from "ru-RU")
    const primaryLang = langCode.split('-')[0];
    
    if (primaryLang === 'en') {
      language = 'en';
    } else if (primaryLang === 'ru') {
      language = 'ru';
    }
    // If language is not 'en' or 'ru', leave it undefined (will be detected from content)
  }

  // Get navigation/TOC structure
  const navigation = await book.loaded.navigation;
  const toc = navigation.toc || [];

  // Build a map of href to spine index for quick lookup
  const hrefToSpineIndex = new Map<string, number>();
  const spine = book.spine;
  for (let i = 0; i < spine.length; i++) {
    const section = spine.get(i);
    if (section && section.href) {
      // Normalize href (remove fragment, resolve relative paths)
      const normalizedHref = section.href.split('#')[0];
      hrefToSpineIndex.set(normalizedHref, i);
      // Also store with full href
      hrefToSpineIndex.set(section.href, i);
    }
  }

  // Recursively process TOC entries to build volume/chapter structure
  type VolumeData = { title: string; chapters: Array<{ title: string; paragraphs: string[][] }> };
  const volumes: VolumeData[] = [];

  /**
   * Process a TOC entry and its children
   * Returns the volume data if this entry represents a volume, or null if it's a chapter or junk
   */
  async function processTOCEntry(entry: any, parentTitle?: string): Promise<VolumeData | null> {
    const label = entry.label?.trim() || '';
    const href = entry.href || '';
    const subitems = entry.subitems || [];

    // Skip junk content (footnotes, endnotes, etc.)
    if (isJunkContent(label)) {
      return null;
    }

    // If this entry has children, it's a volume/section - process children recursively
    if (subitems && subitems.length > 0) {
      // Start a new volume
      const volumeTitle = label || parentTitle || '';
      const newVolume: VolumeData = {
        title: volumeTitle,
        chapters: [],
      };
      
      // Process children and collect their chapters
      // Note: If a child has children, it will return a volume, which we should add as a separate volume
      // For now, we'll merge chapters from child volumes into this volume to maintain flat structure
      for (const subitem of subitems) {
        const result = await processTOCEntry(subitem, label || parentTitle);
        if (result) {
          // If child returned a volume (with chapters), add its chapters to this volume
          if (result.chapters.length > 0) {
            newVolume.chapters.push(...result.chapters);
          }
        }
      }
      
      // Return the volume if it has chapters
      return newVolume.chapters.length > 0 ? newVolume : null;
    }

    // This is a leaf node (chapter) - load and process its content
    if (!href) {
      return null;
    }

    try {
      // Find the spine section for this href
      const normalizedHref = href.split('#')[0];
      const spineIndex = hrefToSpineIndex.get(normalizedHref) ?? hrefToSpineIndex.get(href);
      
      if (spineIndex === undefined) {
        console.warn(`Could not find spine index for href: ${href}`);
        return null;
      }

      const section = spine.get(spineIndex);
      if (!section) {
        return null;
      }

      // Load the section content
      let htmlString: string;
      const sectionContent = await section.load(book.load.bind(book));
      
      if (typeof sectionContent === 'string') {
        htmlString = sectionContent;
      } else if (sectionContent instanceof HTMLElement) {
        htmlString = sectionContent.innerHTML || sectionContent.outerHTML || '';
      } else if (sectionContent instanceof Document) {
        htmlString = sectionContent.body?.innerHTML || sectionContent.documentElement?.outerHTML || '';
      } else {
        const str = String(sectionContent);
        if (str.startsWith('[object')) {
          if ((sectionContent as any).innerHTML) {
            htmlString = (sectionContent as any).innerHTML;
          } else if ((sectionContent as any).outerHTML) {
            htmlString = (sectionContent as any).outerHTML;
          } else {
            console.warn(`Cannot extract HTML from section content: ${str}`);
            return null;
          }
        } else {
          htmlString = str;
        }
      }
      
      // Parse the HTML string into a Document
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(htmlString, 'text/html');
      const text = extractTextFromHTML(htmlDoc);

      if (text && typeof text === 'string' && text.trim()) {
        const paragraphs = splitIntoParagraphs(text);
        const paragraphSentences: string[][] = [];
        for (const para of paragraphs) {
          const paraStr = typeof para === 'string' ? para : String(para);
          const sentences = splitIntoSentences(paraStr);
          const stringSentences = sentences.map(s => typeof s === 'string' ? s : String(s));
          paragraphSentences.push(stringSentences);
        }
        if (paragraphSentences.length > 0) {
          // Use TOC label as chapter title, fallback to HTML title
          const titleElement = htmlDoc.querySelector('h1, h2, h3');
          const titleText = titleElement?.textContent?.trim();
          const chapterTitle = label || 
            (titleText && typeof titleText === 'string' ? titleText : null) ||
            section.href?.split('/').pop()?.replace(/\.(xhtml|html)$/i, '') ||
            `Chapter 1`;
          
          const chapter = {
            title: typeof chapterTitle === 'string' ? chapterTitle : String(chapterTitle),
            paragraphs: paragraphSentences,
          };
          
          // Return chapter data (will be collected by parent volume)
          // We return it as a "volume" with a single chapter for consistency
          return {
            title: '',
            chapters: [chapter],
          };
        }
      }
    } catch (err) {
      console.warn(`Failed to load section for TOC entry "${label}":`, err);
      return null;
    }

    return null;
  }

  // Process all TOC entries and collect volumes
  for (const entry of toc) {
    const result = await processTOCEntry(entry);
    if (result) {
      volumes.push(result);
    }
  }
  
  // If we have volumes with empty titles but chapters, they might be top-level chapters
  // Merge them into a single default volume if needed
  const topLevelChapters = volumes.filter(v => v.title === '' && v.chapters.length > 0);
  if (topLevelChapters.length > 0 && volumes.length > topLevelChapters.length) {
    // We have both volumes and top-level chapters - merge top-level chapters into first volume
    const firstVolume = volumes.find(v => v.title !== '');
    if (firstVolume) {
      firstVolume.chapters.unshift(...topLevelChapters.flatMap(v => v.chapters));
      // Remove the merged volumes
      volumes.splice(0, volumes.length, ...volumes.filter(v => v.title !== '' || v === firstVolume));
    }
  } else if (topLevelChapters.length === volumes.length && volumes.length > 1) {
    // All are top-level chapters - merge into single volume
    const allChapters = volumes.flatMap(v => v.chapters);
    volumes.splice(0, volumes.length, {
      title: '',
      chapters: allChapters,
    });
  }

  // Fallback: If TOC didn't yield any volumes/chapters, process spine directly
  // (This handles EPUBs with missing or incomplete TOC)
  if (volumes.length === 0 || volumes.every(v => v.chapters.length === 0)) {
    console.warn('No volumes/chapters found from TOC, falling back to spine processing');
    
    // Reset volumes for fallback
    volumes.length = 0;
    const fallbackChapters: Array<{ title: string; paragraphs: string[][] }> = [];
    
    // Iterate through spine items
    for (let i = 0; i < spine.length; i++) {
      try {
        const section = spine.get(i);
        if (!section) continue;

        // Load the section content
        let htmlString: string;
        const sectionContent = await section.load(book.load.bind(book));
        
        if (typeof sectionContent === 'string') {
          htmlString = sectionContent;
        } else if (sectionContent instanceof HTMLElement) {
          htmlString = sectionContent.innerHTML || sectionContent.outerHTML || '';
        } else if (sectionContent instanceof Document) {
          htmlString = sectionContent.body?.innerHTML || sectionContent.documentElement?.outerHTML || '';
        } else {
          const str = String(sectionContent);
          if (str.startsWith('[object')) {
            if ((sectionContent as any).innerHTML) {
              htmlString = (sectionContent as any).innerHTML;
            } else if ((sectionContent as any).outerHTML) {
              htmlString = (sectionContent as any).outerHTML;
            } else {
              console.warn(`Cannot extract HTML from section content: ${str}`);
              continue;
            }
          } else {
            htmlString = str;
          }
        }
        
        // Parse the HTML string into a Document
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(htmlString, 'text/html');
        const text = extractTextFromHTML(htmlDoc);

        if (text && typeof text === 'string' && text.trim()) {
          const paragraphs = splitIntoParagraphs(text);
          const paragraphSentences: string[][] = [];
          for (const para of paragraphs) {
            const paraStr = typeof para === 'string' ? para : String(para);
            const sentences = splitIntoSentences(paraStr);
            const stringSentences = sentences.map(s => typeof s === 'string' ? s : String(s));
            paragraphSentences.push(stringSentences);
          }
          if (paragraphSentences.length > 0) {
            // Try to get chapter title from HTML or use section href
            const titleElement = htmlDoc.querySelector('h1, h2, h3');
            const titleText = titleElement?.textContent?.trim();
            const chapterTitle = (titleText && typeof titleText === 'string' ? titleText : null) ||
              section.href?.split('/').pop()?.replace(/\.(xhtml|html)$/i, '') ||
              `Chapter ${fallbackChapters.length + 1}`;
            fallbackChapters.push({
              title: typeof chapterTitle === 'string' ? chapterTitle : String(chapterTitle),
              paragraphs: paragraphSentences,
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to load section ${i}:`, err);
        continue;
      }
    }
    
    // Create a single volume with all fallback chapters
    if (fallbackChapters.length > 0) {
      volumes.push({
        title: '',
        chapters: fallbackChapters,
      });
    }
  }

  // Ensure we have at least one volume
  if (volumes.length === 0) {
    volumes.push({
      title: '',
      chapters: [],
    });
  }

  return { title, author, language, volumes };
}

/**
 * Extract text content from HTML, removing script and style tags
 */
function extractTextFromHTML(htmlDoc: Document): string {
  // Remove script and style elements
  const scripts = htmlDoc.querySelectorAll('script, style');
  scripts.forEach((el) => el.remove());

  // Get text content from body
  const body = htmlDoc.body;
  if (!body) {
    // Fallback: try documentElement
    const docEl = htmlDoc.documentElement;
    if (docEl) {
      const text = docEl.textContent || docEl.innerText || '';
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
    }
    return '';
  }

  // Extract text, preserving some structure
  // Use textContent which returns plain text (no HTML)
  let text = body.textContent || body.innerText || '';
  
  // Ensure we have a string, not an object
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  // Clean up excessive whitespace
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}
