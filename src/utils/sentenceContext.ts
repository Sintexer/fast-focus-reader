import type { EnrichedWord } from './textProcessor';

export interface ContextFlags {
  inDialog: boolean;
  inBrackets: boolean;
  dialogDepth: number;
  bracketDepth: number;
}

/**
 * Tracks reading context (dialogs, brackets) across sentences within a chapter.
 * Context persists across sentences to handle multi-sentence dialogs and brackets.
 */
export class SentenceContextTracker {
  private inDialog: boolean = false;
  private inBrackets: boolean = false;
  private dialogDepth: number = 0;
  private bracketDepth: number = 0;

  /**
   * Update context based on a sentence's enriched words.
   * This should be called for each sentence in order.
   */
  updateContext(sentence: EnrichedWord[]): void {
    for (const word of sentence) {
      // Track dialog state
      if (word.context.dialogStart) {
        this.dialogDepth++;
        this.inDialog = true;
      }
      
      if (word.context.dialogEnd) {
        this.dialogDepth = Math.max(0, this.dialogDepth - 1);
        if (this.dialogDepth === 0) {
          this.inDialog = false;
        }
      }
      
      // If word is in dialog but not explicitly marked as start/end,
      // ensure we're tracking it
      if (word.context.inDialog && !this.inDialog) {
        this.inDialog = true;
        this.dialogDepth = Math.max(1, this.dialogDepth);
      }
      
      // Track bracket state
      if (word.context.bracketStart) {
        this.bracketDepth++;
        this.inBrackets = true;
      }
      
      if (word.context.bracketEnd) {
        this.bracketDepth = Math.max(0, this.bracketDepth - 1);
        if (this.bracketDepth === 0) {
          this.inBrackets = false;
        }
      }
      
      // If word is in brackets but not explicitly marked as start/end,
      // ensure we're tracking it
      if (word.context.inBrackets && !this.inBrackets) {
        this.inBrackets = true;
        this.bracketDepth = Math.max(1, this.bracketDepth);
      }
    }
    
    // Apply context to words that don't have explicit markers
    // (for words in the middle of a dialog/bracket span)
    for (const word of sentence) {
      if (!word.context.dialogStart && !word.context.dialogEnd) {
        word.context.inDialog = this.inDialog;
      }
      if (!word.context.bracketStart && !word.context.bracketEnd) {
        word.context.inBrackets = this.inBrackets;
      }
    }
  }

  /**
   * Get current context flags
   */
  getContextFlags(): ContextFlags {
    return {
      inDialog: this.inDialog,
      inBrackets: this.inBrackets,
      dialogDepth: this.dialogDepth,
      bracketDepth: this.bracketDepth,
    };
  }

  /**
   * Check if currently in a dialog
   */
  isInDialog(): boolean {
    return this.inDialog;
  }

  /**
   * Check if currently in brackets
   */
  isInBrackets(): boolean {
    return this.inBrackets;
  }

  /**
   * Reset context (e.g., when starting a new chapter)
   */
  reset(): void {
    this.inDialog = false;
    this.inBrackets = false;
    this.dialogDepth = 0;
    this.bracketDepth = 0;
  }
}
