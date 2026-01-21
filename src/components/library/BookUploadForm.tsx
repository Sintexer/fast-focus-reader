import { useMemo } from 'react';
import { VStack, Field, Input, Select, Portal, Text, createListCollection } from '@chakra-ui/react';
import { useI18n } from '../../i18n/useI18n';

export interface BookUploadFormProps {
  title: string;
  author: string;
  language: 'en' | 'ru';
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onLanguageChange: (language: 'en' | 'ru') => void;
}

export function BookUploadForm({
  title,
  author,
  language,
  onTitleChange,
  onAuthorChange,
  onLanguageChange,
}: BookUploadFormProps) {
  const { t } = useI18n();

  const languageOptions = useMemo(() => createListCollection({
    items: [
      { label: t('english'), value: 'en' },
      { label: t('russian'), value: 'ru' },
    ],
  }), [t]);
  
  return (
    <>
      <Text fontSize="xl" fontWeight="semibold">
        {t('bookInformation')}
      </Text>

      <VStack align="stretch" gap={4}>
        <Field.Root required>
          <Field.Label>
            {t('title')} <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.currentTarget.value)}
            placeholder={t('titlePlaceholder')}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>{t('author')}</Field.Label>
          <Input
            value={author}
            onChange={(e) => onAuthorChange(e.currentTarget.value)}
            placeholder={t('authorPlaceholder')}
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>
            {t('language')} <Field.RequiredIndicator />
          </Field.Label>
          <Select.Root
            collection={languageOptions}
            value={[language]}
            onValueChange={(e) => onLanguageChange(e.value[0] as 'en' | 'ru')}
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
                  {languageOptions.items.map((item: { label: string; value: 'en' | 'ru' }) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Field.Root>
      </VStack>
    </>
  );
}
