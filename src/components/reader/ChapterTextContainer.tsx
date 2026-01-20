import { Box } from '@chakra-ui/react';
import { useRef } from 'react';
import { ChapterTextView } from './ChapterTextView';
import type { ChapterTextViewProps } from './types';

/**
 * Container component for chapter text display
 * Provides the scrollable box styling and layout
 */
export function ChapterTextContainer(props: ChapterTextViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={scrollContainerRef}
      w="100%"
      flex="1"
      minH="200px"
      maxH="300px"
      p={4}
      bg="gray.50"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.200"
      overflowY="auto"
    >
      <ChapterTextView {...props} scrollContainerRef={scrollContainerRef} />
    </Box>
  );
}
