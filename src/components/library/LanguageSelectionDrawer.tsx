import { Drawer, Portal, VStack, CloseButton, Field, SegmentGroup } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';
import type { Locale } from '../../i18n/types';

export interface LanguageSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Language selection drawer component
 * Allows users to switch between available languages
 */
export function LanguageSelectionDrawer({
  isOpen,
  onClose,
}: LanguageSelectionDrawerProps) {
  const { locale, setLocale, t } = useI18n();

  const handleLanguageChange = async (newLocale: Locale) => {
    await setLocale(newLocale);
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => (!e.open && onClose())} placement="bottom">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxH="50vh" roundedTop="lg">
            <Drawer.Header>
              <Drawer.Title>{t('selectLanguage')}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body>
              <VStack gap={6} alignItems="stretch">
                <Field.Root>
                  <Field.Label>{t('language')}</Field.Label>
                  <SegmentGroup.Root
                    value={locale}
                    onValueChange={(e) => handleLanguageChange(e.value as Locale)}
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Items
                      items={[
                        { value: 'en', label: t('english') },
                        { value: 'ru', label: t('russian') },
                      ]}
                    />
                  </SegmentGroup.Root>
                </Field.Root>
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
