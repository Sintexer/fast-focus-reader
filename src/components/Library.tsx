import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, VStack, HStack, Text, Button, SimpleGrid } from '@chakra-ui/react';
import { getAllBooks, saveBook, type Book } from '../utils/db';

// Sample texts for testing
const SAMPLE_TEXT_1 = `The quick brown fox jumps over the lazy dog. This is a sample text for testing the RSVP reader. Each word appears one at a time, centered on the screen. The middle vowel of each word is highlighted in a theme color. You can control the reading speed with the WPM slider.`;

const SAMPLE_TEXT_2 = `In a distant galaxy, explorers discovered an ancient civilization. The ruins told stories of advanced technology and mysterious disappearances. Scientists worked tirelessly to decode the secrets hidden within the stone tablets. Every discovery brought new questions and deeper mysteries.`;

const SAMPLE_TEXT_3 = `The journey begins with a single step! Is it true? Adventure awaits those who dare to explore.`;

export function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = async () => {
    const loadedBooks = await getAllBooks();
    
    // Initialize sample books if they don't exist
    if (loadedBooks.length === 0) {
      const book1: Book = {
        id: 'sample-1',
        title: 'Sample Book',
        language: 'en',
        structure: {
          volumes: [
            {
              id: 'vol-1',
              title: '',
              chapters: [
                {
                  id: 'ch-1',
                  title: 'Chapter 1',
                  content: SAMPLE_TEXT_1,
                },
              ],
            },
          ],
        },
        createdAt: Date.now(),
      };

      const book2: Book = {
        id: 'sample-2',
        title: 'Space Explorers',
        author: 'Test Author',
        language: 'en',
        structure: {
          volumes: [
            {
              id: 'vol-1',
              title: '',
              chapters: [
                {
                  id: 'ch-1',
                  title: 'Discovery',
                  content: SAMPLE_TEXT_2,
                },
              ],
            },
          ],
        },
        createdAt: Date.now(),
      };

      const book3: Book = {
        id: 'sample-3',
        title: 'The Great Adventure',
        author: 'Epic Writer',
        language: 'en',
        structure: {
          volumes: [
            {
              id: 'vol-1',
              title: 'Volume I: The Beginning',
              chapters: [
                {
                  id: 'ch-1',
                  title: 'Chapter 1: The Call',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-2',
                  title: 'Chapter 2: The Journey Starts',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-3',
                  title: 'Chapter 3: First Challenges',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-4',
                  title: 'Chapter 4: New Allies',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-5',
                  title: 'Chapter 5: The First Victory',
                  content: SAMPLE_TEXT_3,
                },
              ],
            },
            {
              id: 'vol-2',
              title: 'Volume II: The Middle',
              chapters: [
                {
                  id: 'ch-6',
                  title: 'Chapter 6: Deeper Into the Unknown',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-7',
                  title: 'Chapter 7: Trials and Tribulations',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-8',
                  title: 'Chapter 8: The Darkest Hour',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-9',
                  title: 'Chapter 9: A Glimmer of Hope',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-10',
                  title: 'Chapter 10: Rising from the Ashes',
                  content: SAMPLE_TEXT_3,
                },
              ],
            },
            {
              id: 'vol-3',
              title: 'Volume III: The End',
              chapters: [
                {
                  id: 'ch-11',
                  title: 'Chapter 11: The Final Battle',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-12',
                  title: 'Chapter 12: Resolution',
                  content: SAMPLE_TEXT_3,
                },
                {
                  id: 'ch-13',
                  title: 'Chapter 13: New Beginnings',
                  content: SAMPLE_TEXT_3,
                },
              ],
            },
          ],
        },
        createdAt: Date.now(),
      };

      await saveBook(book1);
      await saveBook(book2);
      await saveBook(book3);
      
      // Reload books after saving
      const updatedBooks = await getAllBooks();
      setBooks(updatedBooks);
    } else {
      setBooks(loadedBooks);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading books...</Text>
      </Container>
    );
  }

  if (books.length === 0) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>No books available. Please add a book to get started.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" gap={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Library
        </Text>
        
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
          {books.map((book) => (
            <Box
              key={book.id}
              p={6}
              borderWidth="1px"
              borderRadius="md"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700' }}
              bg="white"
              _dark={{ bg: 'gray.800' }}
              _hover={{
                borderColor: 'blue.500',
                _dark: { borderColor: 'blue.400' },
                boxShadow: 'md',
              }}
              cursor="pointer"
              onClick={() => navigate(`/book/${book.id}`)}
              transition="all 0.2s"
            >
              <VStack align="stretch" gap={2}>
                <Text fontSize="lg" fontWeight="semibold" lineClamp={2}>
                  {book.title}
                </Text>
                {book.author && (
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} lineClamp={1}>
                    {book.author}
                  </Text>
                )}
                <HStack gap={2} fontSize="xs" color="gray.500" _dark={{ color: 'gray.500' }}>
                  <Text>
                    {book.structure.volumes.reduce((sum, vol) => sum + vol.chapters.length, 0)} chapters
                  </Text>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
