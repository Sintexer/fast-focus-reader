import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useReader} from '../hooks/useReader';
import {type Book, getBook, getSettingsOrDefault, type Settings} from '../utils/db';
import {ReaderMainPanel} from './ReaderMainPanel';
import {ReaderControlsPanel, type ReaderControlsPanelRef} from './ReaderControlsPanel';
import {Box, Container, Flex, Text} from '@chakra-ui/react';
import {TableOfContents} from './TableOfContents';
import {ReaderHeader} from './ReaderHeader';
import {ReaderFooter} from './ReaderFooter';
import {SettingsDrawer} from './settings/SettingsDrawer';
import type {PlaybackControls} from './reader/types';
import type {AutoStopMode} from './settings/types';

export function Reader() {
    const {bookId} = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [book, setBook] = useState<Book | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [tocOpen, setTocOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [autoStopMode, setAutoStopMode] = useState<AutoStopMode>('sentence');
    const controlsPanelRef = useRef<ReaderControlsPanelRef>(null);
    const [playbackControls, setPlaybackControls] = useState<PlaybackControls | null>(null);
    const [showChapterView, setShowChapterView] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

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

    const handleControlsViewChange = useCallback((isMinimal: boolean) => {
        setShowControls(!isMinimal);
    }, []);

    const handleShowControlsChange = useCallback((show: boolean) => {
        // If toggling on and currently in minimal view, switch to advanced
        if (show && !showControls) {
            controlsPanelRef.current?.toggleView();
        }
        // If toggling off and currently in advanced view, switch to minimal
        if (!show && showControls) {
            controlsPanelRef.current?.toggleView();
        }
        // State will be updated by handleControlsViewChange callback
    }, [showControls]);

    const handleToggleChapterView = useCallback(() => {
        setShowChapterView((prev) => !prev);
    }, []);

    const handleOpenSettings = useCallback(() => {
        setShowSettings(true);
    }, []);

    // Handle advance to next sentence - route to reader when at chapter end
    const handleAdvanceToNextSentence = useCallback(() => {
        // Always use reader navigation when showing title
        if (reader.state.showingTitle) {
            reader.nextSentence();
            return;
        }
        
        if (!playbackControls) {
            return;
        }
        
        // Check if at chapter end - if at last sentence, we're at chapter end
        // The playback controller only knows about the current chapter text
        const isAtLastSentence = playbackControls.currentSentenceIndex >= playbackControls.maxSentenceIndex;
        const isAtChapterEnd = reader.isAtChapterEnd() || isAtLastSentence;
        
        if (isAtChapterEnd) {
            // At chapter end - use nextSentenceAtChapterEnd which bypasses reader state check
            // and directly moves to next chapter (reader state may be out of sync with playback)
            reader.nextSentenceAtChapterEnd();
            return;
        }
        
        // Not at chapter end - use playback controller
        playbackControls.advanceToNextSentence();
    }, [reader, playbackControls]);

    const handleCloseSettings = useCallback(() => {
        setShowSettings(false);
    }, []);

    // Memoize isStoppedAtSentenceEnd calculation to avoid render loops
    const isStoppedAtSentenceEnd = useMemo(() => {
        if (reader.state.showingTitle) {
            return true;
        }
        if (!playbackControls) {
            return false;
        }
        const isAtChapterEnd = reader.isAtChapterEnd() || 
            (playbackControls.currentSentenceIndex >= playbackControls.maxSentenceIndex);
        return isAtChapterEnd ? true : playbackControls.isStoppedAtSentenceEnd;
    }, [
        reader.state.showingTitle, 
        reader.isAtChapterEnd, 
        playbackControls?.currentSentenceIndex, 
        playbackControls?.maxSentenceIndex, 
        playbackControls?.isStoppedAtSentenceEnd
    ]);

    // Show loading state if data isn't ready
    if (loading || !settings || !book) {
        return (
            <Container maxW="container.xl" py={8}>
                <Text>Loading...</Text>
            </Container>
        );
    }

    return (
        <>
            <TableOfContents
                book={book}
                currentVolumeId={reader.state.volumeId}
                currentChapterId={reader.state.chapterId}
                onChapterClick={reader.goToChapter}
                isOpen={tocOpen}
                onToggle={() => setTocOpen(!tocOpen)}
                onBackToLibrary={() => navigate('/', {replace: false})}
            />

            <Container
                maxW={{base: "100%", lg: "1024px", xl: "1280px", "2xl": "1536px"}}
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
                    {/* Header - book location and TOC toggle */}
                    <ReaderHeader
                        book={book}
                        volumeId={reader.state.volumeId}
                        chapterId={reader.state.chapterId}
                        onToggleTOC={() => setTocOpen(!tocOpen)}
                    />

                    {/* Main content area - main panel and controls as siblings */}
                    <Box
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        overflow="hidden"
                        px={2}
                    >
                        {/* Center area - words presentation */}
                        <Box
                            flex="1"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            overflow="hidden"
                        >
                            <ReaderMainPanel
                                key={`${reader.state.volumeId}-${reader.state.chapterId}`}
                                book={book}
                                volumeId={reader.state.volumeId}
                                chapterId={reader.state.chapterId}
                                initialWPM={settings.initWPM}
                                autoStopOnSentenceEnd={autoStopMode === 'sentence' || autoStopMode === 'paragraph'}
                                autoStopOnParagraphEnd={autoStopMode === 'paragraph'}
                                onPlaybackReady={handlePlaybackReady}
                                showChapterView={showChapterView}
                                onToggleChapterView={handleToggleChapterView}
                                showingTitle={reader.state.showingTitle}
                                currentTitle={reader.getCurrentTitle()}
                                shouldAutoplay={reader.state.isPlaying && !reader.state.showingTitle}
                                isLoadingProgress={reader.state.isLoadingProgress}
                            />
                        </Box>

                        {/* Bottom panel - controls */}
                        {playbackControls && (
                            <ReaderControlsPanel
                                ref={controlsPanelRef}
                                isPlaying={reader.state.showingTitle ? false : playbackControls.isPlaying}
                                onPlay={reader.state.showingTitle ? () => {} : playbackControls.play}
                                onPause={playbackControls.pause}
                                onNextWord={reader.state.showingTitle ? () => {} : playbackControls.nextWord}
                                onPrevWord={reader.state.showingTitle ? () => {} : playbackControls.prevWord}
                                onNextSentence={reader.state.showingTitle ? reader.nextSentence : playbackControls.nextSentence}
                                onPrevSentence={reader.state.showingTitle ? reader.prevSentence : playbackControls.prevSentence}
                                onReset={playbackControls.reset}
                                onRestartSentence={playbackControls.restartSentence}
                                onAdvanceToNextSentence={handleAdvanceToNextSentence}
                                isStoppedAtSentenceEnd={isStoppedAtSentenceEnd}
                                disabled={false}
                                onViewChange={handleControlsViewChange}
                            />
                        )}
                    </Box>

                    {/* Footer - playback state info */}
                    {playbackControls && (
                        <ReaderFooter
                            currentSentenceIndex={playbackControls.currentSentenceIndex}
                            maxSentenceIndex={playbackControls.maxSentenceIndex}
                            wpm={playbackControls.wpm}
                            showChapterView={showChapterView}
                            onToggleChapterView={handleToggleChapterView}
                            onOpenSettings={handleOpenSettings}
                        />
                    )}
                </Flex>
            </Container>

            {/* Settings Drawer */}
            <SettingsDrawer
                isOpen={showSettings}
                onClose={handleCloseSettings}
                autoStopMode={autoStopMode}
                onAutoStopModeChange={setAutoStopMode}
                showControls={showControls}
                onShowControlsChange={handleShowControlsChange}
            />
        </>
    );
}
