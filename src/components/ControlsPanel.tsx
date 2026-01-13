import { HStack, Box } from '@chakra-ui/react';
import { ControlButton } from './ControlButton';

interface ControlsPanelProps {
  onPrevSentenceStart: () => void;
  onNextSentence: () => void;
  onToggleFullSentence: () => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
  isAtEnd: boolean;
}

export function ControlsPanel({
  onPrevSentenceStart,
  onNextSentence,
  onToggleFullSentence,
  onTogglePlay,
  isPlaying,
  isAtEnd,
}: ControlsPanelProps) {
  return (
    <Box p={4}>
      <HStack gap={3} justifyContent="center">
        <ControlButton
          label="Prev"
          shortcut={['←']}
          onClick={onPrevSentenceStart}
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
          disabled={isAtEnd}
        />
      </HStack>
    </Box>
  );
}
