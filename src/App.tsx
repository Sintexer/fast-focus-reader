import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Reader } from './components/Reader';
import { Library } from './components/Library';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/book/:bookId" element={<Reader />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App
