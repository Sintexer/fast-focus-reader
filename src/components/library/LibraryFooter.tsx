import { Box, Text, HStack, Flex, IconButton } from '@chakra-ui/react';
import { BsGear } from 'react-icons/bs';
import { Tooltip } from '../ui/tooltip';
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
        {/* Left flex: settings button */}
        <Flex flex="1" justifyContent="flex-start" alignItems="center" gap={2}>
          {onOpenSettings && (
            <Tooltip content={t('openSettings')}>
              <IconButton
                aria-label={t('openSettings')}
                onClick={onOpenSettings}
                size="xs"
                variant="ghost"
                colorPalette="gray"
                minW="auto"
                h="auto"
                p={0}
                opacity={0.4}
                _hover={{ opacity: 1 }}
              >
                <BsGear />
              </IconButton>
            </Tooltip>
          )}
        </Flex>

        {/* Right flex: locale code */}
        <Flex flex="1" justifyContent="flex-end" alignItems="center" gap={2}>
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
      </HStack>
    </Box>
  );
}
