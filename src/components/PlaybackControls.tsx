import { HStack, IconButton, Box } from '@chakra-ui/react';
import { Tooltip } from './ui/tooltip';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRedo, FaFastBackward, FaFastForward } from 'react-icons/fa';

export interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNextWord: () => void;
  onPrevWord: () => void;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  onReset: () => void;
  disabled?: boolean;
}

/**
 * Simple playback controls component for word-by-word text playback
 */
export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onNextWord,
  onPrevWord,
  onNextSentence,
  onPrevSentence,
  onReset,
  disabled = false,
}: PlaybackControlsProps) {
  return (
    <Box p={4} bg="gray.50" _dark={{ bg: 'gray.800' }} borderRadius="md">
      <HStack gap={2} justifyContent="center" flexWrap="wrap">
        <Tooltip 
          content="Previous Sentence" 
          positioning={{ placement: 'top' }}
          disabled={disabled}
        >
          <IconButton
            aria-label="Previous Sentence"
            onClick={onPrevSentence}
            disabled={disabled}
            size="sm"
            variant="outline"
          >
            <FaFastBackward />
          </IconButton>
        </Tooltip>

        <Tooltip 
          content="Previous Word" 
          positioning={{ placement: 'top' }}
          disabled={disabled}
        >
          <IconButton
            aria-label="Previous Word"
            onClick={onPrevWord}
            disabled={disabled}
            size="sm"
            variant="outline"
          >
            <FaStepBackward />
          </IconButton>
        </Tooltip>

        <Tooltip 
          content={isPlaying ? 'Pause' : 'Play'} 
          positioning={{ placement: 'top' }}
          disabled={disabled}
        >
          <IconButton
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={isPlaying ? onPause : onPlay}
            disabled={disabled}
            size="md"
            colorScheme="blue"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </IconButton>
        </Tooltip>

        <Tooltip 
          content="Next Word" 
          positioning={{ placement: 'top' }}
          disabled={disabled}
        >
          <IconButton
            aria-label="Next Word"
            onClick={onNextWord}
            disabled={disabled}
            size="sm"
            variant="outline"
          >
            <FaStepForward />
          </IconButton>
        </Tooltip>

        <Tooltip 
          content="Next Sentence" 
          positioning={{ placement: 'top' }}
          disabled={disabled}
        >
          <IconButton
            aria-label="Next Sentence"
            onClick={onNextSentence}
            disabled={disabled}
            size="sm"
            variant="outline"
          >
            <FaFastForward />
          </IconButton>
        </Tooltip>

        <Tooltip 
          content="Reset to beginning" 
          positioning={{ placement: 'top' }}
          disabled={disabled}
        >
          <IconButton
            aria-label="Reset"
            onClick={onReset}
            disabled={disabled}
            size="sm"
            variant="outline"
          >
            <FaRedo />
          </IconButton>
        </Tooltip>
      </HStack>
    </Box>
  );
}
