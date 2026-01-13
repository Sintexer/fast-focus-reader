import { useMemo } from 'react';
import { Box, Button, Text, HStack, Drawer, TreeView, createTreeCollection } from '@chakra-ui/react';
import type { Book } from '../utils/db';

export interface TableOfContentsProps {
  book: Book | null;
  currentVolumeId: string;
  currentChapterId: string;
  onChapterClick: (volumeId: string, chapterId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface TreeNode {
  id: string;
  name: string;
  volumeId: string;
  chapterId?: string;
  children?: TreeNode[];
}

export function TableOfContents({
  book,
  currentVolumeId,
  currentChapterId,
  onChapterClick,
  isOpen,
  onToggle,
}: TableOfContentsProps) {
  // Check if book has a single mock volume (should be ignored in display)
  const hasRealVolumes = useMemo(() => {
    if (!book) return false;
    return book.structure.volumes.length > 1 || 
      (book.structure.volumes.length === 1 && book.structure.volumes[0].title !== '');
  }, [book]);

  // Build root node structure for TreeView
  const rootNode = useMemo<TreeNode | null>(() => {
    if (!book) return null;

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

  if (!book || !rootNode) return null;

  const handleItemClick = (node: TreeNode) => {
    if (node.chapterId) {
      onChapterClick(node.volumeId, node.chapterId);
      onToggle();
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => {
        if (!e.open) {
          onToggle();
        }
      }}
      placement="start"
      size={{ base: 'xs', md: 'sm' }}
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <HStack justifyContent="space-between" alignItems="flex-start" w="100%">
              <Box flex="1">
                <Drawer.Title fontSize="lg" fontWeight="bold">
                  {book.title}
                </Drawer.Title>
                {book.author && (
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mt={1}>
                    {book.author}
                  </Text>
                )}
              </Box>
              <Drawer.CloseTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  minW="auto"
                  px={2}
                >
                  ✕
                </Button>
              </Drawer.CloseTrigger>
            </HStack>
          </Drawer.Header>
          <Drawer.Body>
            <TreeView.Root
              collection={collection}
              selectionMode="single"
              selectedValue={currentChapterId ? [currentChapterId] : undefined}
              defaultExpandedValue={hasRealVolumes ? [currentVolumeId] : undefined}
              colorPalette="blue"
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
                          <TreeView.BranchTrigger />
                          <TreeView.BranchText
                            fontWeight={treeNode.id === currentVolumeId ? 'bold' : 'normal'}
                          >
                            {treeNode.name}
                          </TreeView.BranchText>
                        </TreeView.BranchControl>
                      );
                    } else {
                      // Leaf node (chapter)
                      return (
                        <TreeView.Item onClick={() => handleItemClick(treeNode)}>
                          <TreeView.ItemText>{treeNode.name}</TreeView.ItemText>
                        </TreeView.Item>
                      );
                    }
                  }}
                />
              </TreeView.Tree>
            </TreeView.Root>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
