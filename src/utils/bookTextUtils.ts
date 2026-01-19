import type { Book } from './db';

/**
 * Extracts chapter text from book structure
 * @param book - The book object
 * @param volumeId - ID of the volume containing the chapter
 * @param chapterId - ID of the chapter to extract
 * @returns The chapter text as a single string
 */
export function getChapterText(
  book: Book | null,
  volumeId: string,
  chapterId: string
): string {
  if (!book) return '';

  const volume = book.structure.volumes.find((v) => v.id === volumeId);
  if (!volume) return '';

  const chapter = volume.chapters.find((c) => c.id === chapterId);
  if (!chapter) return '';

  if (chapter.paragraphs && chapter.paragraphs.length > 0) {
    return chapter.paragraphs.map((paragraph) => paragraph.join(' ')).join('\n\n');
  }

  return chapter.content || '';
}
