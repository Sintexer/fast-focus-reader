import { Dialog, Portal, Button, HStack, Text, VStack, CloseButton } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';
import type { Settings } from '../../utils/db';
import { getInitialWPM } from '../../utils/db';
import { storeWPM } from '../../utils/wpmStorage';
import { WPMSpeedDisplay } from './WPMSpeedDisplay';

export interface WPMInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWPM: number;
  settings: Settings;
  onResetWPM: () => void;
  onOpenSettings: () => void;
}

/**
 * Modal showing current WPM information
 * Displays current WPM, min/max in dynamic mode, and reset button
 */
export function WPMInfoModal({
  isOpen,
  onClose,
  currentWPM,
  settings,
  onResetWPM,
  onOpenSettings,
}: WPMInfoModalProps) {
  const { t } = useI18n();
  
  const isDynamic = settings.dynamicWPMEnabled ?? false;
  const minWPM = settings.minWPM ?? 50;
  const maxWPM = settings.maxWPMRange ?? 1200;
  const initialWPM = getInitialWPM(settings);
  
  const handleReset = () => {
    storeWPM(initialWPM);
    onResetWPM();
    onClose();
  };
  
  const handleOpenSettings = () => {
    onOpenSettings();
    onClose();
  };
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => (!e.open && onClose())}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx={2}>
            <Dialog.Header>
              <Dialog.Title>
                {t('wpmInfo')}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            
            <Dialog.Body>
              <VStack gap={4} alignItems="stretch">
                {/* Current WPM Display */}
                {isDynamic ? (
                  // Dynamic mode: show min, current, max
                  <HStack justify="space-between" alignItems="center" gap={4}>
                    <VStack gap={1} alignItems="center" flex="1">
                      <Text fontSize="sm" color="fg.muted">
                        {t('minWPM')}
                      </Text>
                      <WPMSpeedDisplay wpm={minWPM} fontSize="lg" fontWeight="semibold" iconPosition="right" />
                    </VStack>
                    
                    <VStack gap={1} alignItems="center" flex="1">
                      <Text fontSize="sm" color="fg.muted">
                        {t('currentWPM')}
                      </Text>
                      <WPMSpeedDisplay wpm={currentWPM} fontSize="2xl" fontWeight="bold" iconPosition="right" />
                    </VStack>
                    
                    <VStack gap={1} alignItems="center" flex="1">
                      <Text fontSize="sm" color="fg.muted">
                        {t('maxWPM')}
                      </Text>
                      <WPMSpeedDisplay wpm={maxWPM} fontSize="lg" fontWeight="semibold" iconPosition="left" />
                    </VStack>
                  </HStack>
                ) : (
                  // Static mode: show current only
                  <VStack gap={1} alignItems="center">
                    <Text fontSize="sm" color="fg.muted">
                      {t('currentWPM')}
                    </Text>
                    <WPMSpeedDisplay wpm={currentWPM} fontSize="3xl" fontWeight="bold" iconPosition="right" />
                    <Text fontSize="sm" color="fg.muted">
                      {t('wpmExpanded')}
                    </Text>
                  </VStack>
                )}
                
                {/* Mode Description */}
                <VStack gap={2} alignItems="stretch" pt={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    {isDynamic ? t('dynamicWPM') : t('staticWPM')}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {isDynamic ? t('wpmRangeDescription') : t('staticWPMDescription')}
                  </Text>
                </VStack>
                
                {/* Reset Button (only in dynamic mode) */}
                {isDynamic && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    colorPalette="gray"
                  >
                    {t('resetToInitialWPM')}
                  </Button>
                )}
                
                {/* Settings Hint */}
                <Text fontSize="xs" color="fg.muted" textAlign="center" pt={2}>
                  {t('wpmSettingsHint')}{' '}
                  <Button
                    variant="plain"
                    size="xs"
                    onClick={handleOpenSettings}
                    colorPalette="green"
                    p={0}
                    h="auto"
                    minH="auto"
                  >
                    {t('settings')}
                  </Button>
                </Text>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
