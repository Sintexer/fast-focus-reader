import { HStack, Text } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';
import { BookSort, type SortOption } from './BookSort';

export interface LibraryHeaderProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export function LibraryHeader({
  sortOption,
  onSortChange,
}: LibraryHeaderProps) {
  const { t } = useI18n();

  return (
    <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
      <Text fontSize="2xl" fontWeight="bold">
        {t('library')}
      </Text>
      <BookSort
        sortOption={sortOption}
        onSortChange={onSortChange}
      />
    </HStack>
  );
}
