import { Box, Text, HStack, IconButton } from '@chakra-ui/react';
import { BsFileText } from 'react-icons/bs';
import { Tooltip } from '../ui/tooltip';
import type { PlaybackStateInfoProps } from './types';

/**
 * Component that displays playback state information
 * Shows sentence number and WPM with a toggle button for chapter view
 */
export function PlaybackStateInfo({
  currentSentenceIndex,
  maxSentenceIndex,
  wpm,
  showChapterView = false,
  onToggleChapterView,
}: PlaybackStateInfoProps) {
  return (
    <Box w="100%" p={2}>
      <HStack justifyContent="center" alignItems="center" gap={3} position="relative">
        {/* Toggle button for chapter view - positioned on the left */}
        {onToggleChapterView && (
          <Box position="absolute" left={0}>
            <Tooltip content={showChapterView ? 'Hide chapter view (T)' : 'Show chapter view (T)'}>
              <IconButton
                aria-label={showChapterView ? 'Hide chapter view' : 'Show chapter view'}
                onClick={onToggleChapterView}
                size="xs"
                variant="ghost"
                colorPalette="gray"
                minW="auto"
                h="auto"
                p={1}
                opacity={showChapterView ? 1 : 0.4}
                _hover={{ opacity: 1 }}
              >
                <BsFileText />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        
        {/* Centered text with dot divider - centered regardless of button */}
        <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} textAlign="center">
          Sentence {currentSentenceIndex + 1} of {maxSentenceIndex + 1} • {wpm} WPM
        </Text>
      </HStack>
    </Box>
  );
}
