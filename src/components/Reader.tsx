import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { getSettingsOrDefault, getBook, type Settings, type Book } from '../utils/db';
import { ControlsPanel } from './ControlsPanel';
import { Box, Container, Flex, HStack, Text, Button } from '@chakra-ui/react';
import { AnchoredWord } from './AnchoredWord';
import { TitleDisplay } from './TitleDisplay';
import { TableOfContents } from './TableOfContents';
import { BookLocation } from './BookLocation';
import { SentenceDisplay } from './SentenceDisplay';

export function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Load settings on mount
  useEffect(() => {
    getSettingsOrDefault().then((s) => {
      setSettings(s);
    });
  }, []);
  
  // Load book from URL parameter
  useEffect(() => {
    if (bookId) {
      getBook(bookId).then((loadedBook) => {
        if (loadedBook) {
          setBook(loadedBook);
        } else {
          // Book not found, redirect to library
          navigate('/');
        }
        setLoading(false);
      });
    } else {
      // No bookId in URL, redirect to library
      navigate('/');
    }
  }, [bookId, navigate]);
  
  // Always call useReader hook (hooks must be called in same order)
  const reader = useReader({
    book,
    bookId: bookId || null,
    settings: settings || { initWPM: 100, maxWPM: 100, warmupDuration: 60000 },
  });
  
  // Keyboard handlers
  useEffect(() => {
    if (!book) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          reader.toggleFullSentence();
          break;
        case 'ArrowRight':
          e.preventDefault();
          reader.nextSentence();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          reader.prevSentenceStart();
          break;
        case 'Enter':
          e.preventDefault();
          reader.togglePlay();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reader, book]);

  // Show loading state if data isn't ready
  if (loading || !settings || !book) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading...</Text>
      </Container>
    );
  }
  
  const currentWord = reader.getCurrentWord();
  const currentTitle = reader.getCurrentTitle();
  const currentSentence = reader.getCurrentSentence();
  const totalSentences = reader.getCurrentChapterSentenceCount();

  return (
    <>
      <TableOfContents
        book={book}
        currentVolumeId={reader.state.volumeId}
        currentChapterId={reader.state.chapterId}
        onChapterClick={reader.goToChapter}
        isOpen={tocOpen}
        onToggle={() => setTocOpen(!tocOpen)}
      />
      
      <Container 
        maxW={{ base: "100%", sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" }}
        h="100vh"
        p={0}
        centerContent={false}
        overflowX="hidden"
      >
        <Flex 
          direction="column" 
          h="100%" 
          overflow="hidden"
          overflowX="hidden"
        >
          {/* Top panel - config and location */}
          <Box>
            <Box p={4}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <HStack gap={3} alignItems="center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/')}
                  >
                    ← Library
                  </Button>
                </HStack>
                <Box
                  onClick={() => setTocOpen(!tocOpen)}
                  cursor="pointer"
                >
                  <BookLocation
                    book={book}
                    volumeId={reader.state.volumeId}
                    chapterId={reader.state.chapterId}
                    sentenceIndex={reader.state.sentenceIndex}
                    totalSentences={totalSentences}
                  />
                </Box>
              </HStack>
            </Box>
          </Box>
          
          {/* Center area - words presentation */}
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
              <AnchoredWord
                firstPart={currentWord.firstPart}
                middleLetter={currentWord.middleLetter}
                secondPart={currentWord.secondPart}
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl", xl: "5xl" }}
                middleLetterColor="blue.500"
                middleLetterWeight="bold"
                punctuation={currentWord.punctuation}
                punctuationBefore={currentWord.punctuationBefore}
                punctuationAfter={currentWord.punctuationAfter}
                inDialog={currentWord.inDialog}
                inBrackets={currentWord.inBrackets}
              />
            ) : (
              <Text fontSize={{ base: "2xl", md: "3xl", lg: "4xl", xl: "5xl" }}>No word</Text>
            )}
            
            {/* Start/Stop button */}
            <Button
              aria-label={reader.state.isPlaying ? 'Pause' : 'Play'}
              size="lg"
              variant="ghost"
              onClick={reader.togglePlay}
              mt={8}
              fontSize="3xl"
              minW="80px"
              h="80px"
              borderRadius="full"
            >
              {reader.state.isPlaying ? '⏸' : '▶'}
            </Button>
          </Box>
          
          {/* Bottom panel - controls */}
          <Box>
            <ControlsPanel
              onPrevSentenceStart={reader.prevSentenceStart}
              onNextSentence={reader.nextSentence}
              onToggleFullSentence={reader.toggleFullSentence}
              onTogglePlay={reader.togglePlay}
              isPlaying={reader.state.isPlaying}
              isAtEnd={reader.isAtEnd()}
            />
          </Box>
        </Flex>
      </Container>
    </>
  );
}
