import { Box, Text, HStack, Flex, IconButton } from '@chakra-ui/react';
import { BsFileText, BsGear } from 'react-icons/bs';
import { Tooltip } from '../ui/tooltip';

export interface ReaderFooterProps {
  currentSentenceIndex: number;
  maxSentenceIndex: number;
  wpm: number;
  showChapterView?: boolean;
  onToggleChapterView?: () => void;
  onOpenSettings?: () => void;
}

/**
 * Footer component for the reader
 * Displays playback state information (sentence number, WPM) with toggle buttons
 * Autonomous component with its own padding
 */
export function ReaderFooter({
  currentSentenceIndex,
  maxSentenceIndex,
  wpm,
  showChapterView = false,
  onToggleChapterView,
  onOpenSettings,
}: ReaderFooterProps) {
  return (
    <Box w="100%" py={2} px={2}>
      <HStack justifyContent="center" alignItems="center" gap={2} w="100%">
        {/* Left flex: space-between with chapter toggle and sentence number */}
        <Flex flex="1" justifyContent="space-between" alignItems="center" gap={2}>
          {/* Toggle button for chapter view */}
          {onToggleChapterView && (
            <Tooltip content={showChapterView ? 'Hide chapter view (T)' : 'Show chapter view (T)'}>
              <IconButton
                aria-label={showChapterView ? 'Hide chapter view' : 'Show chapter view'}
                onClick={onToggleChapterView}
                size="xs"
                variant="ghost"
                colorPalette="gray"
                minW="auto"
                h="auto"
                p={0}
                opacity={showChapterView ? 1 : 0.4}
                _hover={{ opacity: 1 }}
              >
                <BsFileText />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Sentence number */}
          <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
            Sentence {currentSentenceIndex + 1} of {maxSentenceIndex + 1}
          </Text>
        </Flex>

        {/* Middle div: dot divider */}
        <Box fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} px={1}>
          •
        </Box>

        {/* Right flex: WPM and settings button */}
        <Flex flex="1" justifyContent="space-between" alignItems="center" gap={2}>
          {/* WPM */}
          <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
            Speed: {wpm} WPM
          </Text>

          {/* Settings button */}
          {onOpenSettings && (
            <Tooltip content="Open settings">
              <IconButton
                aria-label="Open settings"
                onClick={onOpenSettings}
                size="xs"
                variant="ghost"
                colorPalette="gray"
                minW="auto"
                h="auto"
                p={0}
                opacity={0.4}
                _hover={{ opacity: 1 }}
              >
                <BsGear />
              </IconButton>
            </Tooltip>
          )}
        </Flex>
      </HStack>
    </Box>
  );
}
