import { Box, VStack, Text, Code } from '@chakra-ui/react';
import type { Book } from '../../utils/db';

const MAX_PREVIEW_LENGTH = 500; // Characters to show in preview

export interface BookPreviewProps {
  book: Book;
}

export function BookPreview({ book }: BookPreviewProps) {
  const getPreviewSamples = (): Array<{ chapterTitle?: string; text: string }> => {
    const samples: Array<{ chapterTitle?: string; text: string }> = [];
    let totalLength = 0;
    let lastChapterTitle: string | undefined;

    for (const volume of book.structure.volumes) {
      for (const chapter of volume.chapters) {
        if (chapter.paragraphs && chapter.paragraphs.length > 0) {
          // Add chapter title if it's different from the last one
          if (chapter.title && chapter.title !== lastChapterTitle) {
            lastChapterTitle = chapter.title;
          }

          for (const paragraph of chapter.paragraphs) {
            const paragraphText = paragraph.join(' ');
            if (totalLength + paragraphText.length > MAX_PREVIEW_LENGTH) {
              // Add partial paragraph if we have space
              const remaining = MAX_PREVIEW_LENGTH - totalLength;
              if (remaining > 50) {
                samples.push({
                  chapterTitle: lastChapterTitle,
                  text: paragraphText.slice(0, remaining) + '...',
                });
              }
              return samples;
            }
            samples.push({
              chapterTitle: lastChapterTitle,
              text: paragraphText,
            });
            totalLength += paragraphText.length;
            lastChapterTitle = undefined; // Only show chapter title for first paragraph
          }
        }
      }

      // Limit to first few chapters
      if (samples.length >= 5) break;
    }

    return samples;
  };

  const samples = getPreviewSamples();

  return (
    <VStack align="stretch" gap={4}>
      <Text fontSize="lg" fontWeight="semibold">
        Preview (First Chapters)
      </Text>

      <Box
        p={4}
        borderWidth="1px"
        borderRadius="md"
        borderColor="gray.200"
        _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
        bg="gray.50"
        maxH="300px"
        overflowY="auto"
      >
        <VStack align="stretch" gap={3}>
          {samples.map((sample, index) => (
            <Box key={index}>
              {sample.chapterTitle && (
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="blue.600"
                  _dark={{ color: 'blue.400' }}
                  mb={1}
                >
                  {sample.chapterTitle}
                </Text>
              )}
              <Code
                display="block"
                p={2}
                fontSize="xs"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                bg="transparent"
                color="gray.700"
                _dark={{ color: 'gray.300' }}
              >
                {sample.text}
              </Code>
            </Box>
          ))}
          {samples.length === 0 && (
            <Text fontSize="sm" color="gray.500">
              No preview available
            </Text>
          )}
        </VStack>
      </Box>

      <Text fontSize="xs" color="gray.500" fontStyle="italic">
        This preview shows the first few paragraphs to help verify the import. The content cannot be edited here.
      </Text>
    </VStack>
  );
}
