import { IconButton, type IconButtonProps } from '@chakra-ui/react';
import { Tooltip } from './tooltip';
import type { ReactNode } from 'react';

export interface MinimalIconButtonProps extends Omit<IconButtonProps, 'size' | 'variant' | 'minW' | 'h' | 'p'> {
  tooltip?: string;
  children: ReactNode;
}

/**
 * Minimal icon button component with consistent styling
 * Used for footer buttons and other minimal UI elements
 */
export function MinimalIconButton({
  tooltip,
  children,
  colorPalette = 'gray',
  opacity = 0.4,
  ...props
}: MinimalIconButtonProps) {
  const button = (
    <IconButton
      size="xs"
      variant="ghost"
      colorPalette={colorPalette}
      minW="auto"
      h="auto"
      p={0}
      opacity={opacity}
      _hover={{ opacity: 1 }}
      {...props}
    >
      {children}
    </IconButton>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
}
