import { useImperativeHandle, forwardRef } from 'react';
import { Box, VStack, HStack, IconButton, Flex } from '@chakra-ui/react';
import { FaPlay, FaPause, FaRedo, FaArrowRight } from 'react-icons/fa';
import { Tooltip } from '../ui/tooltip';
import { PlaybackControls } from './PlaybackControls';
import { useI18n } from '../../i18n/useI18n';

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
  currentSentenceIndex?: number;
  currentWordIndex?: number;
  disabled?: boolean;
  onViewChange?: (isMinimal: boolean) => void;
  initialView?: 'minimal' | 'advanced';
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
      currentSentenceIndex = 0,
      currentWordIndex = 0,
      disabled = false,
      onViewChange,
      initialView = 'minimal',
    },
    ref
  ) => {
    const { t } = useI18n();
    // Make view state fully controlled by initialView prop
    const isMinimalView = initialView === 'minimal';
    
    // Check if we're at the start (sentence 0, word 0)
    const isAtStart = currentSentenceIndex === 0 && currentWordIndex === 0;

    useImperativeHandle(ref, () => ({
      toggleView: () => {
        // Just notify parent to toggle - parent will update initialView prop
        const newIsMinimal = !isMinimalView;
        // Defer the callback to avoid updating parent during render
        setTimeout(() => {
          onViewChange?.(newIsMinimal);
        }, 0);
      },
    }), [isMinimalView, onViewChange]);

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
                content={isPlaying ? t('pause') : t('play')} 
                positioning={{ placement: 'top' }}
                disabled={disabled}
              >
                <IconButton
                  aria-label={isPlaying ? t('pause') : t('play')}
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
                content={t('restartSentence')} 
                positioning={{ placement: 'top' }}
                disabled={disabled}
              >
                <IconButton
                  aria-label={t('restartSentence')}
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
                content={t('nextSentence')}
                positioning={{ placement: 'top' }}
                disabled={disabled || !isStoppedAtSentenceEnd}
              >
                <IconButton
                  aria-label={t('nextSentence')}
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
            content={t('resetToBeginning')} 
            positioning={{ placement: 'top' }}
            disabled={disabled || isAtStart}
          >
            <IconButton
              aria-label={t('resetToBeginning')}
              onClick={onReset}
              disabled={disabled || isAtStart}
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
            content={t('nextSentence')} 
            positioning={{ placement: 'top' }}
            disabled={disabled || !isStoppedAtSentenceEnd}
          >
            <IconButton
              aria-label={t('nextSentence')}
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
