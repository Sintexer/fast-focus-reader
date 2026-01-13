import { Box, HStack, Text, IconButton, Mark } from '@chakra-ui/react';

export interface SentenceDisplayProps {
  sentence: string[];
  currentWordIndex: number;
  isVisible: boolean;
  onClose: () => void;
}

export function SentenceDisplay({
  sentence,
  currentWordIndex,
  isVisible,
  onClose,
}: SentenceDisplayProps) {
  if (!isVisible || sentence.length === 0) return null;

  return (
    <Box
      w="100%"
      maxW="800px"
      minH="60px"
      maxH="120px"
      p={3}
      mb={4}
      bg="gray.50"
      _dark={{ bg: 'gray.800' }}
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.200"
      _dark={{ borderColor: 'gray.700' }}
      position="relative"
      overflowY="auto"
    >
      <HStack justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
          Current Sentence
        </Text>
        <IconButton
          aria-label="Close sentence view"
          size="xs"
          variant="ghost"
          onClick={onClose}
          minW="auto"
          h="auto"
          p={1}
        >
          ✕
        </IconButton>
      </HStack>
      <Text fontSize="xs" lineHeight="1.6" color="gray.700" _dark={{ color: 'gray.300' }}>
        {sentence.map((word, index) => {
          const isCurrentWord = index === currentWordIndex;
          return (
            <Box key={index} as="span">
              {isCurrentWord ? (
                <Mark
                  px="0.5"
                  bg="blue.100"
                  color="blue.700"
                  fontWeight="semibold"
                  _dark={{
                    bg: 'blue.900',
                    color: 'blue.300',
                  }}
                >
                  {word}
                </Mark>
              ) : (
                <Box as="span">{word}</Box>
              )}
              {index < sentence.length - 1 && <Box as="span"> </Box>}
            </Box>
          );
        })}
      </Text>
    </Box>
  );
}
