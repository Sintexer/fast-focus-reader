import { 
  LONG_WORD_THRESHOLD, 
  COMMON_ABBREVIATIONS,
  DECIMAL_PATTERN,
  INITIAL_PATTERN,
  ELLIPSIS_PATTERN
} from './punctuationConfig';

// Vowel sets for different languages
const ENGLISH_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'A', 'E', 'I', 'O', 'U', 'Y']);
const RUSSIAN_VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я']);

// Enhanced word data structure with punctuation and context
export interface EnrichedWord {
  text: string;              // The word text (without punctuation)
  punctuation: {
    before: string;          // Punctuation before word (opening quotes, brackets)
    after: string;           // Punctuation after word (commas, semicolons, closing brackets)
    endOfSentence: string;   // End-of-sentence punctuation (.!?…)
  };
  context: {
    inDialog: boolean;       // Inside quotes/dialog
    inBrackets: boolean;      // Inside brackets/parentheses
    dialogStart: boolean;    // Word starts a dialog
    dialogEnd: boolean;      // Word ends a dialog
    bracketStart: boolean;   // Word starts brackets
    bracketEnd: boolean;     // Word ends brackets
    isParagraphEnd: boolean; // True if this word ends a paragraph
  };
  pauseType: 'none' | 'small' | 'full';  // Reading pause type
  specialCase?: 'abbreviation' | 'initial' | 'decimal' | 'long-word' | 'ellipsis';
  displayAs: string;         // How to display (for special cases like "J. Smith" as one unit)
  originalText: string;      // Original token text for reference
  paragraphIndex: number;    // Index of paragraph this word belongs to
  sentenceIndex: number;     // Index of sentence within paragraph
}

export type SpecialCase = 'abbreviation' | 'initial' | 'decimal' | 'long-word' | 'ellipsis';

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

// Helper to check if a period is part of a decimal number
function isDecimalPeriod(text: string, index: number): boolean {
  // Look for pattern: digit(s) + period + digit(s)
  const before = text.slice(Math.max(0, index - 5), index);
  const after = text.slice(index + 1, index + 6);
  const combined = (before + '.' + after).match(/\d+\.\d+/);
  if (combined) {
    const matchIndex = before.length;
    const matchStart = index - matchIndex;
    const matchEnd = index + 1 + (combined[0].length - matchIndex - 1);
    // Check if the period is within this decimal match
    if (matchStart <= index && index < matchEnd) {
      return true;
    }
  }
  return false;
}

// Helper to check if a period is part of an abbreviation
function isAbbreviationPeriod(text: string, index: number): boolean {
  // Get the word before the period
  const beforeText = text.slice(Math.max(0, index - 10), index);
  const words = beforeText.trim().split(/\s+/);
  const lastWord = words[words.length - 1] || '';
  const wordWithPeriod = lastWord + '.';
  
  // Check if it's a known abbreviation
  if (COMMON_ABBREVIATIONS.has(wordWithPeriod)) {
    return true;
  }
  
  // Check if it's a single letter initial (e.g., "J.")
  if (/^[A-ZА-ЯЁ]\.$/.test(wordWithPeriod)) {
    return true;
  }
  
  return false;
}

// Split text into sentences
export function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  let currentSentence = '';
  let i = 0;
  
  while (i < text.length) {
    const char = text[i];
    currentSentence += char;
    
    // Check for sentence-ending punctuation
    if (/[.!?…]/.test(char)) {
      const nextChar = text[i + 1];
      
      // Skip if it's a decimal number
      if (char === '.' && isDecimalPeriod(text, i)) {
        i++;
        continue;
      }
      
      // Skip if it's an abbreviation (unless clearly at sentence end)
      if (char === '.' && isAbbreviationPeriod(text, i)) {
        // An abbreviation period is a sentence end ONLY if:
        // 1. End of text, OR
        // 2. Followed by newline(s) and capital letter (new paragraph/sentence)
        // We DON'T split on "Mr. Smith" because that's the same sentence
        const afterWhitespace = text.slice(i + 1).trim();
        const firstChar = afterWhitespace.charAt(0);
        const isEndOfSentence = 
          i === text.length - 1 || // End of text
          (/\n/.test(nextChar) && /[A-ZА-ЯЁ]/.test(firstChar)); // Newline + capital = new sentence
        
        if (!isEndOfSentence) {
          i++;
          continue;
        }
      }
      
      // This is a sentence end if:
      // 1. End of text
      // 2. Followed by whitespace and capital letter (possibly after quote)
      // 3. Followed by newline(s) and capital letter
      // 4. Ellipsis (…) followed by space (always sentence end)
      const afterWhitespace = text.slice(i + 1).trim();
      const firstChar = afterWhitespace.charAt(0);
      const secondChar = afterWhitespace.charAt(1);
      
      const isSentenceEnd = 
        i === text.length - 1 ||
        // Ellipsis followed by space is always a sentence end
        (char === '…' && /\s/.test(nextChar)) ||
        (/\s/.test(nextChar) && (
          /[A-ZА-ЯЁ]/.test(firstChar) || 
          (firstChar === '"' && /[A-ZА-ЯЁ]/.test(secondChar))
        )) ||
        (/\n/.test(nextChar) && (
          /[A-ZА-ЯЁ]/.test(firstChar) || 
          (firstChar === '"' && /[A-ZА-ЯЁ]/.test(secondChar))
        ));
      
      if (!isSentenceEnd) {
        i++;
        continue;
      }
      
      if (isSentenceEnd) {
        // Add current sentence
        const trimmed = currentSentence.trim();
        if (trimmed) {
          sentences.push(trimmed);
        }
        currentSentence = '';
        
        // Skip whitespace after sentence end
        while (i + 1 < text.length && /\s/.test(text[i + 1])) {
          i++;
        }
      }
    }
    
    i++;
  }
  
  // Add remaining text as last sentence
  const remaining = currentSentence.trim();
  if (remaining) {
    sentences.push(remaining);
  }
  
  return sentences.filter(s => s.length > 0);
}

