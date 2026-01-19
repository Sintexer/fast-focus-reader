import { Field, SegmentGroup, HStack } from '@chakra-ui/react';
import { useColorMode, type ColorMode } from '../ui/color-mode';
import { LuSun, LuMoon, LuMonitor } from 'react-icons/lu';

/**
 * Theme settings component
 * Allows users to switch between light, dark, and system theme
 */
export function ThemeSettings() {
  const { colorMode, setColorMode } = useColorMode();

  return (
    <Field.Root>
      <Field.Label>Theme</Field.Label>
      <Field.HelperText>Choose your preferred color theme</Field.HelperText>
      <SegmentGroup.Root
        value={colorMode}
        onValueChange={(e) => setColorMode(e.value as ColorMode)}
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items
          items={[
            {
              value: 'light',
              label: (
                <HStack gap={1.5}>
                  <LuSun />
                  <span>Light</span>
                </HStack>
              ),
            },
            {
              value: 'dark',
              label: (
                <HStack gap={1.5}>
                  <LuMoon />
                  <span>Dark</span>
                </HStack>
              ),
            },
            {
              value: 'system',
              label: (
                <HStack gap={1.5}>
                  <LuMonitor />
                  <span>System</span>
                </HStack>
              ),
            },
          ]}
        />
      </SegmentGroup.Root>
    </Field.Root>
  );
}
