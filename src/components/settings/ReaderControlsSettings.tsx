import { Field } from '@chakra-ui/react';
import { Switch } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';

export interface ReaderControlsSettingsProps {
  showControls: boolean;
  onShowControlsChange: (show: boolean) => void;
}

/**
 * Settings for reader controls visibility
 */
export function ReaderControlsSettings({
  showControls,
  onShowControlsChange,
}: ReaderControlsSettingsProps) {
  const { t } = useI18n();
  
  return (
    <Field.Root>
      <Field.Label>{t('advancedControls')}</Field.Label>
      <Field.HelperText>
        {t('advancedControlsDescription')}
      </Field.HelperText>
      <Switch.Root
        checked={showControls}
        onCheckedChange={(details: { checked: boolean }) => onShowControlsChange(details.checked)}
      >
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
    </Field.Root>
  );
}