// Tokenize sentence into words (preserve punctuation)
export function tokenizeWords(sentence: string): string[] {
  // Split by whitespace, preserving the words with their punctuation
  return sentence.split(/\s+/).filter(word => word.length > 0);
}

// Split text into paragraphs (separated by blank lines)
export function splitIntoParagraphs(text: string): string[] {
  // Split by double newlines or single newline followed by whitespace and newline
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  // If no double newlines, try splitting by single newlines at paragraph boundaries
  // (line starting with capital letter after a sentence end)
  if (paragraphs.length === 1) {
    const lines = text.split(/\n/);
    const result: string[] = [];
    let currentParagraph = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) {
        if (currentParagraph.trim().length > 0) {
          result.push(currentParagraph.trim());
          currentParagraph = '';
        }
        continue;
      }
      
      // If line starts with capital and previous line ended with sentence punctuation, new paragraph
      if (currentParagraph.length > 0 && /[A-ZА-ЯЁ]/.test(line.charAt(0))) {
        const lastChar = currentParagraph.trim().slice(-1);
        if (/[.!?…]/.test(lastChar)) {
          result.push(currentParagraph.trim());
          currentParagraph = line;
          continue;
        }
      }
      
      currentParagraph += (currentParagraph.length > 0 ? ' ' : '') + line;
    }
    
    if (currentParagraph.trim().length > 0) {
      result.push(currentParagraph.trim());
    }
    
    return result.length > 0 ? result : paragraphs;
  }
  
  return paragraphs;
}

// Process full text into structured format
export interface ProcessedText {
  paragraphs: string[][][]; // paragraphs[sentences[words]]
  sentences: string[][];
  words: string[];
  language: 'en' | 'ru';
}

// Enhanced processed text with enriched words
export interface EnrichedProcessedText {
  paragraphs: EnrichedWord[][][]; // paragraphs[sentences[words]]
  sentences: EnrichedWord[][];
  words: EnrichedWord[];
  language: 'en' | 'ru';
}

