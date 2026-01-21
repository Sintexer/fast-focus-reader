import { HStack, Text, NativeSelect, IconButton } from '@chakra-ui/react';
import { BsArrowUp, BsArrowDown } from 'react-icons/bs';
import { useI18n } from '../../i18n/useI18n';

export type SortField = 'lastReadAt' | 'title' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface BookSortProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
}

export function BookSort({
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
}: BookSortProps) {
  const { t } = useI18n();

  const handleDirectionToggle = () => {
    onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <HStack gap={2} align="center">
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
        {t('sortBy')}:
      </Text>
      <NativeSelect.Root size="sm" width="auto">
        <NativeSelect.Field
          value={sortField}
          onChange={(e) => onSortFieldChange(e.currentTarget.value as SortField)}
        >
          <option value="lastReadAt">{t('lastRead')}</option>
          <option value="title">{t('title')}</option>
          <option value="createdAt">{t('dateAdded')}</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <IconButton
        onClick={handleDirectionToggle}
        variant="ghost"
        size="xs"
        aria-label={t('sortDirection')}
        minW="auto"
        h="auto"
        p={0}
      >
        {sortDirection === 'asc' ? <BsArrowUp /> : <BsArrowDown />}
      </IconButton>
    </HStack>
  );
}
