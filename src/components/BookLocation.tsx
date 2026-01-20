import { HStack, Text, Icon, Box } from '@chakra-ui/react';
import type { Book } from '../utils/db';
import { BsCardList } from 'react-icons/bs';

export interface BookLocationProps {
  book: Book | null;
  volumeId: string;
  chapterId: string;
}

export function BookLocation({
  book,
  volumeId,
  chapterId,
}: BookLocationProps) {
  if (!book) return null;

  const volume = book.structure.volumes.find(v => v.id === volumeId);
  const chapter = volume?.chapters.find(c => c.id === chapterId);

  return (
    <HStack
      gap={2}
      fontSize="sm"
      color="gray.600"
      _dark={{ color: 'gray.400' }}
      opacity={0.6}
      _hover={{ opacity: 0.9 }}
      transition="opacity 0.2s"
      maxW="100%"
    >
      {chapter && (
        <Box
          flex="1"
          minW={0}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          <Text fontWeight="medium" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            {chapter.title}
          </Text>
        </Box>
      )}
      <Icon as={BsCardList} fontSize="sm" flexShrink={0} />
    </HStack>
  );
}
