import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Reader } from './components/Reader';
import { Library } from './components/library/Library';
import { BookDetails } from './components/library/BookDetails';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './i18n/useI18n';

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/book/:bookId/details" element={<BookDetails />} />
            <Route path="/book/:bookId" element={<Reader />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App
