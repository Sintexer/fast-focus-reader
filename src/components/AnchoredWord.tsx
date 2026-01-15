import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Text, type TextProps } from '@chakra-ui/react';

export interface AnchoredWordProps {
  firstPart: string;
  middleLetter: string;
  secondPart: string;
  fontSize?: TextProps['fontSize'];
  middleLetterColor?: string;
  middleLetterWeight?: TextProps['fontWeight'];
  endingPunctuation: string; // Ending punctuation of the sentence
  inQuotes: boolean; // Are we inside quotes?
  inBrackets: boolean; // Are we inside brackets?
}

export function AnchoredWord({
  firstPart,
  middleLetter,
  secondPart,
  fontSize,
  middleLetterColor = 'blue.500',
  middleLetterWeight = 'bold',
  endingPunctuation,
  inQuotes,
  inBrackets,
}: AnchoredWordProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [leftShift, setLeftShift] = useState(0);
  const [wordWidth, setWordWidth] = useState(0);

  const fullWord = firstPart + middleLetter + secondPart;
  
  // Determine character to display to the right
  let rightChar = '';
  if (endingPunctuation) {
    rightChar = endingPunctuation;
  } else if (inQuotes) {
    rightChar = '"';
  } else if (inBrackets) {
    rightChar = ')';
  }

  useLayoutEffect(() => {
    // Measure pixel width of "firstPart" using same font styles
    const leftWidth = measureRef.current?.getBoundingClientRect().width ?? 0;
    setLeftShift(leftWidth);
    
    // Measure full word width
    const width = wordRef.current?.getBoundingClientRect().width ?? 0;
    setWordWidth(width);
  }, [firstPart, middleLetter, secondPart, fontSize]);

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
        ref={wordRef}
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
      </Box>

      {/* Character indicator to the right of the word */}
      {rightChar && (
        <Text
          as="span"
          position="absolute"
          left={`calc(50% + ${leftShift}px + ${wordWidth}px)`}
          fontSize="0.6em"
          opacity={0.5}
          color="gray.600"
          _dark={{ color: 'gray.400' }}
          pointerEvents="none"
          ml="0.2em"
        >
          {rightChar}
        </Text>
      )}

      {/* Zero-width placeholder to reserve space and prevent layout shift */}
      <Text as="span" visibility="hidden" fontSize={fontSize}>
        {fullWord}
      </Text>
    </Box>
  );
}
