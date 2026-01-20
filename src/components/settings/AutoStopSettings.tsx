import { Field } from '@chakra-ui/react';
import { SegmentGroup } from '@chakra-ui/react';
import type { AutoStopSettingsProps, AutoStopMode } from './types';
import { useI18n } from '../../i18n/useI18n';

/**
 * Auto-stop settings using a single segmented control
 * Three options: Disabled, Sentence End, Paragraph End
 * Note: Stopping at sentence end is equivalent to stopping at paragraph end
 */
export function AutoStopSettings({
  autoStopMode,
  onAutoStopModeChange,
}: AutoStopSettingsProps) {
  const { t } = useI18n();
  
  return (
    <Field.Root>
      <Field.Label>{t('autoStop')}</Field.Label>
      <Field.HelperText>
        {t('autoStopDescription')}
      </Field.HelperText>
      <SegmentGroup.Root
        value={autoStopMode}
        onValueChange={(e) => onAutoStopModeChange(e.value as AutoStopMode)}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items
          items={[
            { value: 'disabled', label: t('disabled') },
            { value: 'sentence', label: t('sentenceEnd') },
            { value: 'paragraph', label: t('paragraphEnd') },
          ]}
        />
      </SegmentGroup.Root>
    </Field.Root>
  );
}
