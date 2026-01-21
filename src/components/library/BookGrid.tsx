import { SimpleGrid, AspectRatio } from '@chakra-ui/react';
import type { Book } from '../../utils/db';
import { BookCard } from './BookCard';
import { AddBookCard } from './AddBookCard';

export interface BookGridProps {
  books: Book[];
  onAddBook: () => void;
}

export function BookGrid({ books, onAddBook }: BookGridProps) {
  // Book card aspect ratio: 140px width / 200px height = 0.7
  const bookAspectRatio = 140 / 200;

  return (
    <SimpleGrid 
      columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} 
      columnGap={6}
      rowGap={6}
      w="100%"
      p={2}
    >
      {/* Add Book Card - always first */}
      <AspectRatio ratio={bookAspectRatio}>
        <AddBookCard onClick={onAddBook} />
      </AspectRatio>
      
      {/* Regular book cards */}
      {books.map((book) => (
        <AspectRatio key={book.id} ratio={bookAspectRatio}>
          <BookCard book={book} />
        </AspectRatio>
      ))}
    </SimpleGrid>
  );
}
