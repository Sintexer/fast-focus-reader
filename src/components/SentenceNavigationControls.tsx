import { HStack, Button, Box, Icon } from '@chakra-ui/react';
import { FaRedo, FaArrowRight } from 'react-icons/fa';

export interface SentenceNavigationControlsProps {
  onRestart: () => void;
  onNext: () => void;
  isNextEnabled: boolean;
}

/**
 * Big buttons for sentence navigation: Restart and Next
 * Next button is only enabled when stopped at sentence end
 */
export function SentenceNavigationControls({
  onRestart,
  onNext,
  isNextEnabled,
}: SentenceNavigationControlsProps) {
  return (
    <Box p={4}>
      <HStack gap={4} justify="center">
        <Button
          size="lg"
          colorPalette="blue"
          onClick={onRestart}
          minW="150px"
          h="60px"
          fontSize="lg"
          fontWeight="bold"
        >
          <Icon size="inherit">
            <FaRedo />
          </Icon>
          Restart
        </Button>
        
        <Button
          size="lg"
          colorPalette="green"
          onClick={onNext}
          disabled={!isNextEnabled}
          minW="150px"
          h="60px"
          fontSize="lg"
          fontWeight="bold"
        >
          <Icon size="inherit">
            <FaArrowRight />
          </Icon>
          Next
        </Button>
      </HStack>
    </Box>
  );
}
