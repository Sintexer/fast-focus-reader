import { Field, SegmentGroup, HStack } from '@chakra-ui/react';
import { useColorMode, type ColorMode } from '../ui/color-mode';
import { LuSun, LuMoon, LuMonitor } from 'react-icons/lu';
import { useI18n } from '../../i18n/useI18n';

/**
 * Theme settings component
 * Allows users to switch between light, dark, and system theme
 */
export function ThemeSettings() {
  const { colorMode, setColorMode } = useColorMode();
  const { t } = useI18n();

  return (
    <Field.Root>
      <Field.Label>{t('theme')}</Field.Label>
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
                  <span>{t('light')}</span>
                </HStack>
              ),
            },
            {
              value: 'dark',
              label: (
                <HStack gap={1.5}>
                  <LuMoon />
                  <span>{t('dark')}</span>
                </HStack>
              ),
            },
            {
              value: 'system',
              label: (
                <HStack gap={1.5}>
                  <LuMonitor />
                  <span>{t('system')}</span>
                </HStack>
              ),
            },
          ]}
        />
      </SegmentGroup.Root>
    </Field.Root>
  );
}
