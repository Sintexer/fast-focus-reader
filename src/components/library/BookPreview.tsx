import { useState, useMemo } from 'react';
import { Box, VStack, Text, Code, TreeView, createTreeCollection, Separator, Icon, Flex } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import type { Book, Volume, Chapter } from '../../utils/db';
import { useI18n } from '../../i18n/useI18n';

const MAX_PREVIEW_LENGTH = 1000; // Characters to show in preview

interface TreeNode {
  id: string;
  name: string;
  volumeId: string;
  chapterId?: string;
  children?: TreeNode[];
}

export interface BookPreviewProps {
  book: Book;
}

export function BookPreview({ book }: BookPreviewProps) {
  const { t } = useI18n();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Check if book has a single mock volume (should be ignored in display)
  const hasRealVolumes = useMemo(() => {
    return book.structure.volumes.length > 1 || 
      (book.structure.volumes.length === 1 && book.structure.volumes[0].title !== '');
  }, [book]);

  // Build root node structure for TreeView
  const rootNode = useMemo<TreeNode | null>(() => {
    const children: TreeNode[] = [];

    for (const volume of book.structure.volumes) {
      if (!hasRealVolumes && volume.title === '') {
        // For books without real volumes (mock volume), add chapters directly as root items
        for (const chapter of volume.chapters) {
          children.push({
            id: chapter.id,
            name: chapter.title,
            volumeId: volume.id,
            chapterId: chapter.id,
          });
        }
      } else {
        // For books with real volumes, add volumes with chapters as children
        children.push({
          id: volume.id,
          name: volume.title,
          volumeId: volume.id,
          children: volume.chapters.map((chapter) => ({
            id: chapter.id,
            name: chapter.title,
            volumeId: volume.id,
            chapterId: chapter.id,
          })),
        });
      }
    }

    return {
      id: 'ROOT',
      name: '',
      volumeId: '',
      children,
    };
  }, [book, hasRealVolumes]);

  // Create TreeCollection
  const collection = useMemo(() => {
    if (!rootNode) {
      return createTreeCollection<TreeNode>({
        nodeToValue: (node) => node.id,
        nodeToString: (node) => node.name,
        rootNode: {
          id: 'ROOT',
          name: '',
          volumeId: '',
          children: [],
        },
      });
    }

    return createTreeCollection<TreeNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode,
    });
  }, [rootNode]);

  // Find selected chapter
  const selectedChapter = useMemo<{ volume: Volume; chapter: Chapter } | null>(() => {
    if (!selectedChapterId) return null;

    for (const volume of book.structure.volumes) {
      const chapter = volume.chapters.find(ch => ch.id === selectedChapterId);
      if (chapter) {
        return { volume, chapter };
      }
    }
    return null;
  }, [book, selectedChapterId]);

  // Get preview content for selected chapter or default preview
  const getPreviewContent = (): Array<{ chapterTitle?: string; text: string }> => {
    if (selectedChapter) {
      // Show selected chapter content
      const samples: Array<{ chapterTitle?: string; text: string }> = [];
      const { chapter } = selectedChapter;

      if (chapter.paragraphs && chapter.paragraphs.length > 0) {
        let totalLength = 0;
        for (const paragraph of chapter.paragraphs) {
          const paragraphText = paragraph.join(' ');
          if (totalLength + paragraphText.length > MAX_PREVIEW_LENGTH) {
            const remaining = MAX_PREVIEW_LENGTH - totalLength;
            if (remaining > 50) {
              samples.push({
                chapterTitle: chapter.title,
                text: paragraphText.slice(0, remaining) + '...',
              });
            }
            break;
          }
          samples.push({
            chapterTitle: chapter.title,
            text: paragraphText,
          });
          totalLength += paragraphText.length;
        }
      }

      return samples.length > 0 ? samples : [{ chapterTitle: chapter.title, text: t('noPreviewAvailable') }];
    }

    // Default: show first chapters preview
    const samples: Array<{ chapterTitle?: string; text: string }> = [];
    let totalLength = 0;
    let lastChapterTitle: string | undefined;

    for (const volume of book.structure.volumes) {
      for (const chapter of volume.chapters) {
        if (chapter.paragraphs && chapter.paragraphs.length > 0) {
          if (chapter.title && chapter.title !== lastChapterTitle) {
            lastChapterTitle = chapter.title;
          }

          for (const paragraph of chapter.paragraphs) {
            const paragraphText = paragraph.join(' ');
            if (totalLength + paragraphText.length > MAX_PREVIEW_LENGTH) {
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
            lastChapterTitle = undefined;
          }
        }
      }

      if (samples.length >= 3) break;
    }

    return samples.length > 0 ? samples : [{ text: t('noPreviewAvailable') }];
  };

  const previewContent = getPreviewContent();

  const handleChapterClick = (node: TreeNode) => {
    if (node.chapterId) {
      setSelectedChapterId(node.chapterId);
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      <Text fontSize="lg" fontWeight="semibold">
        {t('previewFirstChapters')}
      </Text>

      <Flex 
        direction={{ base: 'column', md: 'row' }}
        align="stretch" 
        gap={4}
      >
        {/* Table of Contents */}
        <Box
          flex={{ base: 'none', md: '0 0 250px' }}
          w={{ base: '100%', md: 'auto' }}
          p={3}
          borderWidth="1px"
          borderRadius="md"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
          bg="gray.50"
          maxH="400px"
          overflowY="auto"
        >
          <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700" _dark={{ color: 'gray.300' }}>
            {t('tableOfContents')}
          </Text>
          {rootNode && (
            <TreeView.Root
              collection={collection}
              selectionMode="single"
              selectedValue={selectedChapterId ? [selectedChapterId] : undefined}
              defaultExpandedValue={hasRealVolumes ? book.structure.volumes.map(v => v.id) : undefined}
              colorPalette="green"
              size="sm"
              variant="subtle"
            >
              <TreeView.Tree>
                <TreeView.Node
                  indentGuide={<TreeView.BranchIndentGuide />}
                  render={({ node, nodeState }) => {
                    const treeNode = node as TreeNode;
                    
                    if (nodeState.isBranch) {
                      // Branch node (volume with chapters)
                      return (
                        <TreeView.BranchControl>
                          <TreeView.BranchTrigger>
                            <TreeView.BranchIndicator asChild>
                              <Icon><LuChevronRight /></Icon>
                            </TreeView.BranchIndicator>
                          </TreeView.BranchTrigger>
                          <TreeView.BranchText>
                            {treeNode.name || t('untitledVolume')}
                          </TreeView.BranchText>
                        </TreeView.BranchControl>
                      );
                    } else {
                      // Leaf node (chapter) - make it clickable
                      return (
                        <TreeView.Item 
                          onClick={() => handleChapterClick(treeNode)}
                          cursor="pointer"
                          _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                          bg={selectedChapterId === treeNode.chapterId ? 'green.50' : 'transparent'}
                          _dark={{ 
                            bg: selectedChapterId === treeNode.chapterId ? 'green.900' : 'transparent' 
                          }}
                        >
                          <TreeView.ItemText>{treeNode.name}</TreeView.ItemText>
                        </TreeView.Item>
                      );
                    }
                  }}
                />
              </TreeView.Tree>
            </TreeView.Root>
          )}
        </Box>

        <Separator orientation={{ base: 'horizontal', md: 'vertical' }} />

        {/* Preview Content */}
        <Box
          flex="1"
          p={4}
          borderWidth="1px"
          borderRadius="md"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
          bg="gray.50"
          maxH="400px"
          overflowY="auto"
        >
          <VStack align="stretch" gap={3}>
            {previewContent.map((sample, index) => (
              <Box key={index}>
                {sample.chapterTitle && (
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="green.600"
                    _dark={{ color: 'green.400' }}
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
            {previewContent.length === 0 && (
              <Text fontSize="sm" color="gray.500">
                {t('noPreviewAvailable')}
              </Text>
            )}
          </VStack>
        </Box>
      </Flex>

      <Text fontSize="xs" color="gray.500" fontStyle="italic">
        {t('previewDescription')}
      </Text>
    </VStack>
  );
}
