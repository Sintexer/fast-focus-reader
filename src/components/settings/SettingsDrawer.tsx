import { Drawer, Portal, VStack, Separator, CloseButton } from '@chakra-ui/react';
import { AutoStopSettings } from './AutoStopSettings';
import { ThemeSettings } from './ThemeSettings';
import { ReaderControlsSettings } from './ReaderControlsSettings';
import { WPMSettings } from './WPMSettings';
import { FontSettings } from './FontSettings';
import type { SettingsDrawerProps } from './types';
import { useI18n } from '../../i18n/useI18n';

/**
 * Settings drawer component that slides up from the bottom
 * Contains all app settings including auto-stop, WPM, theme, etc.
 */
export function SettingsDrawer({
  isOpen,
  onClose,
  autoStopMode,
  onAutoStopModeChange,
  showControls,
  onShowControlsChange,
  settings,
  onSettingsChange,
  onWPMChange,
}: SettingsDrawerProps) {
  const { t } = useI18n();
  
  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => (!e.open && onClose())} placement="bottom">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxH="80vh" roundedTop="lg">
            <Drawer.Header>
              <Drawer.Title>{t('settings')}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body>
              <VStack gap={6} alignItems="stretch">
                {/* Auto-stop settings */}
                <AutoStopSettings
                  autoStopMode={autoStopMode}
                  onAutoStopModeChange={onAutoStopModeChange}
                />

                <Separator />

                {/* Font settings */}
                {settings && (
                  <>
                    <FontSettings
                      settings={settings}
                      onSettingsChange={onSettingsChange}
                    />
                    <Separator />
                  </>
                )}

                {/* Reader controls settings */}
                <ReaderControlsSettings
                  showControls={showControls}
                  onShowControlsChange={onShowControlsChange}
                />

                <Separator />

                {/* WPM settings */}
                {settings && (
                  <>
                    <WPMSettings
                      settings={settings}
                      onSettingsChange={onSettingsChange}
                      onWPMChange={onWPMChange}
                    />
                    <Separator />
                  </>
                )}

                {/* Theme settings */}
                <ThemeSettings />
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
