import { HStack, Text, Switch } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';

type UploadMode = 'file' | 'text';

export interface UploadModeSwitchProps {
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
}

export function UploadModeSwitch({ mode, onModeChange }: UploadModeSwitchProps) {
  const { t } = useI18n();
  
  return (
    <HStack justify="space-between" align="center">
      <Text>{t('uploadMode')}</Text>
      <HStack>
        <Text fontSize="sm" color={mode === 'file' ? 'blue.500' : 'gray.500'}>
          {t('fileUpload')}
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
          {t('textInput')}
        </Text>
      </HStack>
    </HStack>
  );
}
