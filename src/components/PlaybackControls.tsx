import { HStack, IconButton } from '@chakra-ui/react';
import { Tooltip } from './ui/tooltip';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaFastBackward, FaFastForward } from 'react-icons/fa';

export interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNextWord: () => void;
  onPrevWord: () => void;
  onNextSentence: () => void;
  onPrevSentence: () => void;
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
  disabled = false,
}: PlaybackControlsProps) {
  return (
    <HStack gap={2} justifyContent="center" flexWrap="nowrap" flexShrink={1}>
      <Tooltip 
        content="Previous Sentence" 
        positioning={{ placement: 'top' }}
        disabled={disabled}
      >
        <IconButton
          aria-label="Previous Sentence"
          onClick={onPrevSentence}
          disabled={disabled}
          size="md"
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
          size="md"
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
          size="lg"
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
          size="md"
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
          size="md"
          variant="outline"
        >
          <FaFastForward />
        </IconButton>
      </Tooltip>
    </HStack>
  );
}
