import { HStack, Text, Switch } from '@chakra-ui/react';

type UploadMode = 'file' | 'text';

export interface UploadModeSwitchProps {
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
}

export function UploadModeSwitch({ mode, onModeChange }: UploadModeSwitchProps) {
  return (
    <HStack justify="space-between" align="center">
      <Text>Upload Mode:</Text>
      <HStack>
        <Text fontSize="sm" color={mode === 'file' ? 'blue.500' : 'gray.500'}>
          File Upload
        </Text>
        <Switch.Root
          checked={mode === 'text'}
          onCheckedChange={(e) => {
            onModeChange(e.checked ? 'text' : 'file');
          }}
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
        <Text fontSize="sm" color={mode === 'text' ? 'blue.500' : 'gray.500'}>
          Text Input
        </Text>
      </HStack>
    </HStack>
  );
}
