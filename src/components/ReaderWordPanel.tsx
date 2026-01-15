import { useReader } from "@/hooks/useReader";
import type { Book } from "@/utils/db";
import { Box, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SentenceDisplay } from "./SentenceDisplay";
import { AnchoredWord } from "./AnchoredWord";
import { TitleDisplay } from "./TitleDisplay";

export function ReaderMainPanel() {

  const { bookId } = useParams<{ bookId: string }>();

  const [book, setBook] = useState<Book | null>(null);
  // Always call useReader hook (ho
  // oks must be called in same order)
  const reader = useReader({
    book,
    bookId: bookId || null,
    settings: { initWPM: 100, maxWPM: 100, warmupDuration: 60000 },
  });
  
  const currentWord = reader.getCurrentWord();
  const currentTitle = reader.getCurrentTitle();
  const currentSentence = reader.getCurrentSentence();
  const totalSentences = reader.getCurrentChapterSentenceCount();

  
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
            {/* Sentence display - only show when not displaying title */}
            {!reader.state.showingTitle && (
              <SentenceDisplay
                sentence={currentSentence}
                currentWordIndex={reader.state.wordIndex}
                isVisible={reader.state.showFullSentence}
                onClose={() => reader.toggleFullSentence()}
              />
            )}
            
            {/* Title display */}
            {currentTitle ? (
              <TitleDisplay
                title={currentTitle}
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl", xl: "5xl" }}
              />
            ) : currentWord ? (
              <Box position="relative" display="flex" flexDirection="column" alignItems="center">
                {/* Pause indicator - large and subtle */}
                {!reader.state.isPlaying && (
                  <Text
                    fontSize={{ base: "4xl", md: "5xl", lg: "6xl", xl: "7xl" }}
                    opacity={0.15}
                    color="gray.500"
                    _dark={{ color: 'gray.400', opacity: 0.1 }}
                    position="absolute"
                    top="-1.5em"
                    pointerEvents="none"
                    userSelect="none"
                    lineHeight="1"
                  >
                    ⏸
                  </Text>
                )}
                <AnchoredWord
                  firstPart={currentWord.firstPart}
                  middleLetter={currentWord.middleLetter}
                  secondPart={currentWord.secondPart}
                  fontSize={{ base: "2xl", md: "3xl", lg: "4xl", xl: "5xl" }}
                  middleLetterColor="blue.500"
                  middleLetterWeight="bold"
                  endingPunctuation={currentWord.endingPunctuation}
                  inQuotes={currentWord.inQuotes}
                  inBrackets={currentWord.inBrackets}
                />
              </Box>
            ) : (
              <Text fontSize={{ base: "2xl", md: "3xl", lg: "4xl", xl: "5xl" }}>No word</Text>
            )}
          </Box>
    )
}