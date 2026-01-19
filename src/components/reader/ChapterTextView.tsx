import { Box, Text, Mark } from '@chakra-ui/react';
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
