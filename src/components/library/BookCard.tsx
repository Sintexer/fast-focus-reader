import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { BsBook } from 'react-icons/bs';
import type { Book } from '../../utils/db';
import { useI18n } from '../../i18n/useI18n';

export interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const chapterCount = book.structure.volumes.reduce(
    (sum, vol) => sum + vol.chapters.length,
    0
  );

  return (
    <Box
      w="100%"
      h="100%"
      bg="gray.100"
      _dark={{ bg: 'gray.700' }}
      borderRadius="md"
      borderWidth="2px"
      borderColor="gray.300"
      _dark={{ borderColor: 'gray.600' }}
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      onClick={() => navigate(`/book/${book.id}/details`)}
      transition="all 0.2s"
      _hover={{
        boxShadow: 'xl',
        transform: 'translateY(-4px)',
      }}
      boxShadow="md"
    >
      {/* Background gradient */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bgGradient="to-b"
              gradientFrom="gray.50"
              gradientTo="gray.100"
              _dark={{ gradientFrom: 'gray.800', gradientTo: 'gray.700' }}
              opacity={0.5}
            />

      {/* Content */}
      <Flex
        flex="1"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        p={3}
        zIndex={1}
        position="relative"
      >
        {/* Top: Book icon */}
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <BsBook size={32} />
        </Box>

        {/* Bottom: Title and author */}
        <VStack
          align="stretch"
          gap={1}
          w="100%"
          flex="0 0 auto"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            lineHeight="1.2"
            lineClamp={2}
            textAlign="center"
            color="gray.800"
            _dark={{ color: 'gray.100' }}
          >
            {book.title}
          </Text>
          {book.author && (
            <Text
              fontSize="2xs"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              lineClamp={1}
              textAlign="center"
            >
              {book.author}
            </Text>
          )}
        </VStack>
      </Flex>

      {/* Spine effect on the left */}
      <Box
        position="absolute"
        left="0"
        top="0"
        bottom="0"
        w="4px"
        bg="gray.400"
        _dark={{ bg: 'gray.500' }}
        opacity={0.5}
      />
    </Box>
  );
}
