import { Box } from '@chakra-ui/react';

export interface ReadingProgressProps {
  currentSentenceIndex: number;
  totalSentences: number;
}

export function ReadingProgress({
  currentSentenceIndex,
  totalSentences,
}: ReadingProgressProps) {
  if (totalSentences === 0) return null;

  // For many sentences, show a condensed progress bar
  const progress = ((currentSentenceIndex + 1) / totalSentences) * 100;

  return (
    <Box
      py={2}
      px={4}
      display="flex"
      justifyContent="center"
      alignItems="center"
      opacity={0.4}
      _hover={{ opacity: 0.7 }}
      transition="opacity 0.2s"
    >
      <Box
        w="120px"
        h="2px"
        bg="gray.200"
        _dark={{ bg: 'gray.700' }}
        borderRadius="full"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          left="0"
          top="0"
          h="100%"
          w={`${progress}%`}
          bg="blue.500"
          _dark={{ bg: 'blue.400' }}
          borderRadius="full"
          transition="width 0.3s"
        />
      </Box>
    </Box>
  );
}
