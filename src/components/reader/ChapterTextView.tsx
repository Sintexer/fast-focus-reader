import { Box, Text, Mark } from '@chakra-ui/react';
import { useRef, useEffect } from 'react';
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
  if (!currentWord || !chapterText) {
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

  const textBeforeSentence = chapterText.slice(0, sentenceStart);
  const sentenceTextBeforeWord = chapterText.slice(sentenceStart, wordStart);
  const currentWordText = chapterText.slice(wordStart, wordEnd);
  const sentenceTextAfterWord = chapterText.slice(wordEnd, sentenceEnd);
  const textAfterSentence = chapterText.slice(sentenceEnd);

  const sentenceRef = useRef<HTMLSpanElement>(null);

  // Scroll to current sentence when it changes
  useEffect(() => {
    if (sentenceRef.current && scrollContainerRef?.current) {
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
    }
  }, [currentSentence, currentWord, scrollContainerRef]);

  return (
    <Text
      fontSize="sm"
      lineHeight="1.8"
      color="gray.700"
      _dark={{ color: 'gray.300' }}
      whiteSpace="pre-wrap"
    >
      {textBeforeSentence}
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
        {sentenceTextBeforeWord}
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
          {currentWordText}
        </Mark>
        {sentenceTextAfterWord}
      </Box>
      {textAfterSentence}
    </Text>
  );
}
