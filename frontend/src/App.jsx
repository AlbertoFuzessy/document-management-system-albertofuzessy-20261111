import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { getDocuments, uploadDocument } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [reloadId, setReloadId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setListError('');
    getDocuments({ signal: controller.signal })
      .then((items) => {
        setDocuments(items);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setListError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [reloadId]);

  async function handleUpload(file) {
    const document = await uploadDocument(file);
    setListError('');
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((item) => item.id !== document.id),
    ]);
    setReloadId((currentId) => currentId + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Document Management System, início">
          <span className="brand-mark" aria-hidden="true">DM</span>
          <span className="brand-name">Document Management System</span>
        </a>
        <span className="topbar-meta">Arquivo digital</span>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <div className="eyebrow">GESTÃO DE DOCUMENTOS / 2026</div>
            <h1>Seus arquivos.</h1>
          </div>
          <span className="heading-index" aria-hidden="true">DMS — 01</span>
        </div>

        <div className="content-grid">
          <UploadComponent onUpload={handleUpload} />
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={listError}
            onRetry={() => setReloadId((currentId) => currentId + 1)}
          />
        </div>
      </main>
    </div>
  );
}
