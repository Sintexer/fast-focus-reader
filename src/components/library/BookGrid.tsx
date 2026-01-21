import { SimpleGrid } from '@chakra-ui/react';
import type { Book } from '../../utils/db';
import { BookCard } from './BookCard';
import { AddBookCard } from './AddBookCard';

export interface BookGridProps {
  books: Book[];
  onAddBook: () => void;
}

export function BookGrid({ books, onAddBook }: BookGridProps) {
  return (
    <SimpleGrid 
      columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} 
      columnGap={6}
      rowGap={6}
      w="100%"
      p={2}
    >
      {/* Add Book Card - always first */}
      <AddBookCard onClick={onAddBook} />
      
      {/* Regular book cards */}
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </SimpleGrid>
  );
}
