import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Text, type TextProps } from '@chakra-ui/react';

export interface AnchoredWordDisplayProps {
  word: string;
  fontSize?: TextProps['fontSize'];
  middleLetterColor?: string;
  punctuationColor?: string;
  middleLetterWeight?: TextProps['fontWeight'];
}

/**
 * Component that displays a word centered around its middle letter.
 * Highlights the middle (anchor) letter and any punctuation characters.
 */
export function AnchoredWordDisplay({
  word,
  fontSize = '2xl',
  middleLetterColor = 'red.500',
  punctuationColor = 'orange.500',
  middleLetterWeight = 'bold',
}: AnchoredWordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [leftShift, setLeftShift] = useState(0);

  // Find the middle letter index (for odd-length words, it's the center; for even, use left of center)
  const getMiddleLetterIndex = (text: string): number => {
    if (text.length === 0) return 0;
    // Find the first letter character from the middle, searching outward
    const mid = Math.floor((text.length - 1) / 2);
    
    // Look for a letter character near the middle, searching outward in both directions
    for (let offset = 0; offset < text.length; offset++) {
      // Check left side first (closer to center for even-length words)
      const leftIdx = mid - offset;
      if (leftIdx >= 0 && /[a-zA-Zа-яА-ЯёЁ]/.test(text[leftIdx])) {
        return leftIdx;
      }
      // Then check right side
      const rightIdx = mid + offset;
      if (rightIdx < text.length && /[a-zA-Zа-яА-ЯёЁ]/.test(text[rightIdx])) {
        return rightIdx;
      }
    }
    // Fallback: return middle index if no letter found
    return mid;
  };

  const middleIndex = getMiddleLetterIndex(word);
  const firstPart = word.slice(0, middleIndex);
  const middleLetter = word[middleIndex] || '';
  const secondPart = word.slice(middleIndex + 1);

  // Check if a character is a letter
  const isLetter = (char: string): boolean => {
    return /[a-zA-Zа-яА-ЯёЁ]/.test(char);
  };

  // Check if a character is punctuation
  const isPunctuation = (char: string): boolean => {
    return !isLetter(char) && char.trim() !== '';
  };

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
      w="100%"
      textAlign="center"
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
        {/* Render first part with punctuation highlighting */}
        {firstPart.split('').map((char, idx) => (
          <Text
            key={`first-${idx}`}
            as="span"
            color={isPunctuation(char) ? punctuationColor : undefined}
          >
            {char}
          </Text>
        ))}
        
        {/* Middle letter with special highlighting */}
        <Text
          as="span"
          color={middleLetterColor}
          fontWeight={middleLetterWeight}
        >
          {middleLetter}
        </Text>
        
        {/* Render second part with punctuation highlighting */}
        {secondPart.split('').map((char, idx) => (
          <Text
            key={`second-${idx}`}
            as="span"
            color={isPunctuation(char) ? punctuationColor : undefined}
          >
            {char}
          </Text>
        ))}
      </Box>

      {/* Zero-width placeholder to reserve space and prevent layout shift */}
      <Text as="span" visibility="hidden" fontSize={fontSize}>
        {word}
      </Text>
    </Box>
  );
}
