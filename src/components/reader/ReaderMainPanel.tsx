import { Box, Text } from '@chakra-ui/react';
import { useTextPlayback } from '../../hooks/useTextPlayback';
import { useMemo, useEffect, useRef } from 'react';
import type { Book } from '../../utils/db';
import { getChapterText } from '../../utils/bookTextUtils';
import { ChapterTextContainer } from './ChapterTextContainer';
import { CurrentWordDisplay } from './CurrentWordDisplay';
import { TitleDisplay } from './TitleDisplay';
import type { PlaybackControls } from './types';

export interface ReaderMainPanelProps {
  book: Book | null;
  volumeId: string;
  chapterId: string;
  initialWPM?: number;
  autoStopOnSentenceEnd?: boolean;
  autoStopOnParagraphEnd?: boolean;
  onPlaybackReady?: (controls: PlaybackControls) => void;
  showChapterView?: boolean;
  onToggleChapterView?: () => void;
  showingTitle?: 'volume' | 'chapter' | null;
  currentTitle?: string | null;
  shouldAutoplay?: boolean;
  isLoadingProgress?: boolean;
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
  showChapterView = false,
  onToggleChapterView,
  showingTitle = null,
  currentTitle = null,
  shouldAutoplay = false,
  isLoadingProgress = false,
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
    text: chapterText || '',
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

  // Pause and reset playback when chapter changes (selected from TOC)
  const prevChapterRef = useRef({ volumeId, chapterId });
  useEffect(() => {
    // If chapter changed, pause and reset playback
    if (prevChapterRef.current.volumeId !== volumeId || prevChapterRef.current.chapterId !== chapterId) {
      if (playbackControls) {
        playbackControls.pause();
        playbackControls.reset();
      }
      prevChapterRef.current = { volumeId, chapterId };
    }
  }, [volumeId, chapterId, playbackControls]);

  // Reset playback when showingTitle is set (chapter selected from TOC)
  // This ensures chapter view resets even when selecting the same chapter
  const prevShowingTitleForResetRef = useRef(showingTitle);
  useEffect(() => {
    // If we just started showing a title (chapter was selected), reset playback immediately
    // This ensures the chapter view shows the correct position even for the same chapter
    if (!prevShowingTitleForResetRef.current && showingTitle && playbackControls) {
      playbackControls.pause();
      playbackControls.reset();
    }
    prevShowingTitleForResetRef.current = showingTitle;
  }, [showingTitle, playbackControls]);

  // Track shouldAutoplay in a ref so we can check it without causing effect re-runs
  const shouldAutoplayRef = useRef(shouldAutoplay);
  useEffect(() => {
    shouldAutoplayRef.current = shouldAutoplay;
  }, [shouldAutoplay]);

  // Store playback controls in a ref to avoid effect re-runs when the object changes
  const playbackControlsRef = useRef(playbackControls);
  useEffect(() => {
    playbackControlsRef.current = playbackControls;
  }, [playbackControls]);

  // Reset and start playing when transitioning from title to text
  const prevShowingTitleForAutoplayRef = useRef(showingTitle);
  useEffect(() => {
    // If we were showing a title and now we're not, reset playback to start
    const wasShowingTitle = prevShowingTitleForAutoplayRef.current;
    const isShowingTitle = showingTitle;
    
    if (wasShowingTitle && !isShowingTitle && playbackControlsRef.current) {
      const controls = playbackControlsRef.current;
      controls.reset();
      // Start playing if shouldAutoplay is true (check the ref to get the latest value)
      if (shouldAutoplayRef.current) {
        // Use a small delay to ensure reset completes before play
        const timeoutId = setTimeout(() => {
          controls.play();
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }
    
    prevShowingTitleForAutoplayRef.current = showingTitle;
  }, [showingTitle]); // Only depend on showingTitle to avoid multiple runs

  // Don't render content while loading progress to prevent brief wrong renders
  if (isLoadingProgress) {
    return (
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center"
        overflow="hidden"
      >
        <Text color="gray.500">Loading...</Text>
      </Box>
    );
  }

  if (!chapterText && !showingTitle) {
    return (
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center"
        overflow="hidden"
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
      py={6}
    >
      {/* Chapter text view - conditionally rendered at top - always show when enabled, even when showing title */}
      {showChapterView && chapterText && (
        <Box
          w="100%"
          opacity={1}
          transform="translateY(0)"
          transition="opacity 0.2s ease-out, transform 0.2s ease-out"
          mb={6}
          flexShrink={0}
          key={`chapter-view-${volumeId}-${chapterId}`}
        >
          <ChapterTextContainer
            chapterText={chapterText}
            currentWord={currentWord}
            currentSentence={currentSentence}
          />
        </Box>
      )}

      {/* Word display or Title display - takes remaining space, centers when no chapter view, aligns to top when chapter view is shown */}
      <Box
        flex="1"
        display="flex"
        alignItems={showChapterView ? "flex-start" : "center"}
        justifyContent="center"
        w="100%"
        minH={0}
      >
        {showingTitle && currentTitle ? (
          <TitleDisplay title={currentTitle} type={showingTitle} />
        ) : currentWord ? (
          <CurrentWordDisplay word={currentWord.text} />
        ) : null}
      </Box>
    </Box>
  );
}
