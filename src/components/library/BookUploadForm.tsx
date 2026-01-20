import { VStack, Field, Input, NativeSelect, Text } from '@chakra-ui/react';

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
  return (
    <>
      <Text fontSize="xl" fontWeight="semibold">
        Book Information
      </Text>

      <VStack align="stretch" gap={4}>
        <Field.Root required>
          <Field.Label>
            Title <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.currentTarget.value)}
            placeholder="Enter book title"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Author</Field.Label>
          <Input
            value={author}
            onChange={(e) => onAuthorChange(e.currentTarget.value)}
            placeholder="Enter author name"
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>
            Language <Field.RequiredIndicator />
          </Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={language}
              onChange={(e) => onLanguageChange(e.currentTarget.value as 'en' | 'ru')}
            >
              <option value="en">English</option>
              <option value="ru">Russian</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </VStack>
    </>
  );
}
