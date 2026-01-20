import { useMemo } from 'react';
import { Button, Text, Drawer, TreeView, createTreeCollection, Icon, CloseButton, VStack } from '@chakra-ui/react';
import type { Book } from '../../utils/db';
import { BsArrowReturnLeft } from 'react-icons/bs';
import { TableOfContentsTreeNode, type TreeNode } from './TableOfContentsTreeNode';

export interface TableOfContentsProps {
  book: Book | null;
  currentVolumeId: string;
  currentChapterId: string;
  onChapterClick: (volumeId: string, chapterId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onBackToLibrary?: () => void;
}


export function TableOfContents({
  book,
  currentVolumeId,
  currentChapterId,
  onChapterClick,
  isOpen,
  onToggle,
  onBackToLibrary,
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
      placement="end"
      size={{ base: 'xs', md: 'sm' }}
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content p={2}>
          <Drawer.Header p={0} position="relative">
            <VStack alignItems="start" gap={0} pt={4} pl={4} pr={16} pb={4}>
              <Drawer.Title fontSize="lg" fontWeight="bold">
                {book.title}
              </Drawer.Title>
              {book.author && (
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  {book.author}
                </Text>
              )}
            </VStack>
            <Drawer.CloseTrigger asChild>
              <CloseButton 
                size="sm" 
                position="absolute"
                top={0}
                right={0}
                pb={2}
                pl={2}
                pr={0}
                pt={0}
              />
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body p={0} pt={4} pl={4} pr={4} pb={4}>
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
                  render={({ node, nodeState }) => (
                    <TableOfContentsTreeNode
                      node={node as TreeNode}
                      nodeState={nodeState}
                      currentVolumeId={currentVolumeId}
                      onItemClick={handleItemClick}
                    />
                  )}
                />
              </TreeView.Tree>
            </TreeView.Root>
          </Drawer.Body>
          {onBackToLibrary && (
            <Drawer.Footer p={0}>
              <Button
                onClick={onBackToLibrary}
                size="sm"
                variant="outline"
                colorPalette="red"
              >
                <Icon><BsArrowReturnLeft /></Icon>
                Back to library
              </Button>
            </Drawer.Footer>
          )}
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
