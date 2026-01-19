import { Box, Text } from '@chakra-ui/react';
import { useTextPlayback } from '../hooks/useTextPlayback';
import { useMemo, useEffect } from 'react';
import type { Book } from '../utils/db';
import { getChapterText } from '../utils/bookTextUtils';
import { ChapterTextContainer } from './reader/ChapterTextContainer';
import { CurrentWordDisplay } from './reader/CurrentWordDisplay';
import type { PlaybackControls } from './reader/types';

export interface ReaderMainPanelProps {
  book: Book | null;
  volumeId: string;
  chapterId: string;
  initialWPM?: number;
  autoStopOnSentenceEnd?: boolean;
  autoStopOnParagraphEnd?: boolean;
  onPlaybackReady?: (controls: PlaybackControls) => void;
  onToggleControlsView?: () => void;
  showChapterView?: boolean;
  onToggleChapterView?: () => void;
}

/**
 * Main panel component that displays text with word-by-word playback
 */
export function ReaderMainPanel({ 
  book, 
  volumeId, 
  chapterId,
  initialWPM = 500,
  autoStopOnSentenceEnd = false,
  autoStopOnParagraphEnd = false,
  onPlaybackReady,
  onToggleControlsView,
  showChapterView = false,
  onToggleChapterView
}: ReaderMainPanelProps) {
  const chapterText = useMemo(
    () => getChapterText(book, volumeId, chapterId),
    [book, volumeId, chapterId]
  );
  
  // Keyboard shortcut to toggle chapter view (T key)
  useEffect(() => {
    if (!onToggleChapterView) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // T key toggles chapter view
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onToggleChapterView();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleChapterView]);

  const playback = useTextPlayback({
    text: chapterText,
    locale: book?.language || 'ru',
    initialWPM,
    autoStopOnSentenceEnd,
    autoStopOnParagraphEnd,
  });

  const currentWord = playback.currentWord;
  const currentSentence = playback.currentSentence;

  const playbackControls: PlaybackControls = useMemo(
    () => ({
      isPlaying: playback.isPlaying,
      play: playback.play,
      pause: playback.pause,
      nextWord: playback.nextWord,
      prevWord: playback.prevWord,
      nextSentence: playback.nextSentence,
      prevSentence: playback.prevSentence,
      reset: playback.reset,
      restartSentence: playback.restartSentence,
      advanceToNextSentence: playback.advanceToNextSentence,
      isStoppedAtSentenceEnd: playback.isStoppedAtSentenceEnd,
      currentSentenceIndex: playback.currentSentenceIndex,
      maxSentenceIndex: playback.maxSentenceIndex,
      wpm: playback.wpm,
    }),
    [
      playback.isPlaying,
      playback.play,
      playback.pause,
      playback.nextWord,
      playback.prevWord,
      playback.nextSentence,
      playback.prevSentence,
      playback.reset,
      playback.restartSentence,
      playback.advanceToNextSentence,
      playback.isStoppedAtSentenceEnd,
      playback.currentSentenceIndex,
      playback.maxSentenceIndex,
      playback.wpm,
    ]
  );

  useEffect(() => {
    if (onPlaybackReady) {
      onPlaybackReady(playbackControls);
    }
  }, [onPlaybackReady, playbackControls]);

  if (!chapterText) {
    return (
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center"
        overflow="hidden"
        px={4}
      >
        <Text color="gray.500">No chapter content available</Text>
      </Box>
    );
  }

  return (
    <Box 
      flex="1" 
      w="100%" 
      maxW="1200px" 
      display="flex" 
      flexDirection="column" 
      overflow="hidden"
      px={4}
      py={6}
    >
      {/* Chapter text view - conditionally rendered at top */}
      {showChapterView && (
        <Box
          w="100%"
          opacity={1}
          transform="translateY(0)"
          transition="opacity 0.2s ease-out, transform 0.2s ease-out"
          mb={6}
          flexShrink={0}
        >
          <ChapterTextContainer
            chapterText={chapterText}
            currentWord={currentWord}
            currentSentence={currentSentence}
          />
        </Box>
      )}

      {/* Word display - takes remaining space, centers when no chapter view, aligns to top when chapter view is shown */}
      <Box
        flex="1"
        display="flex"
        alignItems={showChapterView ? "flex-start" : "center"}
        justifyContent="center"
        w="100%"
        minH={0}
      >
        {currentWord && (
          <CurrentWordDisplay word={currentWord.text} onToggleControlsView={onToggleControlsView} />
        )}
      </Box>
    </Box>
  );
}
