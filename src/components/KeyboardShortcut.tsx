import { Box, Text } from '@chakra-ui/react';

export interface KeyboardShortcutProps {
  keys: string[];
  size?: 'sm' | 'md' | 'lg';
}

export function KeyboardShortcut({ keys, size = 'sm' }: KeyboardShortcutProps) {
  const fontSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md';
  const px = size === 'sm' ? 1.5 : size === 'md' ? 2 : 2.5;
  const py = size === 'sm' ? 0.5 : size === 'md' ? 1 : 1.5;
  const minWidth = size === 'sm' ? '20px' : size === 'md' ? '24px' : '28px';

  return (
    <Box display="inline-flex" gap="2px" alignItems="center">
      {keys.map((key, index) => (
        <Box
          key={index}
          as="kbd"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          minW={minWidth}
          h="fit-content"
          px={px}
          py={py}
          fontSize={fontSize}
          fontWeight="semibold"
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          borderWidth="1px"
          borderColor="gray.300"
          _dark={{ borderColor: 'gray.600' }}
          borderRadius="md"
          boxShadow="sm"
          fontFamily="mono"
        >
          {key}
        </Box>
      ))}
    </Box>
  );
}
