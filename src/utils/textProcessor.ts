// Vowel sets for different languages
const ENGLISH_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'A', 'E', 'I', 'O', 'U', 'Y']);
const RUSSIAN_VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я']);

// Detect language based on character set
function detectLanguage(text: string): 'en' | 'ru' {
  const russianChars = /[а-яёА-ЯЁ]/.test(text);
  return russianChars ? 'ru' : 'en';
}

// Get vowels for a language
function getVowels(language: 'en' | 'ru'): Set<string> {
  return language === 'ru' ? RUSSIAN_VOWELS : ENGLISH_VOWELS;
}

// Find middle vowel in a word
export function findMiddleVowel(word: string, language?: 'en' | 'ru'): { index: number; vowel: string } | null {
  const lang = language || detectLanguage(word);
  const vowels = getVowels(lang);
  
  // Extract just the word (remove punctuation for vowel detection)
  const cleanWord = word.replace(/[^\p{L}]/gu, '');
  if (cleanWord.length === 0) return null;
  
  const vowelIndices: number[] = [];
  for (let i = 0; i < cleanWord.length; i++) {
    if (vowels.has(cleanWord[i])) {
      vowelIndices.push(i);
    }
  }
  
  if (vowelIndices.length === 0) {
    // No vowels found, use middle character
    const mid = Math.floor(cleanWord.length / 2);
    return { index: mid, vowel: cleanWord[mid] };
  }
  
  // Find middle vowel (prefer left-middle if even)
  const midVowelIndex = Math.floor((vowelIndices.length - 1) / 2);
  const vowelIndex = vowelIndices[midVowelIndex];
  
  return { index: vowelIndex, vowel: cleanWord[vowelIndex] };
}

// Split text into sentences
export function splitIntoSentences(text: string): string[] {
  // Handle English and Russian sentence endings
  const sentenceEndings = /[.!?…]\s+/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = sentenceEndings.exec(text)) !== null) {
    sentences.push(text.slice(lastIndex, match.index + 1).trim());
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) {
      sentences.push(remaining);
    }
  }
  
  return sentences.filter(s => s.length > 0);
}

// Tokenize sentence into words (preserve punctuation)
export function tokenizeWords(sentence: string): string[] {
  // Split by whitespace, preserving the words with their punctuation
  return sentence.split(/\s+/).filter(word => word.length > 0);
}

// Process full text into structured format
export interface ProcessedText {
  sentences: string[][];
  words: string[];
  language: 'en' | 'ru';
}

export function processText(text: string): ProcessedText {
  const language = detectLanguage(text);
  const sentences = splitIntoSentences(text);
  const wordSentences: string[][] = [];
  const allWords: string[] = [];
  
  for (const sentence of sentences) {
    const words = tokenizeWords(sentence);
    wordSentences.push(words);
    allWords.push(...words);
  }
  
  return {
    sentences: wordSentences,
    words: allWords,
    language,
  };
}

// Process chapter content on demand (alias for processText for clarity)
export function processChapterContent(content: string): ProcessedText {
  return processText(content);
}

// Get word parts for vowel-anchored display
export interface WordParts {
  before: string;
  vowel: string;
  after: string;
  vowelIndex: number;
}

export function getWordParts(word: string, language?: 'en' | 'ru'): WordParts {
  const cleanWord = word.replace(/[^\p{L}]/gu, '');
  
  if (cleanWord.length === 0) {
    return { before: '', vowel: word, after: '', vowelIndex: 0 };
  }
  
  const vowelInfo = findMiddleVowel(cleanWord, language);
  
  if (!vowelInfo) {
    return { before: '', vowel: word, after: '', vowelIndex: 0 };
  }
  
  const { index, vowel } = vowelInfo;
  const before = cleanWord.slice(0, index);
  const after = cleanWord.slice(index + 1);
  
  return {
    before,
    vowel,
    after,
    vowelIndex: index,
  };
}
