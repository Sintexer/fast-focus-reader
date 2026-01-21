import { HStack, Text } from '@chakra-ui/react';
import { BsPlayCircleFill, BsPlus, BsPlusCircleFill } from 'react-icons/bs';
import { MinimalIconButton } from '../ui/MinimalIconButton';
import { useI18n } from '../../i18n/useI18n';

export interface LibraryHeaderProps {
  onUploadClick: () => void;
}

export function LibraryHeader({ onUploadClick }: LibraryHeaderProps) {
  const { t } = useI18n();

  return (
    <HStack justify="space-between" align="center">
      <Text fontSize="2xl" fontWeight="bold">
        {t('library')}
      </Text>
      <MinimalIconButton
        onClick={onUploadClick}
        colorPalette="green"
        tooltip={t('uploadBook')}
        aria-label={t('uploadBook')}
        opacity={0.8}
      >
        <BsPlusCircleFill />
      </MinimalIconButton>
    </HStack>
  );
}
