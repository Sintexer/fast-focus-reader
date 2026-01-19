import {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useReader} from '../hooks/useReader';
import {type Book, getBook, getSettingsOrDefault, type Settings} from '../utils/db';
import {ReaderMainPanel} from './ReaderMainPanel';
import {ReaderControlsPanel, type ReaderControlsPanelRef} from './ReaderControlsPanel';
import {Box, Button, Container, Flex, HStack, Text} from '@chakra-ui/react';
import {TableOfContents} from './TableOfContents';
import {BookLocation} from './BookLocation';
import {PlaybackStateInfo} from './reader/PlaybackStateInfo';
import type {PlaybackControls} from './reader/types';

export function Reader() {
    const {bookId} = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [book, setBook] = useState<Book | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [tocOpen, setTocOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [autoStopOnSentenceEnd, setAutoStopOnSentenceEnd] = useState(true);
    const [autoStopOnParagraphEnd, setAutoStopOnParagraphEnd] = useState(true);
    const controlsPanelRef = useRef<ReaderControlsPanelRef>(null);
    const [playbackControls, setPlaybackControls] = useState<PlaybackControls | null>(null);
    const [showChapterView, setShowChapterView] = useState(false);

    // Load settings on mount
    useEffect(() => {
        getSettingsOrDefault().then((s) => {
            setSettings(s);
        });
    }, []);

    // Load book from URL parameter
    useEffect(() => {
        // Only process if we're still on the reader route
        if (location.pathname.startsWith('/book/')) {
            if (bookId) {
                getBook(bookId).then((loadedBook) => {
                    if (loadedBook) {
                        setBook(loadedBook);
                    } else {
                        // Book not found, redirect to library
                        navigate('/', {replace: true});
                    }
                    setLoading(false);
                });
            } else {
                // No bookId in URL, redirect to library
                navigate('/', {replace: true});
            }
        }
    }, [bookId, navigate, location.pathname]);

    // Always call useReader hook (hooks must be called in same order)
    const reader = useReader({
        book,
        bookId: bookId || null,
        settings: settings || {initWPM: 100, maxWPM: 100, warmupDuration: 60000},
    });

    // Memoize callbacks to prevent infinite re-renders (must be called before any conditional returns)
    const handlePlaybackReady = useCallback((controls: PlaybackControls) => {
        setPlaybackControls(controls);
    }, []);

    const handleToggleControlsView = useCallback(() => {
        controlsPanelRef.current?.toggleView();
    }, []);

    const handleToggleChapterView = useCallback(() => {
        setShowChapterView((prev) => !prev);
    }, []);

    // Show loading state if data isn't ready
    if (loading || !settings || !book) {
        return (
            <Container maxW="container.xl" py={8}>
                <Text>Loading...</Text>
            </Container>
        );
    }

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
                maxW={{base: "100%", sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px"}}
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
                                        onClick={() => navigate('/', {replace: false})}
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
                        <ReaderMainPanel
                            key={`${reader.state.volumeId}-${reader.state.chapterId}`}
                            book={book}
                            volumeId={reader.state.volumeId}
                            chapterId={reader.state.chapterId}
                            initialWPM={settings.initWPM}
                            autoStopOnSentenceEnd={autoStopOnSentenceEnd}
                            autoStopOnParagraphEnd={autoStopOnParagraphEnd}
                            onPlaybackReady={handlePlaybackReady}
                            onToggleControlsView={handleToggleControlsView}
                            showChapterView={showChapterView}
                            onToggleChapterView={handleToggleChapterView}
                        />
                    </Box>

                    {/* Bottom panel - controls */}
                    {playbackControls && (
                        <>
                            <ReaderControlsPanel
                                ref={controlsPanelRef}
                                isPlaying={playbackControls.isPlaying}
                                onPlay={playbackControls.play}
                                onPause={playbackControls.pause}
                                onNextWord={playbackControls.nextWord}
                                onPrevWord={playbackControls.prevWord}
                                onNextSentence={playbackControls.nextSentence}
                                onPrevSentence={playbackControls.prevSentence}
                                onReset={playbackControls.reset}
                                onRestartSentence={playbackControls.restartSentence}
                                onAdvanceToNextSentence={playbackControls.advanceToNextSentence}
                                isStoppedAtSentenceEnd={playbackControls.isStoppedAtSentenceEnd}
                                autoStopOnSentenceEnd={autoStopOnSentenceEnd}
                                onAutoStopOnSentenceEndChange={setAutoStopOnSentenceEnd}
                                autoStopOnParagraphEnd={autoStopOnParagraphEnd}
                                onAutoStopOnParagraphEndChange={setAutoStopOnParagraphEnd}
                                disabled={false}
                            />
                            {/* Footer - playback state info */}
                            <PlaybackStateInfo
                                currentSentenceIndex={playbackControls.currentSentenceIndex}
                                maxSentenceIndex={playbackControls.maxSentenceIndex}
                                wpm={playbackControls.wpm}
                                showChapterView={showChapterView}
                                onToggleChapterView={handleToggleChapterView}
                            />
                        </>
                    )}
                </Flex>
            </Container>
        </>
    );
}
