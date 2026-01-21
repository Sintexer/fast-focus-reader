import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useReader} from '../hooks/useReader';
import {type Book, getBook, saveBook, getSettingsOrDefault, saveSettings, type Settings, getInitialWPM} from '../utils/db';
import {getStoredWPM} from '../utils/wpmStorage';
import {ReaderMainPanel} from './reader/ReaderMainPanel';
import {ReaderControlsPanel, type ReaderControlsPanelRef} from './reader/ReaderControlsPanel';
import {Box, Container, Flex, Text} from '@chakra-ui/react';
import {TableOfContents} from './reader/TableOfContents';
import {ReaderHeader} from './reader/ReaderHeader';
import {ReaderFooter} from './reader/ReaderFooter';
import {BookEnd} from './reader/BookEnd';
import {SettingsDrawer} from './settings/SettingsDrawer';
import {WPMInfoModal} from './reader/WPMInfoModal';
import type {PlaybackControls} from './reader/types';
import type {AutoStopMode} from './settings/types';
import {useI18n} from '../i18n/useI18n';

export function Reader() {
    const {bookId} = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useI18n();
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
    const [showBookEnd, setShowBookEnd] = useState(false);
    const [showWPMModal, setShowWPMModal] = useState(false);
    const [initialWPM, setInitialWPM] = useState<number | null>(null);

    // Load settings on mount
    useEffect(() => {
        getSettingsOrDefault().then((s) => {
            setSettings(s);
            // Load UI settings
            if (s.autoStopMode) {
                setAutoStopMode(s.autoStopMode);
            }
            if (s.showControls !== undefined) {
                setShowControls(s.showControls);
            }
            
            // Initialize WPM from localStorage if valid, otherwise use getInitialWPM
            const storedWPM = getStoredWPM();
            if (storedWPM !== null) {
                // Ensure stored WPM is within valid range
                if (s.dynamicWPMEnabled) {
                    const minWPM = s.minWPM ?? 50;
                    const maxWPM = s.maxWPMRange ?? 1200;
                    const validWPM = Math.max(minWPM, Math.min(maxWPM, storedWPM));
                    setInitialWPM(validWPM);
                } else {
                    setInitialWPM(storedWPM);
                }
            } else {
                setInitialWPM(getInitialWPM(s));
            }
        });
    }, []);

    // Load book from URL parameter
    useEffect(() => {
        // Only process if we're still on the reader route
        if (location.pathname.startsWith('/book/')) {
            if (bookId) {
                getBook(bookId).then(async (loadedBook) => {
                    if (loadedBook) {
                        setBook(loadedBook);
                        // Update lastReadAt timestamp when book is opened
                        const updatedBook: Book = {
                            ...loadedBook,
                            lastReadAt: Date.now(),
                        };
                        await saveBook(updatedBook);
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
        // Just update the state - the initialView prop will update and panel will sync
        setShowControls(show);
    }, []);

    const handleToggleChapterView = useCallback(() => {
        setShowChapterView((prev) => !prev);
    }, []);

    const handleOpenSettings = useCallback(() => {
        setShowSettings(true);
    }, []);

    // Helper to check if there are more chapters after the current one
    const hasMoreChapters = useCallback((): boolean => {
        if (!book) return false;
        
        const currentVolumeIndex = book.structure.volumes.findIndex(v => v.id === reader.state.volumeId);
        if (currentVolumeIndex === -1) return false;
        
        const currentVolume = book.structure.volumes[currentVolumeIndex];
        const currentChapterIndex = currentVolume.chapters.findIndex(c => c.id === reader.state.chapterId);
        
        // Check if there's a next chapter in current volume
        if (currentChapterIndex < currentVolume.chapters.length - 1) {
            return true;
        }
        
        // Check if there's a next volume
        if (currentVolumeIndex < book.structure.volumes.length - 1) {
            const nextVolume = book.structure.volumes[currentVolumeIndex + 1];
            return nextVolume.chapters.length > 0;
        }
        
        return false;
    }, [book, reader.state.volumeId, reader.state.chapterId]);

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
        
        // Check if at book end - combine playback controller state (last sentence) with book structure (no more chapters)
        // This handles the case where playback controller knows we're at last sentence but reader state might be out of sync
        const isAtBookEnd = isAtChapterEnd && !hasMoreChapters();
        
        if (isAtBookEnd) {
            // At book end - show BookEnd component
            setShowBookEnd(true);
            return;
        }
        
        if (isAtChapterEnd) {
            // At chapter end but not book end - use nextSentenceAtChapterEnd which bypasses reader state check
            // and directly moves to next chapter (reader state may be out of sync with playback)
            reader.nextSentenceAtChapterEnd();
            // Reset showBookEnd when moving to next chapter
            setShowBookEnd(false);
            return;
        }
        
        // Not at chapter end - use playback controller
        playbackControls.advanceToNextSentence();
    }, [reader, playbackControls, hasMoreChapters]);

    const handleCloseSettings = useCallback(() => {
        setShowSettings(false);
    }, []);

    const handleOpenWPMModal = useCallback(() => {
        setShowWPMModal(true);
    }, []);

    const handleCloseWPMModal = useCallback(() => {
        setShowWPMModal(false);
    }, []);

    const handleResetWPM = useCallback(() => {
        if (!settings) return;
        const initialWPMValue = getInitialWPM(settings);
        reader.setWPM(initialWPMValue);
        // Reset previous sentence index to allow WPM to increase again
        // This is handled by the useReader hook's reset logic
    }, [settings, reader]);

    // Track playbackController sentence changes for dynamic WPM
    // Note: This handles chapter-level playback, while useReader handles book structure
    const prevPlaybackSentenceRef = useRef<number>(-1);
    const prevPlaybackChapterRef = useRef<string>('');
    useEffect(() => {
        if (!playbackControls || !settings?.dynamicWPMEnabled) {
            if (playbackControls) {
                prevPlaybackSentenceRef.current = playbackControls.currentSentenceIndex;
                prevPlaybackChapterRef.current = `${reader.state.volumeId}-${reader.state.chapterId}`;
            }
            return;
        }

        const currentChapterKey = `${reader.state.volumeId}-${reader.state.chapterId}`;
        const currentSentenceIndex = playbackControls.currentSentenceIndex;
        
        // Reset when chapter changes
        if (currentChapterKey !== prevPlaybackChapterRef.current) {
            prevPlaybackSentenceRef.current = currentSentenceIndex;
            prevPlaybackChapterRef.current = currentChapterKey;
            return;
        }
        
        // Only increase WPM if we moved to a new sentence (forward)
        if (prevPlaybackSentenceRef.current >= 0 && 
            currentSentenceIndex !== prevPlaybackSentenceRef.current &&
            currentSentenceIndex > prevPlaybackSentenceRef.current) {
            
            const minWPM = settings.minWPM ?? 50;
            const maxWPM = settings.maxWPMRange ?? 1200;
            const diff = maxWPM - minWPM;
            
            // Calculate step: 5% of (max - min), rounded down to nearest 5, min 10
            const desiredStep = Math.floor((diff * 0.05) / 5) * 5;
            const step = Math.max(10, desiredStep);
            
            const currentWPM = reader.state.currentWPM;
            if (currentWPM < maxWPM) {
                const newWPM = Math.min(currentWPM + step, maxWPM);
                reader.setWPM(newWPM);
            }
        }
        
        prevPlaybackSentenceRef.current = currentSentenceIndex;
        prevPlaybackChapterRef.current = currentChapterKey;
    }, [playbackControls?.currentSentenceIndex, reader.state.volumeId, reader.state.chapterId, settings, reader]);

    // Save UI settings when they change
    const handleAutoStopModeChange = useCallback(async (mode: AutoStopMode) => {
        setAutoStopMode(mode);
        if (settings) {
            const updatedSettings: Settings = {
                ...settings,
                autoStopMode: mode,
            };
            await saveSettings(updatedSettings);
            setSettings(updatedSettings);
        }
    }, [settings]);

    const handleShowControlsChangeWithSave = useCallback(async (show: boolean) => {
        handleShowControlsChange(show);
        if (settings) {
            const updatedSettings: Settings = {
                ...settings,
                showControls: show,
            };
            await saveSettings(updatedSettings);
            setSettings(updatedSettings);
        }
    }, [settings, handleShowControlsChange]);

    const handleSettingsChange = useCallback(async (updatedSettings: Settings) => {
        await saveSettings(updatedSettings);
        setSettings(updatedSettings);
    }, []);

    const handleWPMChange = useCallback((wpm: number) => {
        reader.setWPM(wpm);
    }, [reader]);

    // Memoize isStoppedAtSentenceEnd calculation to avoid render loops
    const isStoppedAtSentenceEnd = useMemo(() => {
        if (reader.state.showingTitle) {
            return true;
        }
        if (!playbackControls) {
            return false;
        }
        // If at book end, enable button to show BookEnd component
        if (reader.isAtEnd()) {
            return true;
        }
        // Only enable button if we're actually at the end of a sentence
        // For chapter end, use reader.isAtChapterEnd() which checks if we're at the last word of the last sentence
        // For regular sentence ends, use playbackControls.isStoppedAtSentenceEnd
        const isAtChapterEnd = reader.isAtChapterEnd();
        return isAtChapterEnd ? true : playbackControls.isStoppedAtSentenceEnd;
    }, [
        reader.state.showingTitle, 
        reader.isAtEnd,
        reader.isAtChapterEnd, 
        playbackControls?.isStoppedAtSentenceEnd
    ]);
    
    // Reset showBookEnd when chapter changes
    useEffect(() => {
        if (reader.state.volumeId && reader.state.chapterId && !reader.isAtEnd()) {
            setShowBookEnd(false);
        }
    }, [reader.state.volumeId, reader.state.chapterId, reader.isAtEnd]);

    // Show loading state if data isn't ready or progress is loading
    if (loading || !settings || !book || reader.state.isLoadingProgress) {
        return (
            <Container maxW="container.xl" py={8} h="100vh" display="flex" alignItems="center" justifyContent="center">
                <Text>{t('loading')}</Text>
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
                        onBackToLibrary={() => navigate('/', { replace: false })}
                    />

                    {/* Main content area - main panel and controls as siblings */}
                    <Box
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        overflow="hidden"
                        px={2}
                    >
                        {/* Center area - words presentation or book end */}
                        <Box
                            flex="1"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            overflow="hidden"
                        >
                            {showBookEnd ? (
                                <BookEnd onBackToLibrary={() => navigate('/', {replace: false})} />
                            ) : (
                                <ReaderMainPanel
                                    key={`${reader.state.volumeId}-${reader.state.chapterId}`}
                                    book={book}
                                    volumeId={reader.state.volumeId}
                                    chapterId={reader.state.chapterId}
                                    initialWPM={initialWPM ?? settings?.initWPM ?? 200}
                                    autoStopOnSentenceEnd={autoStopMode === 'sentence' || autoStopMode === 'paragraph'}
                                    autoStopOnParagraphEnd={autoStopMode === 'paragraph'}
                                    onPlaybackReady={handlePlaybackReady}
                                    showChapterView={showChapterView}
                                    onToggleChapterView={handleToggleChapterView}
                                    showingTitle={reader.state.showingTitle}
                                    currentTitle={reader.getCurrentTitle()}
                                    shouldAutoplay={reader.state.isPlaying && !reader.state.showingTitle}
                                    isLoadingProgress={reader.state.isLoadingProgress}
                                    fontFamily={settings?.fontFamily ? `"${settings.fontFamily}", ${settings.fontType === 'mono' ? 'ui-monospace, monospace' : 'system-ui, -apple-system, sans-serif'}` : undefined}
                                />
                            )}
                        </Box>

                        {/* Bottom panel - controls (invisible when showing book end) */}
                        {playbackControls && (
                            <Box visibility={showBookEnd ? 'hidden' : 'visible'}>
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
                                    currentSentenceIndex={playbackControls.currentSentenceIndex}
                                    currentWordIndex={playbackControls.currentWordIndex}
                                    disabled={false}
                                    onViewChange={handleControlsViewChange}
                                    initialView={showControls ? 'advanced' : 'minimal'}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Footer - playback state info (invisible when showing book end) */}
                    {playbackControls && (
                        <Box visibility={showBookEnd ? 'hidden' : 'visible'}>
                            <ReaderFooter
                                currentSentenceIndex={playbackControls.currentSentenceIndex}
                                maxSentenceIndex={playbackControls.maxSentenceIndex}
                                wpm={reader.state.currentWPM}
                                settings={settings}
                                showChapterView={showChapterView}
                                onToggleChapterView={handleToggleChapterView}
                                onOpenSettings={handleOpenSettings}
                                onWPMClick={handleOpenWPMModal}
                            />
                        </Box>
                    )}
                </Flex>
            </Container>

            {/* Settings Drawer */}
            <SettingsDrawer
                isOpen={showSettings}
                onClose={handleCloseSettings}
                autoStopMode={autoStopMode}
                onAutoStopModeChange={handleAutoStopModeChange}
                showControls={showControls}
                onShowControlsChange={handleShowControlsChangeWithSave}
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onWPMChange={handleWPMChange}
            />

            {/* WPM Info Modal */}
            {settings && (
                <WPMInfoModal
                    isOpen={showWPMModal}
                    onClose={handleCloseWPMModal}
                    currentWPM={reader.state.currentWPM}
                    settings={settings}
                    onResetWPM={handleResetWPM}
                    onOpenSettings={handleOpenSettings}
                />
            )}
        </>
    );
}
