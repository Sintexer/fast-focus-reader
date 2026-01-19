import { Field } from '@chakra-ui/react';
import { Switch } from '@chakra-ui/react';

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
  return (
    <Field.Root>
      <Field.Label>Advanced Controls</Field.Label>
      <Field.HelperText>
        Show advanced playback controls (word navigation, reset, etc.)
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
