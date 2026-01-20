import { Box, Text, Mark } from '@chakra-ui/react';
import { useRef, useEffect, useMemo } from 'react';
import type { ChapterTextViewProps } from './types';

/**
 * Component that displays chapter text with sentence and word highlighting
 * - Current sentence is highlighted with a different font color
 * - Current word is highlighted with a background color within the sentence
 */
export function ChapterTextView({
  chapterText,
  currentWord,
  currentSentence,
  scrollContainerRef,
}: ChapterTextViewProps) {
  // ALWAYS call hooks first, before any conditional returns
  // This ensures hooks are called in the same order on every render
  const sentenceRef = useRef<HTMLSpanElement>(null);

  // Memoize text segments to avoid recalculating on every render
  const textSegments = useMemo(() => {
    if (!currentWord || !chapterText) {
      return null;
    }

    const wordStart = currentWord.charIndex;
    const wordEnd = wordStart + currentWord.text.length;

    let sentenceStart = 0;
    let sentenceEnd = chapterText.length;

    if (currentSentence && currentSentence.length > 0) {
      const firstWord = currentSentence[0];
      const lastWord = currentSentence[currentSentence.length - 1];
      sentenceStart = firstWord.charIndex;
      sentenceEnd = lastWord.charIndex + lastWord.text.length;
    }

    return {
      textBeforeSentence: chapterText.slice(0, sentenceStart),
      sentenceTextBeforeWord: chapterText.slice(sentenceStart, wordStart),
      currentWordText: chapterText.slice(wordStart, wordEnd),
      sentenceTextAfterWord: chapterText.slice(wordEnd, sentenceEnd),
      textAfterSentence: chapterText.slice(sentenceEnd),
    };
  }, [chapterText, currentWord, currentSentence]);

  // Scroll to current sentence when it changes
  // Only scroll if we have a current word and sentence
  useEffect(() => {
    if (!currentWord || !textSegments || !sentenceRef.current || !scrollContainerRef?.current) {
      return;
    }

    const sentenceElement = sentenceRef.current;
    const container = scrollContainerRef.current;
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      // Calculate position relative to container
      const containerRect = container.getBoundingClientRect();
      const sentenceRect = sentenceElement.getBoundingClientRect();
      
      // Calculate scroll position to center the sentence in the viewport
      const scrollTop = container.scrollTop;
      const sentenceTop = sentenceRect.top - containerRect.top + scrollTop;
      const sentenceHeight = sentenceRect.height;
      const containerHeight = container.clientHeight;
      
      // Center the sentence in the viewport
      const targetScrollTop = sentenceTop - (containerHeight / 2) + (sentenceHeight / 2);
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    });
  }, [currentWord, textSegments, scrollContainerRef]);

  // Conditional rendering AFTER all hooks are called
  if (!chapterText) {
    return null;
  }

  // If no current word or segments, show plain text
  if (!currentWord || !textSegments) {
    return (
      <Text
        fontSize="sm"
        lineHeight="1.8"
        color="gray.700"
        _dark={{ color: 'gray.300' }}
        whiteSpace="pre-wrap"
      >
        {chapterText}
      </Text>
    );
  }

  // Render with highlighting
  return (
    <Text
      fontSize="sm"
      lineHeight="1.8"
      color="gray.700"
      _dark={{ color: 'gray.300' }}
      whiteSpace="pre-wrap"
    >
      {textSegments.textBeforeSentence}
      <Box
        ref={sentenceRef}
        as="span"
        color="blue.600"
        _dark={{ color: 'blue.400' }}
        style={{
          fontSize: 'inherit',
          lineHeight: 'inherit',
          fontWeight: 'inherit',
          fontFamily: 'inherit',
        }}
      >
        {textSegments.sentenceTextBeforeWord}
        <Mark
          bg="blue.200"
          color="blue.900"
          _dark={{
            bg: 'blue.800',
            color: 'blue.100',
          }}
          style={{
            fontSize: 'inherit',
            lineHeight: 'inherit',
            fontWeight: 'inherit',
            fontFamily: 'inherit',
          }}
        >
          {textSegments.currentWordText}
        </Mark>
        {textSegments.sentenceTextAfterWord}
      </Box>
      {textSegments.textAfterSentence}
    </Text>
  );
}
