import JSZip from 'jszip';
import type { Book, Chapter, Volume } from './db';
import { splitIntoParagraphs, splitIntoSentences } from './textProcessor';

/**
 * Parse FB2 (FictionBook) file format
 * FB2 files are XML, so we can use native DOMParser
 */
export async function parseFB2(file: File): Promise<{
  title: string;
  author?: string;
  chapters: Array<{ title: string; paragraphs: string[][] }>;
}> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Extract metadata
  const titleElement = xmlDoc.querySelector('description title-info book-title');
  const title = titleElement?.textContent?.trim() || 'Unknown Title';

  const authorFirst = xmlDoc.querySelector('description title-info author first-name')?.textContent?.trim() || '';
  const authorLast = xmlDoc.querySelector('description title-info author last-name')?.textContent?.trim() || '';
  const author = (authorFirst + ' ' + authorLast).trim() || undefined;

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

  return { title, author, chapters };
}

/**
 * Parse EPUB file format
 * EPUB files are ZIP archives containing HTML files
 */
export async function parseEPUB(file: File): Promise<{
  title: string;
  author?: string;
  chapters: Array<{ title: string; paragraphs: string[][] }>;
}> {
  const zip = await JSZip.loadAsync(file);

  // 1. Find the OPF file (metadata and manifest)
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: container.xml not found');
  }

  const containerText = await containerFile.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerText, 'text/xml');
  const rootfile = containerDoc.querySelector('rootfile');
  if (!rootfile) {
    throw new Error('Invalid EPUB: rootfile not found');
  }

  const opfPath = rootfile.getAttribute('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB: OPF path not found');
  }

  // 2. Parse OPF to get book structure
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
  }

  const opfData = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfData, 'text/xml');

  // Extract metadata
  const titleElement = opfDoc.querySelector('metadata title');
  const title = titleElement?.textContent?.trim() || 'Unknown Title';

  const authorElement = opfDoc.querySelector('metadata creator');
  const author = authorElement?.textContent?.trim() || undefined;

  // 3. Get the Spine (reading order)
  const spineRefs: string[] = [];
  const spineItems = opfDoc.querySelectorAll('spine itemref');
  for (const item of spineItems) {
    const idref = item.getAttribute('idref');
    if (idref) {
      spineRefs.push(idref);
    }
  }

  // 4. Map IDs to file paths from manifest
  const manifest: Record<string, string> = {};
  const manifestItems = opfDoc.querySelectorAll('manifest item');
  for (const item of manifestItems) {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) {
      manifest[id] = href;
    }
  }

  // 5. Resolve relative paths
  const opfFolder = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

  // 6. Extract text from each chapter
  const chapters: Array<{ title: string; paragraphs: string[][] }> = [];

  for (let i = 0; i < spineRefs.length; i++) {
    const id = spineRefs[i];
    const fileName = manifest[id];
    if (!fileName) continue;

    // Resolve relative path
    let fullPath = opfFolder + fileName;
    // Normalize path (handle ../)
    fullPath = fullPath.replace(/[^/]*\/\.\.\//g, '');

    const htmlFile = zip.file(fullPath);
    if (!htmlFile) {
      // Try without the folder prefix
      const altPath = fileName.replace(/^\.\.\//, '');
      const altFile = zip.file(altPath) || zip.file(fileName);
      if (!altFile) continue;

      const htmlContent = await altFile.async('text');
      const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
      const text = extractTextFromHTML(htmlDoc);
      if (text.trim()) {
        const paragraphs = splitIntoParagraphs(text);
        const paragraphSentences: string[][] = [];
        for (const para of paragraphs) {
          const sentences = splitIntoSentences(para);
          paragraphSentences.push(sentences);
        }
        if (paragraphSentences.length > 0) {
          const chapterTitle = htmlDoc.querySelector('h1, h2, h3')?.textContent?.trim() || `Chapter ${i + 1}`;
          chapters.push({
            title: chapterTitle,
            paragraphs: paragraphSentences,
          });
        }
      }
      continue;
    }

    const htmlContent = await htmlFile.async('text');
    const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
    const text = extractTextFromHTML(htmlDoc);

    if (text.trim()) {
      const paragraphs = splitIntoParagraphs(text);
      const paragraphSentences: string[][] = [];
      for (const para of paragraphs) {
        const sentences = splitIntoSentences(para);
        paragraphSentences.push(sentences);
      }
      if (paragraphSentences.length > 0) {
        const chapterTitle = htmlDoc.querySelector('h1, h2, h3')?.textContent?.trim() || `Chapter ${i + 1}`;
        chapters.push({
          title: chapterTitle,
          paragraphs: paragraphSentences,
        });
      }
    }
  }

  // If no chapters found, create one from all content
  if (chapters.length === 0) {
    let allText = '';
    for (const id of spineRefs) {
      const fileName = manifest[id];
      if (!fileName) continue;
      const fullPath = opfFolder + fileName;
      const htmlFile = zip.file(fullPath);
      if (htmlFile) {
        const htmlContent = await htmlFile.async('text');
        const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
        allText += extractTextFromHTML(htmlDoc) + '\n\n';
      }
    }
    if (allText.trim()) {
      const paragraphs = splitIntoParagraphs(allText);
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

  return { title, author, chapters };
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
  if (!body) return '';

  // Extract text, preserving some structure
  const text = body.textContent || body.innerText || '';
  
  // Clean up excessive whitespace
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}
