import { Drawer, Portal, VStack, Separator, CloseButton } from '@chakra-ui/react';
import { AutoStopSettings } from './AutoStopSettings';
import { ThemeSettings } from './ThemeSettings';
import { ReaderControlsSettings } from './ReaderControlsSettings';
import type { SettingsDrawerProps } from './types';

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
}: SettingsDrawerProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => (!e.open && onClose())} placement="bottom">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxH="80vh" roundedTop="lg">
            <Drawer.Header>
              <Drawer.Title>Settings</Drawer.Title>
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

                {/* Reader controls settings */}
                <ReaderControlsSettings
                  showControls={showControls}
                  onShowControlsChange={onShowControlsChange}
                />

                <Separator />

                {/* Theme settings */}
                <ThemeSettings />

                {/* Placeholder for future settings */}
                {/* WPM settings will be added here */}
                {/* Font selection will be added here */}
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
