import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Legacy interface for backward compatibility
export interface Text {
  id: string;
  title: string;
  content: string;
  words: string[];
  sentences: string[][];
  createdAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  // Content as paragraphs (list of paragraphs, each paragraph is a list of sentences)
  paragraphs?: string[][];
  // Legacy content field for backward compatibility (will be converted to paragraphs if present)
  content?: string;
  sentenceCount?: number;
}

export interface Volume {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface BookStructure {
  volumes: Volume[];
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  language: 'en' | 'ru';
  structure: BookStructure;
  createdAt: number;
}

export interface Progress {
  bookId: string;
  volumeId: string;
  chapterId: string;
  sentenceIndex: number;
  wordIndex: number;
  lastReadAt: number;
}

export interface Settings {
  initWPM: number;
  maxWPM: number;
  warmupDuration: number; // milliseconds
}

export type Locale = 'en' | 'ru';

interface ReaderDB extends DBSchema {
  texts: {
    key: string;
    value: Text;
    indexes: { 'by-created': number };
  };
  books: {
    key: string;
    value: Book;
    indexes: { 'by-created': number };
  };
  progress: {
    key: string;
    value: Progress;
  };
  settings: {
    key: string;
    value: Settings;
  };
  locale: {
    key: string;
    value: Locale;
  };
}

const DB_NAME = 'fast-focus-reader';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<ReaderDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ReaderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Texts store (legacy, kept for backward compatibility)
        if (!db.objectStoreNames.contains('texts')) {
          const textStore = db.createObjectStore('texts', { keyPath: 'id' });
          textStore.createIndex('by-created', 'createdAt');
        }
        
        // Books store (new)
        if (!db.objectStoreNames.contains('books')) {
          const bookStore = db.createObjectStore('books', { keyPath: 'id' });
          bookStore.createIndex('by-created', 'createdAt');
        }
        
        // Progress store - migrate from textId to bookId
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'bookId' });
        } else if (oldVersion < 2) {
          // Migration: IndexedDB doesn't support renaming keyPath directly,
          // so we'll handle this in the application layer
        }
        
        // Settings store (single entry with key 'default')
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        
        // Locale store (single entry with key 'default')
        if (!db.objectStoreNames.contains('locale')) {
          db.createObjectStore('locale');
        }
      },
    });
  }
  return dbPromise;
}

// Text operations (legacy, kept for backward compatibility)
export async function saveText(text: Text): Promise<void> {
  const db = await getDB();
  await db.put('texts', text);
}

export async function getText(id: string): Promise<Text | undefined> {
  const db = await getDB();
  return db.get('texts', id);
}

export async function getAllTexts(): Promise<Text[]> {
  const db = await getDB();
  return db.getAll('texts');
}

export async function deleteText(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('texts', id);
  // Also delete associated progress (legacy)
  try {
    await db.delete('progress', id);
  } catch {
    // Progress might not exist or use new format
  }
}

// Book operations
export async function saveBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put('books', book);
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await getDB();
  return db.get('books', id);
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  return db.getAll('books');
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('books', id);
  // Also delete associated progress
  await db.delete('progress', id);
}

// Progress operations
export async function saveProgress(progress: Progress): Promise<void> {
  const db = await getDB();
  await db.put('progress', progress);
}

export async function getProgress(bookId: string): Promise<Progress | undefined> {
  const db = await getDB();
  return db.get('progress', bookId);
}

// Settings operations
const SETTINGS_KEY = 'default';

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, SETTINGS_KEY);
}

export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  return db.get('settings', SETTINGS_KEY);
}

export async function getSettingsOrDefault(): Promise<Settings> {
  const settings = await getSettings();
  if (settings) {
    return settings;
  }
  
  // Default settings
  const defaultSettings: Settings = {
    initWPM: 200,
    maxWPM: 400,
    warmupDuration: 60000, // 60 seconds
  };
  
  await saveSettings(defaultSettings);
  return defaultSettings;
}

// Locale operations
const LOCALE_KEY = 'default';

export async function saveLocale(locale: Locale): Promise<void> {
  const db = await getDB();
  await db.put('locale', locale, LOCALE_KEY);
}

export async function getLocale(): Promise<Locale | undefined> {
  const db = await getDB();
  return db.get('locale', LOCALE_KEY);
}
