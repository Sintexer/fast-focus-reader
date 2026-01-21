import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllBooks, saveBook, getSettingsOrDefault, saveSettings, type Book, type Settings } from '../utils/db';
import { createSampleBooks } from '../components/library/sampleBooks';
import type { AutoStopMode } from '../components/settings/types';
import type { SortOption, SortField, SortDirection } from '../components/library/BookSort';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [autoStopMode, setAutoStopMode] = useState<AutoStopMode>('sentence');
  const [showControls, setShowControls] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('lastReadAt-desc');

  // Load settings on mount
  useEffect(() => {
    getSettingsOrDefault().then((s) => {
      setSettings(s);
      if (s.autoStopMode) {
        setAutoStopMode(s.autoStopMode);
      }
      if (s.showControls !== undefined) {
        setShowControls(s.showControls);
      }
    });
  }, []);

  const loadBooks = useCallback(async () => {
    const loadedBooks = await getAllBooks();
    
    // Initialize sample books if they don't exist
    if (loadedBooks.length === 0) {
      const sampleBooks = createSampleBooks();
      
      for (const book of sampleBooks) {
        await saveBook(book);
      }
      
      // Reload books after saving
      const updatedBooks = await getAllBooks();
      setBooks(updatedBooks);
    } else {
      setBooks(loadedBooks);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleAutoStopModeChange = useCallback(async (mode: AutoStopMode) => {
    setAutoStopMode(mode);
    if (settings) {
      const updatedSettings: Settings = {
        ...settings,
        autoStopMode: mode,
      };
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
    }
  }, [settings]);

  const handleShowControlsChange = useCallback(async (show: boolean) => {
    setShowControls(show);
    if (settings) {
      const updatedSettings: Settings = {
        ...settings,
        showControls: show,
      };
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
    }
  }, [settings]);

  const handleSettingsChange = useCallback(async (updatedSettings: Settings) => {
    await saveSettings(updatedSettings);
    setSettings(updatedSettings);
  }, []);

  // Sort books based on current sort settings
  const sortedBooks = useMemo(() => {
    const booksCopy = [...books];
    const [sortField, sortDirection] = sortOption.split('-') as [SortField, SortDirection];
    
    booksCopy.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortField) {
        case 'lastReadAt':
          aValue = a.lastReadAt ?? 0;
          bValue = b.lastReadAt ?? 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return booksCopy;
  }, [books, sortOption]);

  return {
    books,
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
    sortedBooks,
    sortOption,
    setSortOption,
  };
}
