import { HStack, Text } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';
import { BookSort, type SortField, type SortDirection } from './BookSort';

export interface LibraryHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
}

export function LibraryHeader({
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
}: LibraryHeaderProps) {
  const { t } = useI18n();

  return (
    <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
      <Text fontSize="2xl" fontWeight="bold">
        {t('library')}
      </Text>
      <BookSort
        sortField={sortField}
        sortDirection={sortDirection}
        onSortFieldChange={onSortFieldChange}
        onSortDirectionChange={onSortDirectionChange}
      />
    </HStack>
  );
}
