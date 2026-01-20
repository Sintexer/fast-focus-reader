import { VStack, Field, Input, NativeSelect, Text } from '@chakra-ui/react';
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
          <NativeSelect.Root>
            <NativeSelect.Field
              value={language}
              onChange={(e) => onLanguageChange(e.currentTarget.value as 'en' | 'ru')}
            >
              <option value="en">{t('english')}</option>
              <option value="ru">{t('russian')}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </VStack>
    </>
  );
}