export function processText(text: string): ProcessedText {
  const language = detectLanguage(text);
  const paragraphs = splitIntoParagraphs(text);
  const paragraphSentences: string[][][] = [];
  const wordSentences: string[][] = [];
  const allWords: string[] = [];
  
  for (const paragraph of paragraphs) {
    const sentences = splitIntoSentences(paragraph);
    const paragraphWordSentences: string[][] = [];
    
    for (const sentence of sentences) {
      const words = tokenizeWords(sentence);
      paragraphWordSentences.push(words);
      wordSentences.push(words);
      allWords.push(...words);
    }
    
    paragraphSentences.push(paragraphWordSentences);
  }
  
  return {
    paragraphs: paragraphSentences,
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

// Punctuation patterns
const OPENING_QUOTES = /^[""'«»]/;
const CLOSING_QUOTES = /[""'«»]$/;
const OPENING_BRACKETS = /^[\(\[\{]/;
const CLOSING_BRACKETS = /[\)\]\}]$/;
const END_OF_SENTENCE = /[.!?…]+$/;
const IN_SENTENCE_PUNCTUATION = /[,;:—–]$/; // comma, semicolon, colon, em dash, en dash

// Identify special cases for a word
function identifySpecialCase(word: string): SpecialCase | undefined {
  const cleanWord = word.replace(/[^\p{L}\d.]/gu, '');
  
  // Check for decimal numbers
  if (DECIMAL_PATTERN.test(cleanWord)) {
    return 'decimal';
  }
  
  // Check for ellipsis
  if (ELLIPSIS_PATTERN.test(word)) {
    return 'ellipsis';
  }
  
  // Check for abbreviations
  if (COMMON_ABBREVIATIONS.has(word)) {
    return 'abbreviation';
  }
  
  // Check for initials (single letter followed by period)
  if (INITIAL_PATTERN.test(cleanWord)) {
    return 'initial';
  }
  
  // Check for long words
  if (cleanWord.length >= LONG_WORD_THRESHOLD) {
    return 'long-word';
  }
  
  return undefined;
}

// Separate punctuation from word text
function separatePunctuation(token: string): {
  before: string;
  text: string;
  after: string;
  endOfSentence: string;
} {
  let before = '';
  let text = token;
  let after = '';
  let endOfSentence = '';
  
  // Extract end-of-sentence punctuation
  const eosMatch = text.match(END_OF_SENTENCE);
  if (eosMatch) {
    endOfSentence = eosMatch[0];
    text = text.slice(0, -endOfSentence.length);
  }
  
  // Extract opening quotes and brackets
  while (OPENING_QUOTES.test(text) || OPENING_BRACKETS.test(text)) {
    const match = text.match(/^[""'«»\(\[\{]/);
    if (match) {
      before += match[0];
      text = text.slice(match[0].length);
    } else {
      break;
    }
  }
  
  // Extract closing quotes, brackets, and in-sentence punctuation
  while (CLOSING_QUOTES.test(text) || CLOSING_BRACKETS.test(text) || IN_SENTENCE_PUNCTUATION.test(text)) {
    const match = text.match(/[""'«»\)\]\},;:—–]+$/);
    if (match) {
      after = match[0] + after;
      text = text.slice(0, -match[0].length);
    } else {
      break;
    }
  }
  
  return { before, text, after, endOfSentence };
}

// Determine pause type based on punctuation
// Full pause at paragraph end and end-of-sentence punctuation, small pause for in-sentence punctuation
function determinePauseType(
  after: string,
  endOfSentence: string,
  isParagraphEnd: boolean,
  specialCase?: SpecialCase
): 'none' | 'small' | 'full' {
  // Full pause at paragraph end
  if (isParagraphEnd) {
    return 'full';
  }
  
  // Full pause for end-of-sentence punctuation (reading stops, requires manual advance)
  if (endOfSentence) {
    return 'full';
  }
  
  // Small pause for in-sentence punctuation
  if (after.match(/[,;:—–]/)) {
    return 'small';
  }
  
  // Small pause for long words
  if (specialCase === 'long-word') {
    return 'small';
  }
  
  return 'none';
}

// Validate quote pairs in a sentence
function validateQuotes(words: EnrichedWord[]): boolean {
  let quoteCount = 0;
  let inQuotes = false;
  
  for (const word of words) {
    if (word.punctuation.before.match(/[""'«»]/)) {
      quoteCount++;
      inQuotes = !inQuotes;
    }
    if (word.punctuation.after.match(/[""'«»]/)) {
      quoteCount++;
      inQuotes = !inQuotes;
    }
  }
  
  // If odd number of quotes, might be a typo, but we'll still handle it
  // Return true if quotes are balanced or if it's a single unmatched quote (might be intentional)
  return quoteCount % 2 === 0 || quoteCount === 1;
}

// Detect and set dialog state for words
function detectDialogState(words: EnrichedWord[]): void {
  let inDialog = false;
  
  for (const word of words) {
    // Check if this word starts a dialog
    if (word.punctuation.before.match(/[""'«»]/) && !inDialog) {
      inDialog = true;
      word.context.dialogStart = true;
    }
    
    word.context.inDialog = inDialog;
    
    // Check if this word ends a dialog
    if (word.punctuation.after.match(/[""'«»]/) && inDialog) {
      inDialog = false;
      word.context.dialogEnd = true;
    }
  }
}

// Detect and set bracket state for words
function detectBracketState(words: EnrichedWord[]): void {
  let inBrackets = false;
  let bracketDepth = 0;
  
  for (const word of words) {
    // Count opening brackets
    const openingBrackets = (word.punctuation.before.match(/[\(\[\{]/g) || []).length;
    const closingBrackets = (word.punctuation.after.match(/[\)\]\}]/g) || []).length;
    
    bracketDepth += openingBrackets - closingBrackets;
    
    if (openingBrackets > 0 && bracketDepth === openingBrackets) {
      word.context.bracketStart = true;
      inBrackets = true;
    }
    
    word.context.inBrackets = inBrackets || bracketDepth > 0;
    
    if (closingBrackets > 0 && bracketDepth === 0) {
      word.context.bracketEnd = true;
      inBrackets = false;
    }
  }
}

// Group consecutive initials together
function groupInitials(tokens: string[]): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const cleanToken = token.replace(/[^\p{L}\d.]/gu, '');
    
    if (INITIAL_PATTERN.test(cleanToken)) {
      currentGroup.push(token);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      groups.push([token]);
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}

// Enrich words in a sentence with punctuation and context
export function enrichWords(
  sentence: string,
  paragraphIndex: number = 0,
  sentenceIndex: number = 0,
  isParagraphEnd: boolean = false
): EnrichedWord[] {
  const tokens = tokenizeWords(sentence);
  const groupedTokens = groupInitials(tokens);
  const enrichedWords: EnrichedWord[] = [];
  
  for (let groupIndex = 0; groupIndex < groupedTokens.length; groupIndex++) {
    const tokenGroup = groupedTokens[groupIndex];
    const isLastGroup = groupIndex === groupedTokens.length - 1;
    
    // If it's a group of initials, combine them
    if (tokenGroup.length > 1 && tokenGroup.every(t => INITIAL_PATTERN.test(t.replace(/[^\p{L}\d.]/gu, '')))) {
      const combined = tokenGroup.join(' ');
      const { before, text, after, endOfSentence } = separatePunctuation(combined);
      const specialCase = identifySpecialCase(combined);
      const wordIsParagraphEnd = isParagraphEnd && isLastGroup;
      
      enrichedWords.push({
        text: text || combined,
        punctuation: { before, after, endOfSentence },
        context: {
          inDialog: false,
          inBrackets: false,
          dialogStart: false,
          dialogEnd: false,
          bracketStart: false,
          bracketEnd: false,
          isParagraphEnd: wordIsParagraphEnd,
        },
        pauseType: determinePauseType(after, endOfSentence, wordIsParagraphEnd, specialCase),
        specialCase: specialCase,
        displayAs: combined,
        originalText: combined,
        paragraphIndex,
        sentenceIndex,
      });
    } else {
      // Process each token normally
      for (let i = 0; i < tokenGroup.length; i++) {
        const token = tokenGroup[i];
        const { before, text, after, endOfSentence } = separatePunctuation(token);
        const specialCase = identifySpecialCase(token);
        const isLastToken = i === tokenGroup.length - 1 && isLastGroup;
        const wordIsParagraphEnd = isParagraphEnd && isLastToken;
        
        enrichedWords.push({
          text: text || token,
          punctuation: { before, after, endOfSentence },
          context: {
            inDialog: false,
            inBrackets: false,
            dialogStart: false,
            dialogEnd: false,
            bracketStart: false,
            bracketEnd: false,
            isParagraphEnd: wordIsParagraphEnd,
          },
          pauseType: determinePauseType(after, endOfSentence, wordIsParagraphEnd, specialCase),
          specialCase: specialCase,
          displayAs: token,
          originalText: token,
          paragraphIndex,
          sentenceIndex,
        });
      }
    }
  }
  
  // Detect dialog and bracket states
  detectDialogState(enrichedWords);
  detectBracketState(enrichedWords);
  
  // Validate quotes (for debugging/logging, but don't block processing)
  validateQuotes(enrichedWords);
  
  return enrichedWords;
}

// Process text with enriched words
export function processTextEnriched(text: string): EnrichedProcessedText {
  const language = detectLanguage(text);
  const paragraphs = splitIntoParagraphs(text);
  const paragraphSentences: EnrichedWord[][][] = [];
  const enrichedSentences: EnrichedWord[][] = [];
  const allEnrichedWords: EnrichedWord[] = [];
  
  for (let paraIndex = 0; paraIndex < paragraphs.length; paraIndex++) {
    const paragraph = paragraphs[paraIndex];
    const sentences = splitIntoSentences(paragraph);
    const paragraphEnrichedSentences: EnrichedWord[][] = [];
    
    for (let sentIndex = 0; sentIndex < sentences.length; sentIndex++) {
      const sentence = sentences[sentIndex];
      const isLastSentence = sentIndex === sentences.length - 1;
      // Paragraph ends at the last sentence of the paragraph
      const isParagraphEnd = isLastSentence;
      
      const enrichedWords = enrichWords(sentence, paraIndex, sentIndex, isParagraphEnd);
      paragraphEnrichedSentences.push(enrichedWords);
      enrichedSentences.push(enrichedWords);
      allEnrichedWords.push(...enrichedWords);
    }
    
    paragraphSentences.push(paragraphEnrichedSentences);
  }
  
  return {
    paragraphs: paragraphSentences,
    sentences: enrichedSentences,
    words: allEnrichedWords,
    language,
  };
}
