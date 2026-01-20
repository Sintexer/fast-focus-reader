import { HStack, Text, Icon, Box } from '@chakra-ui/react';
import type { Book } from '../utils/db';
import { BsCardList } from 'react-icons/bs';

export interface ReaderHeaderProps {
  book: Book | null;
  volumeId: string;
  chapterId: string;
  onToggleTOC?: () => void;
}

/**
 * Header component for the reader
 * Displays book location (chapter title) and TOC toggle
 * Autonomous component with its own padding
 */
export function ReaderHeader({
  book,
  volumeId,
  chapterId,
  onToggleTOC,
}: ReaderHeaderProps) {
  if (!book) return null;

  const volume = book.structure.volumes.find(v => v.id === volumeId);
  const chapter = volume?.chapters.find(c => c.id === chapterId);

  return (
    <Box p={2} w="100%">
      <HStack justifyContent="flex-end" alignItems="center" w="100%">
        <Box
          onClick={onToggleTOC}
          cursor={onToggleTOC ? "pointer" : "default"}
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
        >
          <HStack
            gap={2}
            fontSize="sm"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            opacity={0.6}
            _hover={{ opacity: onToggleTOC ? 0.9 : 0.6 }}
            transition="opacity 0.2s"
            justifyContent="flex-end"
            alignItems="center"
          >
            {chapter && (
              <Text 
                fontWeight="medium" 
                overflow="hidden" 
                textOverflow="ellipsis" 
                whiteSpace="nowrap"
                maxW="100%"
              >
                {chapter.title}
              </Text>
            )}
            <Icon as={BsCardList} fontSize="sm" flexShrink={0} />
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
}
