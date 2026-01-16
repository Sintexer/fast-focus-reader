import { Box, Text, VStack, Mark } from "@chakra-ui/react";
import { useTextPlayback } from "../hooks/useTextPlayback";
import { useMemo, useEffect } from "react";
import type { Book } from "../utils/db";
import { AnchoredWordDisplay } from "./AnchoredWordDisplay";

export interface ReaderMainPanelProps {
  book: Book | null;
  volumeId: string;
  chapterId: string;
  initialWPM?: number;
  autoStopOnSentenceEnd?: boolean;
  autoStopOnParagraphEnd?: boolean;
  onPlaybackReady?: (controls: {
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
  }) => void;
  onToggleControlsView?: () => void;
}

/**
 * Helper function to get chapter text from book structure
 */
function getChapterText(book: Book | null, volumeId: string, chapterId: string): string {
  if (!book) return '';
  
  const volume = book.structure.volumes.find(v => v.id === volumeId);
  if (!volume) return '';
  
  const chapter = volume.chapters.find(c => c.id === chapterId);
  if (!chapter) return '';
  
  // Use paragraphs if available, otherwise fall back to content
  if (chapter.paragraphs && chapter.paragraphs.length > 0) {
    return chapter.paragraphs
      .map(paragraph => paragraph.join(' '))
      .join('\n\n');
  }
  
  return chapter.content || '';
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
  onToggleControlsView
}: ReaderMainPanelProps) {
  const chapterText = useMemo(
    () => getChapterText(book, volumeId, chapterId),
    [book, volumeId, chapterId]
  );

  const playback = useTextPlayback({
    text: chapterText,
    locale: book?.language || 'ru',
    initialWPM,
    autoStopOnSentenceEnd,
    autoStopOnParagraphEnd,
  });

  const currentWord = playback.currentWord;
  const currentSentence = playback.currentSentence;

  // Expose playback controls to parent (update when state changes)
  useEffect(() => {
    if (onPlaybackReady) {
      onPlaybackReady({
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
      });
    }
  }, [onPlaybackReady, playback.isPlaying, playback.isStoppedAtSentenceEnd]);

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
    <VStack
      flex="1"
      w="100%"
      maxW="1200px"
      gap={6}
      px={4}
      py={6}
      overflow="hidden"
    >
      {/* Full Text Display */}
      <Box
        w="100%"
        flex="1"
        minH="200px"
        maxH="300px"
        p={4}
        bg="gray.50"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.200"
        overflowY="auto"
      >
        <Text
          fontSize="sm"
          lineHeight="1.8"
          color="gray.700"
          _dark={{ color: 'gray.300' }}
          whiteSpace="pre-wrap"
        >
          {(() => {
            if (!currentWord || !chapterText) {
              return chapterText;
            }
            
            const wordStart = currentWord.charIndex;
            const wordEnd = wordStart + currentWord.text.length;
            
            const textBefore = chapterText.slice(0, wordStart);
            const currentWordText = chapterText.slice(wordStart, wordEnd);
            const textAfter = chapterText.slice(wordEnd);
            
            return (
              <>
                {textBefore}
                <Mark
                  bg="blue.200"
                  color="blue.900"
                  _dark={{
                    bg: 'blue.800',
                    color: 'blue.100',
                  }}
                  style={{
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    fontWeight: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  {currentWordText}
                </Mark>
                {textAfter}
              </>
            );
          })()}
        </Text>
      </Box>

      {/* Current Sentence Display */}
      {currentSentence && currentSentence.length > 0 && currentWord && chapterText && (
        <Box
          w="100%"
          p={4}
          bg="gray.100"
          _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.300"
        >
          <Text
            fontSize="md"
            lineHeight="1.6"
            color="gray.800"
            _dark={{ color: 'gray.200' }}
            textAlign="center"
            whiteSpace="pre-wrap"
          >
            {(() => {
              // Get sentence boundaries from first and last word
              const firstWord = currentSentence[0];
              const lastWord = currentSentence[currentSentence.length - 1];
              const sentenceStart = firstWord.charIndex;
              const sentenceEnd = lastWord.charIndex + lastWord.text.length;
              
              // Extract sentence text from original chapter text
              const sentenceText = chapterText.slice(sentenceStart, sentenceEnd);
              
              // Calculate word position within sentence
              const wordStart = currentWord.charIndex;
              const wordEnd = wordStart + currentWord.text.length;
              
              // Calculate relative positions within sentence
              const wordStartInSentence = wordStart - sentenceStart;
              const wordEndInSentence = wordEnd - sentenceStart;
              
              const textBefore = sentenceText.slice(0, wordStartInSentence);
              const currentWordText = sentenceText.slice(wordStartInSentence, wordEndInSentence);
              const textAfter = sentenceText.slice(wordEndInSentence);
              
              return (
                <>
                  {textBefore}
                  <Mark
                    bg="blue.300"
                    color="blue.900"
                    _dark={{
                      bg: 'blue.600',
                      color: 'blue.50',
                    }}
                    style={{
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      fontWeight: 'inherit',
                      fontFamily: 'inherit',
                    }}
                  >
                    {currentWordText}
                  </Mark>
                  {textAfter}
                </>
              );
            })()}
          </Text>
        </Box>
      )}

      {/* Current Word Display */}
      {currentWord && (
        <Box
          w="100%"
          p={6}
          bg="gray.50"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH="120px"
          position="relative"
          cursor={onToggleControlsView ? "pointer" : "default"}
          onClick={onToggleControlsView}
          _hover={onToggleControlsView ? {
            bg: "gray.100",
            _dark: { bg: 'gray.750' }
          } : undefined}
          transition="background-color 0.2s"
        >
          {/* Line with fading left and right borders */}
          <Box
            position="absolute"
            left="0"
            right="0"
            top="50%"
            transform="translateY(-50%)"
            h="1px"
            bgGradient="linear(to-r, transparent, gray.300, gray.300, transparent)"
            _dark={{
              bgGradient: 'linear(to-r, transparent, gray.600, gray.600, transparent)',
            }}
            pointerEvents="none"
          />
          <AnchoredWordDisplay
            word={currentWord.text}
            fontSize="2xl"
            middleLetterColor="red.500"
            punctuationColor="orange.500"
            middleLetterWeight="bold"
          />
        </Box>
      )}

      {/* Playback State Info */}
      <Box
        w="100%"
        p={2}
        textAlign="center"
      >
        <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
          Sentence {playback.currentSentenceIndex + 1} of {playback.maxSentenceIndex + 1} • 
          Word {playback.currentWordIndex + 1} • 
          {playback.isPlaying ? ' Playing' : ' Paused'} • 
          {playback.wpm} WPM
        </Text>
      </Box>
    </VStack>
  );
}
