import { Box, Text, HStack, Flex } from '@chakra-ui/react';
import { BsGear } from 'react-icons/bs';
import { Tooltip } from '../ui/tooltip';
import { MinimalIconButton } from '../ui/MinimalIconButton';
import { useI18n } from '../../i18n/useI18n';

export interface LibraryFooterProps {
  onOpenSettings?: () => void;
  onOpenLanguageSelection?: () => void;
}

/**
 * Footer component for the library screen
 * Displays settings icon and locale code
 * Styled similar to ReaderFooter
 */
export function LibraryFooter({
  onOpenSettings,
  onOpenLanguageSelection,
}: LibraryFooterProps) {
  const { locale, t } = useI18n();

  return (
    <Box w="100%" py={2} px={2}>
      <HStack justifyContent="center" alignItems="center" gap={2} w="100%">
        {/* Left flex: locale code */}
        <Flex flex="1" justifyContent="flex-start" alignItems="center" gap={2}>
          {onOpenLanguageSelection && (
            <Tooltip content={t('selectLanguage')}>
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                cursor="pointer"
                onClick={onOpenLanguageSelection}
                _hover={{ color: 'gray.700', _dark: { color: 'gray.300' } }}
                transition="color 0.2s"
                textTransform="uppercase"
              >
                {locale}
              </Text>
            </Tooltip>
          )}
        </Flex>

        {/* Right flex: settings button */}
        <Flex flex="1" justifyContent="flex-end" alignItems="center" gap={2}>
          {onOpenSettings && (
            <MinimalIconButton
              aria-label={t('openSettings')}
              onClick={onOpenSettings}
              tooltip={t('openSettings')}
            >
              <BsGear />
            </MinimalIconButton>
          )}
        </Flex>
      </HStack>
    </Box>
  );
}
