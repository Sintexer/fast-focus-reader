import { Field, SegmentGroup, VStack, Button, HStack, Box } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';
import type { Settings } from '../../utils/db';

export interface FontSettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

// Font families for regular type
const REGULAR_FONTS = [
  'Inter',
  'Georgia',
];

// Font families for mono type
const MONO_FONTS = [
  'JetBrains Mono',
  'Fira Code',
];

/**
 * Font settings component
 * Allows users to select font type (mono/regular) and cycle through font families
 */
export function FontSettings({
  settings,
  onSettingsChange,
}: FontSettingsProps) {
  const { t } = useI18n();
  
  const fontType = settings.fontType ?? 'regular';
  const currentFontFamily = settings.fontFamily ?? (fontType === 'mono' ? MONO_FONTS[0] : REGULAR_FONTS[0]);
  
  const availableFonts = fontType === 'mono' ? MONO_FONTS : REGULAR_FONTS;
  const currentFontIndex = availableFonts.indexOf(currentFontFamily);
  const displayFont = currentFontIndex >= 0 ? currentFontFamily : availableFonts[0];
  const activeFontIndex = currentFontIndex >= 0 ? currentFontIndex : 0;
  
  const handleFontTypeChange = (type: 'mono' | 'regular') => {
    const fonts = type === 'mono' ? MONO_FONTS : REGULAR_FONTS;
    const newSettings: Settings = {
      ...settings,
      fontType: type,
      fontFamily: fonts[0], // Reset to first font when switching type
    };
    onSettingsChange(newSettings);
  };
  
  const handleFontCycle = () => {
    const fonts = fontType === 'mono' ? MONO_FONTS : REGULAR_FONTS;
    const currentIndex = fonts.indexOf(currentFontFamily);
    const nextIndex = (currentIndex + 1) % fonts.length;
    const newSettings: Settings = {
      ...settings,
      fontFamily: fonts[nextIndex],
    };
    onSettingsChange(newSettings);
  };
  
  return (
    <VStack gap={4} alignItems="stretch">
      {/* Font Type Selector */}
      <Field.Root>
        <Field.Label>{t('fontType')}</Field.Label>
        <Field.HelperText>
          {t('fontTypeDescription')}
        </Field.HelperText>
        <SegmentGroup.Root
          value={fontType}
          onValueChange={(e) => handleFontTypeChange(e.value as 'mono' | 'regular')}
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items
            items={[
              {
                value: 'regular',
                label: (
                  <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {t('regular')}
                  </span>
                ),
              },
              {
                value: 'mono',
                label: (
                  <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                    {t('mono')}
                  </span>
                ),
              },
            ]}
          />
        </SegmentGroup.Root>
      </Field.Root>
      
      {/* Font Family Cycle Button */}
      <Field.Root>
        <Field.Label>{t('fontFamily')}</Field.Label>
        <Field.HelperText>
          {t('fontFamilyDescription')}
        </Field.HelperText>
        <HStack gap={2} alignItems="center">
          {/* Font index indicators */}
          <HStack gap={1} alignItems="center">
            {availableFonts.map((_, index) => (
              <Box
                key={index}
                w="6px"
                h="6px"
                borderRadius="full"
                bg={index === activeFontIndex ? 'blue.500' : 'gray.300'}
                _dark={{ bg: index === activeFontIndex ? 'blue.400' : 'gray.600' }}
                transition="background-color 0.2s"
              />
            ))}
          </HStack>
          <Button
            onClick={handleFontCycle}
            variant="outline"
            flexShrink={0}
            style={{
              fontFamily: fontType === 'mono' 
                ? `"${displayFont}", ui-monospace, monospace`
                : `"${displayFont}", system-ui, -apple-system, sans-serif`,
            }}
          >
            {displayFont}
          </Button>
        </HStack>
      </Field.Root>
    </VStack>
  );
}
