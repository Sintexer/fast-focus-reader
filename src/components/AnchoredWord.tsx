import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Text, type TextProps } from '@chakra-ui/react';

export interface AnchoredWordProps {
  firstPart: string;
  middleLetter: string;
  secondPart: string;
  fontSize?: TextProps['fontSize'];
  middleLetterColor?: string;
  middleLetterWeight?: TextProps['fontWeight'];
  punctuation?: string;
  showPunctuationAbove?: string;
}

export function AnchoredWord({
  firstPart,
  middleLetter,
  secondPart,
  fontSize,
  middleLetterColor = 'blue.500',
  middleLetterWeight = 'bold',
  punctuation,
  showPunctuationAbove,
}: AnchoredWordProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [leftShift, setLeftShift] = useState(0);

  const fullWord = firstPart + middleLetter + secondPart;

  useLayoutEffect(() => {
    // Measure pixel width of "firstPart" using same font styles
    const leftWidth = measureRef.current?.getBoundingClientRect().width ?? 0;
    setLeftShift(leftWidth);
  }, [firstPart, fontSize]);

  return (
    <Box
      ref={containerRef}
      position="relative"
      display="inline-block"
      whiteSpace="nowrap"
      fontSize={fontSize}
    >
      {/* Hidden measurer with identical styling */}
      <Box
        ref={measureRef}
        as="span"
        position="absolute"
        visibility="hidden"
        whiteSpace="pre"
        pointerEvents="none"
        fontSize={fontSize}
      >
        {firstPart}
      </Box>

      {/* Punctuation indicator on the right (for ! or ? context) */}
      {showPunctuationAbove && (
        <Box
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(calc(50% + 0.3em), -50%)"
          pointerEvents="none"
          fontSize="0.4em"
          opacity={0.25}
          color="gray.500"
          _dark={{ color: 'gray.400' }}
          fontWeight="300"
          lineHeight="1"
        >
          {showPunctuationAbove}
        </Box>
      )}

      {/* Crosshair lines above and below middle letter */}
      {/* Line above */}
      <Box
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, calc(-50% - 0.6em))"
        w="1px"
        h="0.4em"
        bg="gray.400"
        _dark={{ bg: 'gray.500' }}
        pointerEvents="none"
      />
      {/* Line below */}
      <Box
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, calc(-50% + 0.6em))"
        w="1px"
        h="0.4em"
        bg="gray.400"
        _dark={{ bg: 'gray.500' }}
        pointerEvents="none"
      />

      {/* Visible word: anchor point fixed at 50% of container */}
      <Box
        as="span"
        position="absolute"
        left="50%"
        transform={`translateX(${-leftShift}px)`}
        whiteSpace="nowrap"
        fontSize={fontSize}
      >
        <Text as="span">{firstPart}</Text>
        <Text as="span" color={middleLetterColor} fontWeight={middleLetterWeight}>
          {middleLetter}
        </Text>
        <Text as="span">{secondPart}</Text>
        {punctuation && (
          <Text as="span" fontSize={fontSize} opacity={0.8}>
            {punctuation}
          </Text>
        )}
      </Box>

      {/* Zero-width placeholder to reserve space and prevent layout shift */}
      <Text as="span" visibility="hidden" fontSize={fontSize}>
        {fullWord}
      </Text>
    </Box>
  );
}
