import { useState, useImperativeHandle, forwardRef } from 'react';
import { Box, HStack, VStack, Text, Switch, IconButton, Flex } from '@chakra-ui/react';
import { FaPlay, FaPause, FaRedo, FaArrowRight } from 'react-icons/fa';
import { Tooltip } from './ui/tooltip';
import { SentenceNavigationControls } from './SentenceNavigationControls';
import { PlaybackControls } from './PlaybackControls';

export interface ReaderControlsPanelProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNextWord: () => void;
  onPrevWord: () => void;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  onReset: () => void;
  onRestartSentence: () => void;
  onAdvanceToNextSentence: () => void;
  isStoppedAtSentenceEnd: boolean;
  autoStopOnSentenceEnd: boolean;
  onAutoStopOnSentenceEndChange: (checked: boolean) => void;
  autoStopOnParagraphEnd: boolean;
  onAutoStopOnParagraphEndChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface ReaderControlsPanelRef {
  toggleView: () => void;
}

export const ReaderControlsPanel = forwardRef<ReaderControlsPanelRef, ReaderControlsPanelProps>(
  (
    {
      isPlaying,
      onPlay,
      onPause,
      onNextWord,
      onPrevWord,
      onNextSentence,
      onPrevSentence,
      onReset,
      onRestartSentence,
      onAdvanceToNextSentence,
      isStoppedAtSentenceEnd,
      autoStopOnSentenceEnd,
      onAutoStopOnSentenceEndChange,
      autoStopOnParagraphEnd,
      onAutoStopOnParagraphEndChange,
      disabled = false,
    },
    ref
  ) => {
    const [isMinimalView, setIsMinimalView] = useState(true);

    useImperativeHandle(ref, () => ({
      toggleView: () => {
        setIsMinimalView((prev) => !prev);
      },
    }));

    if (isMinimalView) {
      return (
        <Box p={4} w="100%" display="flex" justifyContent="center">
          <Flex
            w="100%"
            maxW={{ base: "100%", sm: "400px", md: "500px" }}
            alignItems="stretch"
            gap={4}
          >
            {/* Left side: Play and Reset buttons stacked vertically - ~40% width */}
            <VStack 
              gap={3} 
              alignItems="stretch"
              flex="0 0 40%"
              minW={0}
            >
              {/* Play/Pause button */}
              <Tooltip 
                content={isPlaying ? 'Pause' : 'Play'} 
                positioning={{ placement: 'top' }}
                disabled={disabled}
              >
                <IconButton
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={disabled}
                  size="lg"
                  variant="ghost"
                  colorPalette="gray"
                  rounded="md"
                  w="100%"
                  h="auto"
                  minH="72px"
                  flex="1"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </IconButton>
              </Tooltip>

              {/* Restart Sentence button */}
              <Tooltip 
                content="Restart Sentence" 
                positioning={{ placement: 'top' }}
                disabled={disabled}
              >
                <IconButton
                  aria-label="Restart Sentence"
                  onClick={onRestartSentence}
                  disabled={disabled}
                  colorPalette="gray"
                  size="lg"
                  variant="ghost"
                  rounded="md"
                  w="100%"
                  h="auto"
                  minH="72px"
                  flex="1"
                >
                  <FaRedo />
                </IconButton>
              </Tooltip>
            </VStack>

            {/* Right side: Large Next button for mobile thumb - ~60% width */}
            <Tooltip 
              content="Next Sentence" 
              positioning={{ placement: 'top' }}
              disabled={disabled || !isStoppedAtSentenceEnd}
            >
              <IconButton
                aria-label="Next Sentence"
                onClick={onAdvanceToNextSentence}
                disabled={disabled || !isStoppedAtSentenceEnd}
                size="xl"
                variant="ghost"
                colorPalette={disabled || !isStoppedAtSentenceEnd ? "gray" : "green"}
                bg={disabled || !isStoppedAtSentenceEnd ? "gray.50" : "green.50"}
                _dark={{ bg: disabled || !isStoppedAtSentenceEnd ? "gray.800" : "green.950" }}
                rounded="md"
                flex="1 1 60%"
                w="100%"
                h="auto"
                minH="144px"
              >
                <FaArrowRight />
              </IconButton>
            </Tooltip>
          </Flex>
        </Box>
      );
    }

    // Advanced view - all controls
    return (
      <Box>
        {/* Auto-stop toggles */}
        <Box p={2} borderTopWidth="1px" borderColor="gray.200" _dark={{ borderColor: 'gray.700' }}>
          <HStack gap={4} justifyContent="center" flexWrap="wrap">
            <HStack gap={2} alignItems="center">
              <Switch.Root
                checked={autoStopOnSentenceEnd}
                onCheckedChange={(details: { checked: boolean }) => onAutoStopOnSentenceEndChange(details.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              <Text fontSize="sm">Auto-stop at sentence end</Text>
            </HStack>
            <HStack gap={2} alignItems="center">
              <Switch.Root
                checked={autoStopOnParagraphEnd}
                onCheckedChange={(details: { checked: boolean }) => onAutoStopOnParagraphEndChange(details.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              <Text fontSize="sm">Auto-stop at paragraph end</Text>
            </HStack>
          </HStack>
        </Box>

        {/* Sentence navigation controls (Restart and Next) */}
        <SentenceNavigationControls
          onRestart={onRestartSentence}
          onNext={onAdvanceToNextSentence}
          isNextEnabled={isStoppedAtSentenceEnd}
        />

        {/* Playback controls (play/pause/navigation) */}
        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          onNextWord={onNextWord}
          onPrevWord={onPrevWord}
          onNextSentence={onNextSentence}
          onPrevSentence={onPrevSentence}
          onReset={onReset}
          disabled={disabled}
        />
      </Box>
    );
  }
);

ReaderControlsPanel.displayName = 'ReaderControlsPanel';
