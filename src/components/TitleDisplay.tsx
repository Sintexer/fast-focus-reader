import { Box, Text } from '@chakra-ui/react';

export interface TitleDisplayProps {
  title: string;
  fontSize?: { base?: string; md?: string; lg?: string; xl?: string } | string;
}

export function TitleDisplay({ title, fontSize }: TitleDisplayProps) {
  const fontSizeValue = typeof fontSize === 'string' 
    ? fontSize 
    : fontSize || { base: "2xl", md: "3xl", lg: "4xl", xl: "5xl" };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      px={4}
    >
      <Text
        fontSize={fontSizeValue}
        fontWeight="medium"
        color="gray.700"
        _dark={{ color: 'gray.300' }}
        lineHeight="1.4"
      >
        {title}
      </Text>
    </Box>
  );
}
