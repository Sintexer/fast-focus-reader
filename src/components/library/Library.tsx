import { VStack, Box } from '@chakra-ui/react';
import { BookUpload } from './BookUpload';
import { LanguageSelectionDrawer } from './LanguageSelectionDrawer';
import { SettingsDrawer } from '../settings/SettingsDrawer';
import { LibraryHeader } from './LibraryHeader';
import { BookGrid } from './BookGrid';
import { LibraryContainer, LibraryEmptyState } from './LibraryContainer';
import { useLibrary } from '../../hooks/useLibrary';
import { useI18n } from '../../i18n/useI18n';

export function Library() {
  const { t } = useI18n();
  const {
    books,
    sortedBooks,
    loading,
    uploadModalOpen,
    setUploadModalOpen,
    showSettings,
    setShowSettings,
    showLanguageSelection,
    setShowLanguageSelection,
    autoStopMode,
    showControls,
    settings,
    loadBooks,
    handleAutoStopModeChange,
    handleShowControlsChange,
    handleSettingsChange,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
  } = useLibrary();

  if (loading) {
    return (
      <LibraryEmptyState
        message={t('loadingBooks')}
        onOpenSettings={() => setShowSettings(true)}
        onOpenLanguageSelection={() => setShowLanguageSelection(true)}
      />
    );
  }

  if (books.length === 0) {
    return (
      <LibraryEmptyState
        message={t('noBooksAvailable')}
        onOpenSettings={() => setShowSettings(true)}
        onOpenLanguageSelection={() => setShowLanguageSelection(true)}
      />
    );
  }

  return (
    <LibraryContainer
      onOpenSettings={() => setShowSettings(true)}
      onOpenLanguageSelection={() => setShowLanguageSelection(true)}
    >
      <VStack align="stretch" gap={6} flex="1" overflow="auto" pt={2}>
        <Box px={2}>
          <LibraryHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={setSortField}
            onSortDirectionChange={setSortDirection}
          />
        </Box>
        <BookGrid books={sortedBooks} onAddBook={() => setUploadModalOpen(true)} />
      </VStack>
      
      <BookUpload
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onBookSaved={loadBooks}
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
    </LibraryContainer>
  );
}
