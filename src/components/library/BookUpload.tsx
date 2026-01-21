import { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  Field,
  Separator,
  Alert,
  FileUpload,
  Dialog,
  Portal,
  CloseButton,
} from '@chakra-ui/react';
import { saveBook, type Book } from '../../utils/db';
import { parseTextToBook, parseFileToBook } from '../../utils/bookParser';
import { toaster } from '../ui/toaster';
import { UploadModeSwitch } from './UploadModeSwitch';
import { BookPreview } from './BookPreview';
import { BookUploadForm } from './BookUploadForm';
import { useI18n } from '../../i18n/useI18n';

type UploadMode = 'file' | 'text';

const SUPPORTED_FILE_TYPES = ['.txt', '.epub', '.fb2'];

interface BookUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onBookSaved?: () => void;
}

export function BookUpload({ isOpen, onClose, onBookSaved }: BookUploadProps) {
  const { t } = useI18n();
  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [textInput, setTextInput] = useState('');
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  
  const handleFileChange = async (details: { acceptedFiles: File[] }) => {
    const selectedFile = details.acceptedFiles[0];
    if (!selectedFile) return;
    
    // Validate file type
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      setError(t('unsupportedFileType', { types: SUPPORTED_FILE_TYPES.join(', ') }));
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      let parsedBook: Book;
      
      if (fileExtension === '.txt') {
        // For TXT, read as text and use text parser
        const text = await selectedFile.text();
        parsedBook = parseTextToBook(text, {
          title: title || selectedFile.name.replace(/\.(txt|epub|fb2)$/i, ''),
          author: author || undefined,
          language,
        });
      } else {
        // For EPUB and FB2, use file parser
        parsedBook = await parseFileToBook(selectedFile, {
          title: title || selectedFile.name.replace(/\.(txt|epub|fb2)$/i, ''),
          author: author || undefined,
          language,
        });
      }
      
      setBook(parsedBook);
      setTitle(parsedBook.title);
      setAuthor(parsedBook.author || '');
      setLanguage(parsedBook.language);
    } catch (err) {
      setError(t('failedToProcessFile', { error: err instanceof Error ? err.message : 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleTextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(event.currentTarget.value);
    setError(null);
  };
  
  const handleProcessText = async () => {
    if (!textInput.trim()) {
      setError(t('pleaseEnterText'));
      return;
    }
    
    await processText(textInput, 'Pasted Text');
  };
  
  const processText = async (text: string, sourceName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Parse text to book structure
      const parsedBook = parseTextToBook(text, {
        title: title || sourceName.replace(/\.(txt|epub|fb2)$/i, ''),
        author: author || undefined,
        language,
      });
      
      setBook(parsedBook);
      setTitle(parsedBook.title);
      setAuthor(parsedBook.author || '');
      setLanguage(parsedBook.language);
    } catch (err) {
      setError(t('failedToProcessText', { error: err instanceof Error ? err.message : 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!book) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update book with form values
      const updatedBook: Book = {
        ...book,
        title: title || t('untitledBook'),
        author: author || undefined,
        language,
      };
      
      await saveBook(updatedBook);
      
      toaster.create({
        title: t('bookSavedSuccessfully'),
        type: 'success',
        duration: 3000,
      });
      
      // Reset form and close
      handleClose();
      onBookSaved?.();
    } catch (err) {
      setError(t('failedToSaveBook', { error: err instanceof Error ? err.message : 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    // Reset state
    setBook(null);
    setTextInput('');
    setTitle('');
    setAuthor('');
    setLanguage('en');
    setError(null);
    setUploadMode('file');
    onClose();
  };
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="lg" scrollBehavior="inside">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH="90vh">
            <Dialog.Header>
              <Dialog.Title>{t('uploadBook')}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            
            <Dialog.Body>
              <VStack align="stretch" gap={6}>
                {!book && (
                  <>
                    <UploadModeSwitch
                      mode={uploadMode}
                      onModeChange={(mode) => {
                        setUploadMode(mode);
                        setTextInput('');
                        setError(null);
                      }}
                    />
                    
                    <Separator />
                    
                    {/* File upload mode */}
                    {uploadMode === 'file' && (
                      <VStack align="stretch" gap={4}>
                        <Field.Root>
                          <FileUpload.Root
                            accept={SUPPORTED_FILE_TYPES.join(',')}
                            onFileChange={handleFileChange}
                            maxFiles={1}
                          >
                            <FileUpload.HiddenInput />
                            <FileUpload.Trigger asChild>
                              <Button colorPalette="green" width="full" loading={loading}>
                                {t('chooseFile')}
                              </Button>
                            </FileUpload.Trigger>
                            <FileUpload.List showSize clearable />
                          </FileUpload.Root>
                        </Field.Root>
                        
                        <Text fontSize="xs" color="fg.muted">
                          {t('supportedFileTypes')}: {SUPPORTED_FILE_TYPES.join(', ')}
                        </Text>
                      </VStack>
                    )}
                    
                    {/* Text input mode */}
                    {uploadMode === 'text' && (
                      <VStack align="stretch" gap={4}>
                        <Field.Root>
                          <Field.Label>{t('pasteText')}</Field.Label>
                          <Textarea
                            value={textInput}
                            onChange={handleTextInputChange}
                            placeholder={t('pasteTextPlaceholder')}
                            rows={10}
                            resize="vertical"
                          />
                        </Field.Root>
                        
                        <Button
                          onClick={handleProcessText}
                          colorPalette="green"
                          loading={loading}
                          disabled={!textInput.trim()}
                        >
                          {t('processText')}
                        </Button>
                      </VStack>
                    )}
                  </>
                )}
                
                {/* Error display */}
                {error && (
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Title>{error}</Alert.Title>
                  </Alert.Root>
                )}
                
                {/* Book form and preview */}
                {book && (
                  <>
                    <Separator />
                    
                    <BookUploadForm
                      title={title}
                      author={author}
                      language={language}
                      onTitleChange={setTitle}
                      onAuthorChange={setAuthor}
                      onLanguageChange={setLanguage}
                    />
                    
                    <Separator />
                    
                    <BookPreview book={book} />
                  </>
                )}
              </VStack>
            </Dialog.Body>
            
            {book && (
              <Dialog.Footer>
                <HStack justify="flex-end" gap={4} width="full">
                  <Button onClick={handleClose} variant="ghost">
                    {t('cancel')}
                  </Button>
                  <Button
                    onClick={handleSave}
                    colorPalette="green"
                    loading={loading}
                    disabled={!title.trim()}
                  >
                    {t('saveBook')}
                  </Button>
                </HStack>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
