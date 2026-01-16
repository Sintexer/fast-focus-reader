import { useState, useImperativeHandle, forwardRef } from 'react';
import { Box, HStack, VStack, Text, Switch, IconButton } from '@chakra-ui/react';
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
        <Box p={4}>
          <VStack gap={3} alignItems="center">
            {/* Play/Pause button - subtle, smaller, above */}
            <Tooltip 
              content={isPlaying ? 'Pause' : 'Play'} 
              positioning={{ placement: 'top' }}
              disabled={disabled}
            >
              <IconButton
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={isPlaying ? onPause : onPlay}
                disabled={disabled}
                size="sm"
                variant="ghost"
                colorPalette="gray"
                opacity={0.7}
                _hover={{ opacity: 1 }}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </IconButton>
            </Tooltip>

            {/* Restart and Next buttons - bigger, below */}
            <HStack gap={4} justifyContent="center">
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
                  size="xl"
                  variant="ghost"
                  rounded="full"
                >
                  <FaRedo />
                </IconButton>
              </Tooltip>

              {/* Next Sentence button */}
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
                  rounded="full"
                  variant="ghost"
                  colorPalette={disabled || !isStoppedAtSentenceEnd ? "gray" : "green"}
                >
                  <FaArrowRight />
                </IconButton>
              </Tooltip>
            </HStack>
          </VStack>
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
