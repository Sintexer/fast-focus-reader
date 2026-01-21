import { useMemo } from 'react';
import { HStack, Text, Select, Portal, Box, createListCollection } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';

export type SortOption = 
  | 'lastReadAt-desc' 
  | 'lastReadAt-asc' 
  | 'title-asc' 
  | 'title-desc' 
  | 'createdAt-desc' 
  | 'createdAt-asc';

export type SortField = 'lastReadAt' | 'title' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface BookSortProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export function BookSort({
  sortOption,
  onSortChange,
}: BookSortProps) {
  const { t } = useI18n();

  const sortOptions = useMemo(() => createListCollection({
    items: [
      { label: t('mostRecentFirst'), value: 'lastReadAt-desc' },
      { label: t('oldestFirst'), value: 'lastReadAt-asc' },
      { label: t('alphabeticallyAscending'), value: 'title-asc' },
      { label: t('alphabeticallyDescending'), value: 'title-desc' },
      { label: t('newestFirst'), value: 'createdAt-desc' },
      { label: t('oldestAddedFirst'), value: 'createdAt-asc' },
    ],
  }), [t]);

  return (
    <HStack gap={2} align="center">
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
        {t('sortBy')}:
      </Text>
      <Box flex="1">
        <Select.Root
          collection={sortOptions}
          value={[sortOption]}
          onValueChange={(e) => onSortChange(e.value[0] as SortOption)}
          size="sm"
          width="100%"
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {sortOptions.items.map((item: { label: string; value: string }) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Box>
    </HStack>
  );
}
