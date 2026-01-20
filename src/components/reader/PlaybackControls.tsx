import { HStack, IconButton } from '@chakra-ui/react';
import { Tooltip } from '../ui/tooltip';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaFastBackward, FaFastForward } from 'react-icons/fa';
import { useI18n } from '../../i18n/useI18n';

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
  const { t } = useI18n();
  
  return (
    <HStack gap={2} justifyContent="center" flexWrap="nowrap" flexShrink={1}>
      <Tooltip 
        content={t('previousSentence')} 
        positioning={{ placement: 'top' }}
        disabled={disabled}
      >
        <IconButton
          aria-label={t('previousSentence')}
          onClick={onPrevSentence}
          disabled={disabled}
          size="md"
          variant="ghost"
        >
          <FaFastBackward />
        </IconButton>
      </Tooltip>

      <Tooltip 
        content={t('previousWord')} 
        positioning={{ placement: 'top' }}
        disabled={disabled}
      >
        <IconButton
          aria-label={t('previousWord')}
          onClick={onPrevWord}
          disabled={disabled}
          size="md"
          variant="ghost"
        >
          <FaStepBackward />
        </IconButton>
      </Tooltip>

      <Tooltip 
        content={isPlaying ? t('pause') : t('play')} 
        positioning={{ placement: 'top' }}
        disabled={disabled}
      >
        <IconButton
          aria-label={isPlaying ? t('pause') : t('play')}
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled}
          size="lg"
          variant="subtle"
          colorPalette="green"
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </IconButton>
      </Tooltip>

      <Tooltip 
        content={t('nextWord')} 
        positioning={{ placement: 'top' }}
        disabled={disabled}
      >
        <IconButton
          aria-label={t('nextWord')}
          onClick={onNextWord}
          disabled={disabled}
          size="md"
          variant="ghost"
        >
          <FaStepForward />
        </IconButton>
      </Tooltip>

      <Tooltip 
        content={t('nextSentence')} 
        positioning={{ placement: 'top' }}
        disabled={disabled}
      >
        <IconButton
          aria-label={t('nextSentence')}
          onClick={onNextSentence}
          disabled={disabled}
          size="md"
          variant="ghost"
        >
          <FaFastForward />
        </IconButton>
      </Tooltip>
    </HStack>
  );
}
