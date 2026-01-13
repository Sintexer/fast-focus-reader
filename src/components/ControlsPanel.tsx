import { HStack, Box } from '@chakra-ui/react';
import { ControlButton } from './ControlButton';

interface ControlsPanelProps {
  onPrevWord: () => void;
  onNextSentence: () => void;
  onToggleFullSentence: () => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
}

export function ControlsPanel({
  onPrevWord,
  onNextSentence,
  onToggleFullSentence,
  onTogglePlay,
  isPlaying,
}: ControlsPanelProps) {
  return (
    <Box p={4}>
      <HStack gap={3} justifyContent="center">
        <ControlButton
          label="Prev"
          shortcut={['←']}
          onClick={onPrevWord}
        />

        <ControlButton
          label="Next"
          shortcut={['→']}
          onClick={onNextSentence}
        />

        <ControlButton
          label="Show Sentence"
          shortcut={['Space']}
          onClick={onToggleFullSentence}
        />

        <ControlButton
          label={isPlaying ? 'Pause' : 'Play'}
          shortcut={['Enter']}
          onClick={onTogglePlay}
        />
      </HStack>
    </Box>
  );
}
