import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, VStack, HStack, Text, Button, Box, Flex, Separator, Dialog, Portal, Alert } from '@chakra-ui/react';
import { MinimalIconButton } from '../ui/MinimalIconButton';
import { BsArrowLeft, BsBook, BsPencil, BsTrash } from 'react-icons/bs';
import { getBook, saveBook, deleteBook, type Book } from '../../utils/db';
import { LibraryFooter } from './LibraryFooter';
import { LanguageSelectionDrawer } from './LanguageSelectionDrawer';
import { SettingsDrawer } from '../settings/SettingsDrawer';
import { BookUploadForm } from './BookUploadForm';
import { useLibrary } from '../../hooks/useLibrary';
import { useI18n } from '../../i18n/useI18n';
import { toaster } from '../ui/toaster';

export function BookDetails() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editLanguage, setEditLanguage] = useState<'en' | 'ru'>('en');
  
  // Use library hook for settings management
  const {
    showSettings,
    setShowSettings,
    showLanguageSelection,
    setShowLanguageSelection,
    autoStopMode,
    showControls,
    settings,
    handleAutoStopModeChange,
    handleShowControlsChange,
    handleSettingsChange,
  } = useLibrary();

  useEffect(() => {
    if (bookId) {
      getBook(bookId).then((loadedBook) => {
        if (loadedBook) {
          setBook(loadedBook);
          setEditTitle(loadedBook.title);
          setEditAuthor(loadedBook.author || '');
          setEditLanguage(loadedBook.language);
        } else {
          navigate('/', { replace: true });
        }
        setLoading(false);
      });
    } else {
      navigate('/', { replace: true });
    }
  }, [bookId, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (book) {
      setEditTitle(book.title);
      setEditAuthor(book.author || '');
      setEditLanguage(book.language);
    }
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!book || !editTitle.trim()) return;
    
    setIsSaving(true);
    try {
      const updatedBook: Book = {
        ...book,
        title: editTitle.trim(),
        author: editAuthor.trim() || undefined,
        language: editLanguage,
      };
      
      await saveBook(updatedBook);
      setBook(updatedBook);
      setIsEditing(false);
      
      toaster.create({
        title: t('bookUpdatedSuccessfully'),
        type: 'success',
        duration: 3000,
      });
    } catch (err) {
      toaster.create({
        title: t('failedToUpdateBook', { error: err instanceof Error ? err.message : 'Unknown error' }),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!book) return;
    
    setIsDeleting(true);
    try {
      await deleteBook(book.id);
      toaster.create({
        title: t('bookDeletedSuccessfully'),
        type: 'success',
        duration: 3000,
      });
      navigate('/', { replace: true });
    } catch (err) {
      toaster.create({
        title: t('failedToDeleteBook', { error: err instanceof Error ? err.message : 'Unknown error' }),
        type: 'error',
        duration: 5000,
      });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <Container
        maxW={{ base: "100%", lg: "1024px", xl: "1280px", "2xl": "1536px" }}
        h="100vh"
        p={0}
        centerContent={false}
        overflowX="hidden"
        display="flex"
        flexDirection="column"
      >
        <Flex flex="1" alignItems="center" justifyContent="center" px={2}>
          <Text>{t('loading')}</Text>
        </Flex>
        <LibraryFooter
          onOpenSettings={() => setShowSettings(true)}
          onOpenLanguageSelection={() => setShowLanguageSelection(true)}
        />
      </Container>
    );
  }

  if (!book) {
    return null;
  }

  const chapterCount = book.structure.volumes.reduce(
    (sum, vol) => sum + vol.chapters.length,
    0
  );

  const volumeCount = book.structure.volumes.length;

  const handleRead = () => {
    navigate(`/book/${book.id}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Container
      maxW={{ base: "100%", lg: "1024px", xl: "1280px", "2xl": "1536px" }}
      h="100vh"
      p={0}
      centerContent={false}
      overflowX="hidden"
      display="flex"
      flexDirection="column"
    >
      <VStack align="stretch" gap={6} flex="1" overflow="auto" px={2} pt={2}>
        {/* Back button and action buttons */}
        <HStack justify="space-between">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="xs"
            minW="auto"
            h="auto"
            p={0}
          >
            <BsArrowLeft /> {t('back')}
          </Button>
          {!isEditing && (
            <MinimalIconButton
              onClick={handleDeleteClick}
              colorPalette="red"
              tooltip={t('delete')}
              aria-label={t('delete')}
            >
              <BsTrash />
            </MinimalIconButton>
          )}
        </HStack>

        {/* Book cover and information - responsive layout */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap={8}
          align={{ base: 'center', md: 'flex-start' }}
          py={8}
        >
          {/* Book cover/silhouette */}
          <Box
            flexShrink={0}
            w="200px"
            h="300px"
            bg="gray.100"
            borderRadius="md"
            borderWidth="2px"
            borderColor="gray.300"
            _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            position="relative"
            overflow="hidden"
            boxShadow="lg"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bgGradient="to-b"
              gradientFrom="gray.50"
              gradientTo="gray.100"
              _dark={{ gradientFrom: 'gray.800', gradientTo: 'gray.700' }}
              opacity={0.5}
            />
            <VStack gap={2} zIndex={1} px={4} textAlign="center">
              <BsBook size={48} />
              <Text fontSize="xs" fontWeight="bold" lineClamp={3}>
                {book.title}
              </Text>
            </VStack>
          </Box>

          {/* Book information */}
          <VStack align="stretch" gap={4} flex="1" width={{ base: '100%', md: 'auto' }} maxW={{ md: '600px' }}>
          {isEditing ? (
            <>
              <Text fontSize="xl" fontWeight="semibold">
                {t('editBook')}
              </Text>
              <BookUploadForm
                title={editTitle}
                author={editAuthor}
                language={editLanguage}
                onTitleChange={setEditTitle}
                onAuthorChange={setEditAuthor}
                onLanguageChange={setEditLanguage}
              />
              <HStack gap={2} width="100%">
                <Button
                  onClick={handleCancelEdit}
                  variant="plain"
                  disabled={isSaving}
                  flexShrink={0}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  colorPalette="green"
                  flex="1"
                  loading={isSaving}
                  disabled={!editTitle.trim()}
                >
                  {t('saveBook')}
                </Button>
              </HStack>
            </>
          ) : (
            <>
              <VStack align="stretch" gap={2}>
                {/* Row 1: Title and Edit button */}
                <HStack justify="space-between" align="flex-start">
                  <Text fontSize="3xl" fontWeight="bold" lineHeight="1.2" flex="1">
                    {book.title}
                  </Text>
                  <MinimalIconButton
                    onClick={handleEdit}
                    tooltip={t('edit')}
                    aria-label={t('edit')}
                    flexShrink={0}
                  >
                    <BsPencil />
                  </MinimalIconButton>
                </HStack>
                
                {/* Row 2: Author and Locale */}
                <HStack justify="space-between" align="center" width="100%">
                  {book.author ? (
                    <Text fontSize="xl" color="gray.600" _dark={{ color: 'gray.400' }}>
                      {book.author}
                    </Text>
                  ) : (
                    <Box />
                  )}
                  <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }} textTransform="uppercase">
                    {locale}
                  </Text>
                </HStack>
              </VStack>

              <Separator />

              <VStack align="stretch" gap={3}>
                <HStack gap={4} flexWrap="wrap">
                  <Box>
                    <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.500' }}>
                      {t('chapters')}
                    </Text>
                    <Text fontSize="lg" fontWeight="semibold">
                      {chapterCount}
                    </Text>
                  </Box>
                  {volumeCount > 1 && (
                    <Box>
                      <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.500' }}>
                        {t('volumes')}
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold">
                        {volumeCount}
                      </Text>
                    </Box>
                  )}
                </HStack>
              </VStack>

              <Separator />

              {/* Read button */}
              <Button
                onClick={handleRead}
                size="lg"
                colorPalette="green"
                width="full"
              >
                <BsBook /> {t('read')}
              </Button>
            </>
          )}
          </VStack>
        </Flex>
      </VStack>

      <LibraryFooter
        onOpenSettings={() => setShowSettings(true)}
        onOpenLanguageSelection={() => setShowLanguageSelection(true)}
      />
      
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        autoStopMode={autoStopMode}
        onAutoStopModeChange={handleAutoStopModeChange}
        showControls={showControls}
        onShowControlsChange={handleShowControlsChange}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
      
      <LanguageSelectionDrawer
        isOpen={showLanguageSelection}
        onClose={() => setShowLanguageSelection(false)}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog.Root open={showDeleteConfirm} onOpenChange={(e) => !e.open && setShowDeleteConfirm(false)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{t('deleteBook')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <Alert.Root status="warning">
                    <Alert.Indicator />
                    <Alert.Title>{t('deleteBookConfirmation')}</Alert.Title>
                  </Alert.Root>
                  {book && (
                    <Text>
                      <strong>{book.title}</strong>
                      {book.author && ` by ${book.author}`}
                    </Text>
                  )}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <HStack justify="flex-end" gap={4} width="full">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="ghost"
                    disabled={isDeleting}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    colorPalette="red"
                    loading={isDeleting}
                  >
                    {t('delete')}
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Container>
  );
}
