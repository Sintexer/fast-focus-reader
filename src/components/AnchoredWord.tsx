import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Text, type TextProps } from '@chakra-ui/react';

export interface AnchoredWordProps {
  firstPart: string;
  middleLetter: string;
  secondPart: string;
  fontSize?: TextProps['fontSize'];
  middleLetterColor?: string;
  middleLetterWeight?: TextProps['fontWeight'];
  punctuation?: string; // End-of-sentence punctuation
  punctuationBefore?: string; // Opening quotes, brackets before word
  punctuationAfter?: string; // Commas, semicolons, closing brackets after word
  inDialog?: boolean; // Show dialog indicator (for subtle quote display)
  inBrackets?: boolean; // Show bracket indicator (for subtle bracket display)
}

export function AnchoredWord({
  firstPart,
  middleLetter,
  secondPart,
  fontSize,
  middleLetterColor = 'blue.500',
  middleLetterWeight = 'bold',
  punctuation,
  punctuationBefore,
  punctuationAfter,
  inDialog,
  inBrackets,
}: AnchoredWordProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [leftShift, setLeftShift] = useState(0);

  const fullWord = firstPart + middleLetter + secondPart;
  
  // For quotes and brackets: show subtly if inDialog/inBrackets
  // If they're already in punctuationBefore/After, they'll be shown there subtly
  // If not, show them separately
  const hasQuoteInBefore = punctuationBefore?.match(/[""'«»]/);
  const hasBracketInBefore = punctuationBefore?.match(/[\(\[\{]/);
  const showQuoteLeft = inDialog && !hasQuoteInBefore;
  const showBracketLeft = inBrackets && !hasBracketInBefore;
  
  // Calculate full width including punctuation for placeholder
  const leftPunct = (punctuationBefore || '') + (showQuoteLeft ? '"' : '') + (showBracketLeft ? '(' : '');
  const rightPunct = (punctuationAfter || '') + (punctuation || '');
  const fullDisplayText = leftPunct + fullWord + rightPunct;

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
        {/* Subtle punctuation before word */}
        {punctuationBefore && (
          <Text as="span" fontSize="0.6em" opacity={0.4} color="gray.700" _dark={{ color: 'gray.400' }}>
            {punctuationBefore}
          </Text>
        )}
        {/* Subtle quote indicator if in dialog but not already in punctuationBefore */}
        {showQuoteLeft && (
          <Text as="span" fontSize="0.6em" opacity={0.4} color="gray.700" _dark={{ color: 'gray.400' }}>
            "
          </Text>
        )}
        {/* Subtle bracket indicator if in brackets but not already in punctuationBefore */}
        {showBracketLeft && (
          <Text as="span" fontSize="0.6em" opacity={0.4} color="gray.700" _dark={{ color: 'gray.400' }}>
            (
          </Text>
        )}
        
        <Text as="span">{firstPart}</Text>
        <Text as="span" color={middleLetterColor} fontWeight={middleLetterWeight}>
          {middleLetter}
        </Text>
        <Text as="span">{secondPart}</Text>
        
        {/* Subtle punctuation after word */}
        {punctuationAfter && (
          <Text as="span" fontSize="0.6em" opacity={0.4} color="gray.700" _dark={{ color: 'gray.400' }}>
            {punctuationAfter}
          </Text>
        )}
        {/* Subtle end-of-sentence punctuation */}
        {punctuation && (
          <Text as="span" fontSize="0.6em" opacity={0.4} color="gray.700" _dark={{ color: 'gray.400' }}>
            {punctuation}
          </Text>
        )}
      </Box>

      {/* Zero-width placeholder to reserve space and prevent layout shift */}
      <Text as="span" visibility="hidden" fontSize={fontSize}>
        {fullDisplayText}
      </Text>
    </Box>
  );
}
