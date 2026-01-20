import type { ProcessedWord } from '../../services/types';

/**
 * Playback controls interface for reader components
 */
export interface PlaybackControls {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  nextWord: () => void;
  prevWord: () => void;
  nextSentence: () => void;
  prevSentence: () => void;
  reset: () => void;
  restartSentence: () => void;
  advanceToNextSentence: () => void;
  isStoppedAtSentenceEnd: boolean;
  currentSentenceIndex: number;
  maxSentenceIndex: number;
  wpm: number;
}

/**
 * Props for components that display chapter text with highlighting
 */
export interface ChapterTextViewProps {
  chapterText: string;
  currentWord: ProcessedWord | null;
  currentSentence: ProcessedWord[] | null;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Props for components that display the current word
 */
export interface CurrentWordDisplayProps {
  word: string;
}

/**
 * Props for components that display playback state information
 */
export interface PlaybackStateInfoProps {
  currentSentenceIndex: number;
  maxSentenceIndex: number;
  wpm: number;
  showChapterView?: boolean;
  onToggleChapterView?: () => void;
  onOpenSettings?: () => void;
}
