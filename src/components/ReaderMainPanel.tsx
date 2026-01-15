import { Box, Text, VStack, Mark } from "@chakra-ui/react";
import { useTextPlayback } from "../hooks/useTextPlayback";
import { useMemo, useRef, useEffect } from "react";
import { TextProcessor } from "../services/textProcessor";
import type { Book } from "../utils/db";

export interface ReaderMainPanelProps {
  book: Book | null;
  volumeId: string;
  chapterId: string;
  initialWPM?: number;
  onPlaybackReady?: (controls: {
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    nextWord: () => void;
    prevWord: () => void;
    nextSentence: () => void;
    prevSentence: () => void;
    reset: () => void;
  }) => void;
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
      .map(paragraph => paragraph.join('\n'))
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
  initialWPM = 200,
  onPlaybackReady
}: ReaderMainPanelProps) {
  const chapterText = useMemo(
    () => getChapterText(book, volumeId, chapterId),
    [book, volumeId, chapterId]
  );

  const playback = useTextPlayback({
    text: chapterText,
    locale: book?.language || 'ru',
    initialWPM,
  });

  // Get all words for full text display
  const processorRef = useRef<TextProcessor | null>(null);
  const allWordsRef = useRef<Array<{ text: string; charIndex: number; sentenceIndex: number; wordIndex: number }>>([]);

  useEffect(() => {
    if (chapterText) {
      processorRef.current = new TextProcessor({ locale: book?.language || 'ru' });
      const processed = processorRef.current.process(chapterText);
      allWordsRef.current = processed.words;
    }
  }, [chapterText, book?.language]);

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
      });
    }
  }, [onPlaybackReady, playback.isPlaying]);

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
        >
          {allWordsRef.current.map((word, index) => {
            const isCurrentWord = currentWord && 
              word.charIndex === currentWord.charIndex &&
              word.sentenceIndex === currentWord.sentenceIndex &&
              word.wordIndex === currentWord.wordIndex;
            
            return (<>
                {isCurrentWord ? (
                  <Mark
                    px="1"
                    py="0.5"
                    bg="blue.200"
                    color="blue.900"
                    fontWeight="semibold"
                    borderRadius="sm"
                    _dark={{
                      bg: 'blue.800',
                      color: 'blue.100',
                    }}
                  >
                    {word.text}
                  </Mark>
                ) : (
                  <>{word.text}</>
                )}
            </>);
          })}
        </Text>
      </Box>

      {/* Current Sentence Display */}
      {currentSentence && currentSentence.length > 0 && (
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
          >
            {currentSentence.map((word, index) => {
              const isCurrentWord = currentWord && 
                word.charIndex === currentWord.charIndex &&
                word.sentenceIndex === currentWord.sentenceIndex &&
                word.wordIndex === currentWord.wordIndex;
              
              return (<>
                  {isCurrentWord ? (
                    <Mark
                      bg="blue.300"
                      color="blue.900"
                      fontWeight="bold"
                      borderRadius="md"
                      _dark={{
                        bg: 'blue.600',
                        color: 'blue.50',
                      }}
                    >
                      {word.text}
                    </Mark>
                  ) : (
                    <>{word.text}</>
                  )}
              </>);
            })}
          </Text>
        </Box>
      )}

      {/* Current Word Display */}
      {currentWord && (
        <Box
          w="100%"
          p={6}
          bg="blue.50"
          _dark={{ bg: 'blue.900', borderColor: 'blue.600' }}
          borderRadius="lg"
          borderWidth="2px"
          borderColor="blue.300"
        >
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="blue.900"
            _dark={{ color: 'blue.100' }}
            textAlign="center"
          >
            {currentWord.text}
          </Text>
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
