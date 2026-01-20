import { useState, useImperativeHandle, forwardRef } from 'react';
import { Box, VStack, HStack, IconButton, Flex } from '@chakra-ui/react';
import { FaPlay, FaPause, FaRedo, FaArrowRight } from 'react-icons/fa';
import { Tooltip } from '../ui/tooltip';
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
  disabled?: boolean;
  onViewChange?: (isMinimal: boolean) => void;
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
      disabled = false,
      onViewChange,
    },
    ref
  ) => {
    const [isMinimalView, setIsMinimalView] = useState(true);

    useImperativeHandle(ref, () => ({
      toggleView: () => {
        setIsMinimalView((prev) => {
          const newValue = !prev;
          onViewChange?.(newValue);
          return newValue;
        });
      },
    }));

    if (isMinimalView) {
      return ( // todo fix up the sticcky next button in simple view - it attached to the right border
        <Box py={4} w="100%" display="flex" justifyContent="center">
          <Flex
            w="100%"
            maxW={{ base: "100%", sm: "30rem" }}
            alignItems="stretch"
            gap={3}
          >
            {/* Left side: Play and Reset buttons stacked vertically - 50% width */}
            <VStack 
              gap={3} 
              alignItems="stretch"
              flex="0 0 50%"
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
                  disabled={disabled || (!isPlaying && isStoppedAtSentenceEnd)}
                  size="lg"
                  variant="ghost"
                  colorPalette="gray"
                  rounded="md"
                  w="100%"
                  h="auto"
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
                  flex="1"
                >
                  <FaRedo />
                </IconButton>
              </Tooltip>
            </VStack>

            {/* Right side: Large Next button for mobile thumb - 50% width */}
            <Flex grow={1}>
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
                  w="100%"
                  h="auto"
                  minH="144px"
                >
                  <FaArrowRight />
                </IconButton>
              </Tooltip>
            </Flex>
          </Flex>
        </Box>
      );
    }

    // Advanced view - all controls
    return (
      <Box py={4} mb={6}>
        <HStack gap={2} justifyContent="center" alignItems="center" flexWrap="nowrap">
          {/* Reset button - on the left */}
          <Tooltip 
            content="Reset to beginning" 
            positioning={{ placement: 'top' }}
            disabled={disabled}
          >
            <IconButton
              aria-label="Reset"
              onClick={onReset}
              disabled={disabled}
              size="lg"
              variant="ghost"
              colorPalette="gray"
              flexShrink={0}
            >
              <FaRedo />
            </IconButton>
          </Tooltip>

          {/* Main playback controls - centered */}
          <PlaybackControls
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onNextWord={onNextWord}
            onPrevWord={onPrevWord}
            onNextSentence={onNextSentence}
            onPrevSentence={onPrevSentence}
            disabled={disabled}
          />

          {/* Next Sentence button - on the right (from minimal view) */}
          <Tooltip 
            content="Next Sentence" 
            positioning={{ placement: 'top' }}
            disabled={disabled || !isStoppedAtSentenceEnd}
          >
            <IconButton
              aria-label="Next Sentence"
              onClick={onAdvanceToNextSentence}
              disabled={disabled || !isStoppedAtSentenceEnd}
              size="lg"
              variant="ghost"
              colorPalette={disabled || !isStoppedAtSentenceEnd ? "gray" : "green"}
              bg={disabled || !isStoppedAtSentenceEnd ? "gray.50" : "green.50"}
              _dark={{ bg: disabled || !isStoppedAtSentenceEnd ? "gray.800" : "green.950" }}
              rounded="md"
              flexShrink={0}
            >
              <FaArrowRight />
            </IconButton>
          </Tooltip>
        </HStack>
      </Box>
    );
  }
);

ReaderControlsPanel.displayName = 'ReaderControlsPanel';
