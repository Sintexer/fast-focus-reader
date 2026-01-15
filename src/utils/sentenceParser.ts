// Simple sentence parser that tracks brackets, quotes, and ending punctuation

export interface ParsedWord {
  text: string;                    // The word text (cleaned)
  inBrackets: boolean;             // Are we inside brackets?
  inQuotes: boolean;               // Are we inside quotes?
  endingPunctuation: string;       // Ending punctuation of the sentence (.!?…)
}

export interface ParsedSentence {
  words: ParsedWord[];
  endingPunctuation: string;        // Ending punctuation of the sentence
}

// Simple quote characters
const QUOTE_CHARS = /[""'«»]/;
// Simple bracket characters
const OPEN_BRACKETS = /[\(\[\{]/;
const CLOSE_BRACKETS = /[\)\]\}]/;
// Ending punctuation
const ENDING_PUNCTUATION = /[.!?…]/;

// Parse a sentence into words with context
export function parseSentence(sentence: string): ParsedSentence {
  const words: ParsedWord[] = [];
  
  // Track state as we parse
  let inBrackets = false;
  let inQuotes = false;
  let bracketDepth = 0;
  
  // Find ending punctuation
  let endingPunctuation = '';
  const endingMatch = sentence.trim().match(ENDING_PUNCTUATION);
  if (endingMatch) {
    endingPunctuation = endingMatch[0];
  }
  
  // Split into tokens (words with punctuation)
  const tokens = sentence.trim().split(/\s+/).filter(t => t.length > 0);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isLastToken = i === tokens.length - 1;
    
    // Extract word text (remove punctuation)
    const wordText = token.replace(/[^\p{L}\d]/gu, '');
    if (wordText.length === 0) continue;
    
    // Count opening and closing brackets/quotes in this token
    const openBrackets = (token.match(OPEN_BRACKETS) || []).length;
    const closeBrackets = (token.match(CLOSE_BRACKETS) || []).length;
    const quotes = (token.match(QUOTE_CHARS) || []).length;
    
    // Update bracket state
    bracketDepth += openBrackets - closeBrackets;
    if (bracketDepth < 0) bracketDepth = 0;
    inBrackets = bracketDepth > 0;
    
    // Update quote state (toggle for each quote character)
    // If odd number of quotes, toggle state
    if (quotes % 2 === 1) {
      inQuotes = !inQuotes;
    }
    
    words.push({
      text: wordText,
      inBrackets,
      inQuotes,
      endingPunctuation: isLastToken ? endingPunctuation : '',
    });
  }
  
  return {
    words,
    endingPunctuation,
  };
}
