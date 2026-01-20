import { Box } from '@chakra-ui/react';
import { AnchoredWordDisplay } from '../AnchoredWordDisplay';
import type { CurrentWordDisplayProps } from './types';

/**
 * Component that displays the current word centered with anchored letter highlighting
 * Includes a horizontal line
 */
export function CurrentWordDisplay({
  word,
}: CurrentWordDisplayProps) {
  return (
    <Box
      w="100%"
      p={6}
      borderTopWidth="1px"
      borderBottomWidth="1px"
      borderTopColor="gray.200"
      borderBottomColor="gray.200"
      _dark={{ 
        borderTopColor: 'gray.700',
        borderBottomColor: 'gray.700'
      }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="7.5rem"
      position="relative"
    >
      <Box
        position="absolute"
        left="0"
        right="0"
        top="50%"
        transform="translateY(-50%)"
        h="1px"
        bgGradient="linear(to-r, transparent, gray.300, gray.300, transparent)"
        _dark={{
          bgGradient: 'linear(to-r, transparent, gray.600, gray.600, transparent)',
        }}
        pointerEvents="none"
      />
      <AnchoredWordDisplay
        word={word}
        fontSize="2xl"
        middleLetterColor="red.500"
        punctuationColor="orange.500"
        middleLetterWeight="bold"
      />
    </Box>
  );
}
