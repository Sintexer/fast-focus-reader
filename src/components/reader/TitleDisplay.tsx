import { Heading, VStack } from '@chakra-ui/react';

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
    <VStack
      w="100%"
      minH="7.5rem"
      py={8}
    >

              <Heading
                as="h2"
                size={isVolume ? "2xl" : "2xl"}
                fontWeight="semibold"
                textAlign="center"
                color="gray.900"
                _dark={{ color: 'gray.100' }}
                lineHeight="1.3"
                textTransform={isVolume ? "uppercase" : "none"}
              >
                {title}
              </Heading>
    </VStack>
  );
}
