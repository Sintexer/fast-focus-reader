import { Field } from '@chakra-ui/react';
import { SegmentGroup } from '@chakra-ui/react';
import type { AutoStopSettingsProps, AutoStopMode } from './types';

/**
 * Auto-stop settings using a single segmented control
 * Three options: Disabled, Sentence End, Paragraph End
 * Note: Stopping at sentence end is equivalent to stopping at paragraph end
 */
export function AutoStopSettings({
  autoStopMode,
  onAutoStopModeChange,
}: AutoStopSettingsProps) {
  return (
    <Field.Root>
      <Field.Label>Auto-stop</Field.Label>
      <Field.HelperText>
        Control when playback automatically stops
      </Field.HelperText>
      <SegmentGroup.Root
        value={autoStopMode}
        onValueChange={(e) => onAutoStopModeChange(e.value as AutoStopMode)}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items
          items={[
            { value: 'disabled', label: 'Disabled' },
            { value: 'sentence', label: 'Sentence End' },
            { value: 'paragraph', label: 'Paragraph End' },
          ]}
        />
      </SegmentGroup.Root>
    </Field.Root>
  );
}
