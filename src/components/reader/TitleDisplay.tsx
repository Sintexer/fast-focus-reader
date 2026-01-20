import { Box, Heading, Text } from '@chakra-ui/react';

export interface TitleDisplayProps {
  title: string;
  type: 'volume' | 'chapter';
}

/**
 * Component that displays volume or chapter titles with special styling
 * Used instead of word display when navigating to new volumes/chapters
 */
export function TitleDisplay({ title, type }: TitleDisplayProps) {
  const isVolume = type === 'volume';
  
  return (
    <Box
      w="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minH="7.5rem"
      px={6}
      py={8}
    >
      <Text
        fontSize="sm"
        fontWeight="medium"
        color="gray.500"
        _dark={{ color: 'gray.400' }}
        textTransform="uppercase"
        letterSpacing="wide"
        mb={2}
      >
        {isVolume ? 'Volume' : 'Chapter'}
      </Text>
      <Heading
        as="h2"
        size={isVolume ? "xl" : "lg"}
        fontWeight="semibold"
        textAlign="center"
        color="gray.900"
        _dark={{ color: 'gray.100' }}
        lineHeight="1.3"
        maxW="90%"
      >
        {title}
      </Heading>
    </Box>
  );
}
