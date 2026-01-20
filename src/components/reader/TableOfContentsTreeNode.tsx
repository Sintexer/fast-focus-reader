import { TreeView, Icon } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';

export interface TreeNode {
  id: string;
  name: string;
  volumeId: string;
  chapterId?: string;
  children?: TreeNode[];
}

export interface TableOfContentsTreeNodeProps {
  node: TreeNode;
  nodeState: { isBranch: boolean };
  currentVolumeId: string;
  onItemClick: (node: TreeNode) => void;
}

export function TableOfContentsTreeNode({
  node,
  nodeState,
  currentVolumeId,
  onItemClick,
}: TableOfContentsTreeNodeProps) {
  if (nodeState.isBranch) {
    // Branch node (volume with chapters)
    return (
      <TreeView.BranchControl>
        <TreeView.BranchTrigger>
          <TreeView.BranchIndicator asChild>
            <Icon><LuChevronRight /></Icon>
          </TreeView.BranchIndicator>
        </TreeView.BranchTrigger>
        <TreeView.BranchText
          fontWeight={node.id === currentVolumeId ? 'bold' : 'normal'}
        >
          {node.name}
        </TreeView.BranchText>
      </TreeView.BranchControl>
    );
  } else {
    // Leaf node (chapter)
    return (
      <TreeView.Item onClick={() => onItemClick(node)}>
        <TreeView.ItemText>{node.name}</TreeView.ItemText>
      </TreeView.Item>
    );
  }
}
