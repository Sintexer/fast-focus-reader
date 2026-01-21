import { SimpleGrid, Flex } from '@chakra-ui/react';
import type { Book } from '../../utils/db';
import { BookCard } from './BookCard';

export interface BookGridProps {
  books: Book[];
}

export function BookGrid({ books }: BookGridProps) {
  return (
    <Flex justifyContent="center" w="100%">
      <SimpleGrid 
        columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} 
        gap={6}
        w="100%"
        maxW="100%"
      >
        {books.map((book) => (
          <Flex key={book.id} justifyContent="center">
            <BookCard book={book} />
          </Flex>
        ))}
      </SimpleGrid>
    </Flex>
  );
}
