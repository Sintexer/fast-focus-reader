import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Field,
  NativeSelect,
  Switch,
  Separator,
  Alert,
  Code,
  FileUpload,
  Dialog,
  Portal,
  CloseButton,
} from '@chakra-ui/react';
import { saveBook, type Book } from '../utils/db';
import { parseTextToBook, parseFileToBook } from '../utils/bookParser';
import { toaster } from './ui/toaster';

type UploadMode = 'file' | 'text';

const SUPPORTED_FILE_TYPES = ['.txt', '.epub', '.fb2'];
const MAX_PREVIEW_LENGTH = 500; // Characters to show in preview

interface BookUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onBookSaved?: () => void;
}

export function BookUpload({ isOpen, onClose, onBookSaved }: BookUploadProps) {
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
      setError(`Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`);
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
      setError(`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      setError('Please enter some text');
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
      setError(`Failed to process text: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        title: title || 'Untitled Book',
        author: author || undefined,
        language,
      };
      
      await saveBook(updatedBook);
      
      toaster.create({
        title: 'Book saved successfully',
        type: 'success',
        duration: 3000,
      });
      
      // Reset form and close
      handleClose();
      onBookSaved?.();
    } catch (err) {
      setError(`Failed to save book: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
  
  const getPreviewSamples = (): Array<{ chapterTitle?: string; text: string }> => {
    if (!book) return [];
    
    const samples: Array<{ chapterTitle?: string; text: string }> = [];
    let totalLength = 0;
    let lastChapterTitle: string | undefined;
    
    for (const volume of book.structure.volumes) {
      for (const chapter of volume.chapters) {
        if (chapter.paragraphs && chapter.paragraphs.length > 0) {
          // Add chapter title if it's different from the last one
          if (chapter.title && chapter.title !== lastChapterTitle) {
            lastChapterTitle = chapter.title;
          }
          
          for (const paragraph of chapter.paragraphs) {
            const paragraphText = paragraph.join(' ');
            if (totalLength + paragraphText.length > MAX_PREVIEW_LENGTH) {
              // Add partial paragraph if we have space
              const remaining = MAX_PREVIEW_LENGTH - totalLength;
              if (remaining > 50) {
                samples.push({
                  chapterTitle: lastChapterTitle,
                  text: paragraphText.slice(0, remaining) + '...',
                });
              }
              return samples;
            }
            samples.push({
              chapterTitle: lastChapterTitle,
              text: paragraphText,
            });
            totalLength += paragraphText.length;
            lastChapterTitle = undefined; // Only show chapter title for first paragraph
          }
        }
      }
      
      // Limit to first few chapters
      if (samples.length >= 5) break;
    }
    
    return samples;
  };
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="lg" scrollBehavior="inside">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH="90vh">
            <Dialog.Header>
              <Dialog.Title>Upload Book</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            
            <Dialog.Body>
              <VStack align="stretch" gap={6}>
                {!book && (
                  <>
                    {/* Upload mode switch */}
                    <HStack justify="space-between" align="center">
                      <Text>Upload Mode:</Text>
                      <HStack>
                        <Text fontSize="sm" color={uploadMode === 'file' ? 'blue.500' : 'gray.500'}>
                          File Upload
                        </Text>
                        <Switch.Root
                          checked={uploadMode === 'text'}
                          onCheckedChange={(e) => {
                            setUploadMode(e.checked ? 'text' : 'file');
                            setTextInput('');
                            setError(null);
                          }}
                        >
                          <Switch.HiddenInput />
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch.Root>
                        <Text fontSize="sm" color={uploadMode === 'text' ? 'blue.500' : 'gray.500'}>
                          Text Input
                        </Text>
                      </HStack>
                    </HStack>
                    
                    <Separator />
                    
                    {/* File upload mode */}
                    {uploadMode === 'file' && (
                      <VStack align="stretch" gap={4}>
                        <Field.Root>
                          <Field.Label>Select File</Field.Label>
                          <FileUpload.Root
                            accept={SUPPORTED_FILE_TYPES.join(',')}
                            onFileChange={handleFileChange}
                            maxFiles={1}
                          >
                            <FileUpload.HiddenInput />
                            <FileUpload.Trigger asChild>
                              <Button colorPalette="blue" width="full" loading={loading}>
                                Choose File
                              </Button>
                            </FileUpload.Trigger>
                            <FileUpload.List showSize clearable />
                          </FileUpload.Root>
                        </Field.Root>
                        
                        <Text fontSize="xs" color="fg.muted">
                          Supported file types: {SUPPORTED_FILE_TYPES.join(', ')}
                        </Text>
                      </VStack>
                    )}
                    
                    {/* Text input mode */}
                    {uploadMode === 'text' && (
                      <VStack align="stretch" gap={4}>
                        <Field.Root>
                          <Field.Label>Paste Text</Field.Label>
                          <Textarea
                            value={textInput}
                            onChange={handleTextInputChange}
                            placeholder="Paste your book text here..."
                            rows={10}
                            resize="vertical"
                          />
                        </Field.Root>
                        
                        <Button
                          onClick={handleProcessText}
                          colorPalette="blue"
                          loading={loading}
                          disabled={!textInput.trim()}
                        >
                          Process Text
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
                          onChange={(e) => setTitle(e.currentTarget.value)}
                          placeholder="Enter book title"
                        />
                      </Field.Root>
                      
                      <Field.Root>
                        <Field.Label>Author</Field.Label>
                        <Input
                          value={author}
                          onChange={(e) => setAuthor(e.currentTarget.value)}
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
                            onChange={(e) => setLanguage(e.currentTarget.value as 'en' | 'ru')}
                          >
                            <option value="en">English</option>
                            <option value="ru">Russian</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                    </VStack>
                    
                    <Separator />
                    
                    {/* Preview samples */}
                    <VStack align="stretch" gap={4}>
                      <Text fontSize="lg" fontWeight="semibold">
                        Preview (First Chapters)
                      </Text>
                      
                      <Box
                        p={4}
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor="gray.200"
                        _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
                        bg="gray.50"
                        maxH="300px"
                        overflowY="auto"
                      >
                        <VStack align="stretch" gap={3}>
                          {getPreviewSamples().map((sample, index) => (
                            <Box key={index}>
                              {sample.chapterTitle && (
                                <Text
                                  fontSize="sm"
                                  fontWeight="semibold"
                                  color="blue.600"
                                  _dark={{ color: 'blue.400' }}
                                  mb={1}
                                >
                                  {sample.chapterTitle}
                                </Text>
                              )}
                              <Code
                                display="block"
                                p={2}
                                fontSize="xs"
                                whiteSpace="pre-wrap"
                                wordBreak="break-word"
                                bg="transparent"
                                color="gray.700"
                                _dark={{ color: 'gray.300' }}
                              >
                                {sample.text}
                              </Code>
                            </Box>
                          ))}
                          {getPreviewSamples().length === 0 && (
                            <Text fontSize="sm" color="gray.500">
                              No preview available
                            </Text>
                          )}
                        </VStack>
                      </Box>
                      
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        This preview shows the first few paragraphs to help verify the import. The content cannot be edited here.
                      </Text>
                    </VStack>
                  </>
                )}
              </VStack>
            </Dialog.Body>
            
            {book && (
              <Dialog.Footer>
                <HStack justify="flex-end" gap={4} width="full">
                  <Button onClick={handleClose} variant="ghost">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    colorPalette="blue"
                    loading={loading}
                    disabled={!title.trim()}
                  >
                    Save Book
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
