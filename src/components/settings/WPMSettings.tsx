import { Field, HStack, SegmentGroup, Slider, Text, VStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import type { Settings } from '../../utils/db';
import { saveSettings } from '../../utils/db';
import { useI18n } from '../../i18n/useI18n';
import { storeWPM, clearStoredWPM } from '../../utils/wpmStorage';
import { LuGauge, LuTrendingUp } from 'react-icons/lu';
import { WPMSpeedDisplay } from '../reader/WPMSpeedDisplay';

export interface WPMSettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onWPMChange?: (wpm: number) => void;
}

const MIN_WPM = 50;
const MAX_WPM = 1200;
const STEP = 50;

/**
 * WPM settings component
 * Shows static WPM slider when dynamic WPM is disabled
 * Shows range slider when dynamic WPM is enabled
 */
export function WPMSettings({
  settings,
  onSettingsChange,
  onWPMChange,
}: WPMSettingsProps) {
  const { t } = useI18n();
  
  const minWPM = settings.minWPM ?? MIN_WPM;
  const maxWPMRange = settings.maxWPMRange ?? MAX_WPM;
  const staticWPM = settings.staticWPM ?? settings.initWPM ?? 200;
  const dynamicWPMEnabled = settings.dynamicWPMEnabled ?? false;
  
  const [range, setRange] = useState<number[]>([minWPM, maxWPMRange]);
  const [staticValue, setStaticValue] = useState<number>(staticWPM);
  
  // Sync with settings when they change externally
  useEffect(() => {
    setRange([minWPM, maxWPMRange]);
    setStaticValue(staticWPM);
  }, [minWPM, maxWPMRange, staticWPM]);
  
  const handleRangeChange = async (newRange: number[]) => {
    setRange(newRange);
    
    const updatedSettings: Settings = {
      ...settings,
      minWPM: newRange[0],
      maxWPMRange: newRange[1],
    };
    
    onSettingsChange(updatedSettings);
    await saveSettings(updatedSettings);
  };
  
  const handleStaticWPMChange = async (newValue: number) => {
    setStaticValue(newValue);
    
    const updatedSettings: Settings = {
      ...settings,
      staticWPM: newValue,
    };
    
    onSettingsChange(updatedSettings);
    await saveSettings(updatedSettings);
    
    // Update current WPM if in static mode
    if (!dynamicWPMEnabled && onWPMChange) {
      onWPMChange(newValue);
    }
  };
  
  const handleWPMTypeChange = async (type: 'static' | 'dynamic') => {
    const isDynamic = type === 'dynamic';
    
    // When switching modes, reset localStorage WPM to the appropriate initial value
    const initialWPM = isDynamic
      ? (settings.minWPM ?? MIN_WPM)
      : (settings.staticWPM ?? settings.initWPM ?? 200);
    
    // Clear old WPM and set new one
    clearStoredWPM();
    storeWPM(initialWPM);
    
    const updatedSettings: Settings = {
      ...settings,
      dynamicWPMEnabled: isDynamic,
    };
    
    onSettingsChange(updatedSettings);
    await saveSettings(updatedSettings);
  };
  
  return (
    <VStack gap={4} alignItems="stretch">
      {/* WPM Type Selector */}
      <Field.Root>
        <Field.Label>{t('wpmSettings')}</Field.Label>
        <Field.HelperText>
          {t('wpmSettingsDescription')}
        </Field.HelperText>
        <SegmentGroup.Root
          value={dynamicWPMEnabled ? 'dynamic' : 'static'}
          onValueChange={(e) => handleWPMTypeChange(e.value as 'static' | 'dynamic')}
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items
            items={[
              {
                value: 'static',
                label: (
                  <HStack gap={1.5}>
                    <LuGauge />
                    <span>{t('staticWPMOption')}</span>
                  </HStack>
                ),
              },
              {
                value: 'dynamic',
                label: (
                  <HStack gap={1.5}>
                    <LuTrendingUp />
                    <span>{t('dynamicWPMOption')}</span>
                  </HStack>
                ),
              },
            ]}
          />
        </SegmentGroup.Root>
      </Field.Root>

      {/* Static WPM Control */}
      <Field.Root disabled={dynamicWPMEnabled}>
        <Field.Label>{t('staticWPM')}</Field.Label>
        <Field.HelperText>
          {t('staticWPMDescription')}
        </Field.HelperText>
        <VStack gap={4} alignItems="stretch" w="100%">
          <Slider.Root
            value={[staticValue]}
            onValueChange={(e) => {
              const newValue = e.value[0];
              setStaticValue(newValue);
              // Update current WPM immediately if in static mode
              if (!dynamicWPMEnabled && onWPMChange) {
                onWPMChange(newValue);
              }
            }}
            onValueChangeEnd={(e) => handleStaticWPMChange(e.value[0])}
            min={MIN_WPM}
            max={MAX_WPM}
            step={STEP}
            disabled={dynamicWPMEnabled}
            // width="100%"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
          
            <HStack justify="center" gap={2}>
              <WPMSpeedDisplay wpm={staticValue} fontSize="sm" fontWeight="medium" iconPosition="left" />
              <Text fontSize="sm" color="fg.muted">
                {t('wpmExpanded')}
              </Text>
            </HStack>
        </VStack>
      </Field.Root>

      {/* Dynamic WPM Control */}
      <Field.Root disabled={!dynamicWPMEnabled}>
        <Field.Label>{t('wpmRange')}</Field.Label>
        <Field.HelperText>
          {t('wpmRangeDescription')}
        </Field.HelperText>
        <VStack gap={4} alignItems="stretch" w="100%">
          <Slider.Root
            value={range}
            onValueChange={(e) => setRange(e.value)}
            onValueChangeEnd={(e) => handleRangeChange(e.value)}
            min={MIN_WPM}
            max={MAX_WPM}
            step={STEP}
            minStepsBetweenThumbs={1}
            disabled={!dynamicWPMEnabled}
            // width="100%"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
          
            <HStack justify="space-between" fontSize="sm">
              <HStack gap={1.5}>
                <Text color="fg.muted">
                  {t('minWPM')}
                </Text>
                <WPMSpeedDisplay wpm={range[0]} fontSize="sm" fontWeight="medium" iconPosition="right" />
              </HStack>
              <HStack gap={1.5}>
                <WPMSpeedDisplay wpm={range[1]} fontSize="sm" fontWeight="medium" iconPosition="left" />
                <Text color="fg.muted">
                  {t('maxWPM')}
                </Text>
              </HStack>
            </HStack>
        </VStack>
      </Field.Root>
    </VStack>
  );
}
