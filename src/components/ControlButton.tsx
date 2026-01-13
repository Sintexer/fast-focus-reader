import { Button, Box, type ButtonProps } from '@chakra-ui/react';
import { KeyboardShortcut } from './KeyboardShortcut';

export interface ControlButtonProps extends Omit<ButtonProps, 'children'> {
  label: string;
  shortcut: string[];
  onClick?: () => void;
}

export function ControlButton({
  label,
  shortcut,
  onClick,
  ...buttonProps
}: ControlButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="md"
      {...buttonProps}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <span>{label}</span>
        <KeyboardShortcut keys={shortcut} size="sm" />
      </Box>
    </Button>
  );
}
