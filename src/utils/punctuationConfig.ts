// Configuration for punctuation-based reading delays
// Values are multipliers applied to the base reading interval

export const PUNCTUATION_DELAYS: Record<string, number> = {
  comma: 0.3,           // 30% longer pause
  semicolon: 0.5,       // 50% longer pause
  colon: 0.4,           // 40% longer pause
  dash: 0.3,            // 30% longer pause (em dash, en dash)
  ellipsis: 0.5,        // 50% longer pause
  endOfSentence: 0.4,   // 40% longer pause for end-of-sentence punctuation
  // Paragraph end handled separately (full pause - requires manual advance)
};

// Pause delay between paragraphs (multiplier)
export const PARAGRAPH_PAUSE_DELAY = 0.5; // 50% longer pause between paragraphs

// Threshold for detecting long words that should pause reading
export const LONG_WORD_THRESHOLD = 15;

// Common abbreviations that should be kept together
export const COMMON_ABBREVIATIONS = new Set([
  'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Sr.', 'Jr.',
  'Inc.', 'Ltd.', 'Corp.', 'Co.', 'vs.', 'etc.', 'i.e.', 'e.g.',
  'a.m.', 'p.m.', 'A.M.', 'P.M.',
]);

// Patterns for detecting special cases
export const DECIMAL_PATTERN = /^\d+\.\d+$/;
export const INITIAL_PATTERN = /^[A-Z]\.$/;
export const ELLIPSIS_PATTERN = /^\.{2,}$/;
