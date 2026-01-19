import { HStack, Text, Icon } from '@chakra-ui/react';
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

  // Check if book has real volumes (not just a single mock volume)
  const hasRealVolumes = book.structure.volumes.length > 1 || 
    (book.structure.volumes.length === 1 && book.structure.volumes[0].title !== '');

  return (
    <HStack
      gap={2}
      fontSize="sm"
      color="gray.600"
      _dark={{ color: 'gray.400' }}
      opacity={0.6}
      _hover={{ opacity: 0.9 }}
      transition="opacity 0.2s"
    >
      {hasRealVolumes && volume && (
        <>
          <Text fontWeight="medium">{volume.title}</Text>
          <Text>•</Text>
        </>
      )}
      {chapter && (
        <Text fontWeight="medium">{chapter.title}</Text>
      )}
      <Icon as={BsCardList} fontSize="sm" />
    </HStack>
  );
}
