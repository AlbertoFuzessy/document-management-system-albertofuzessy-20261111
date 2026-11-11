import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  return (
    <section className="document-section" aria-labelledby="documents-title">
      <div className="list-heading">
        <div>
          <div className="section-kicker">02 / ARQUIVO</div>
          <h2 id="documents-title">Documentos</h2>
        </div>
        <span className="document-count">{documents.length.toString().padStart(2, '0')} itens</span>
      </div>

      {isLoading ? (
        <p className="list-message" role="status">Carregando documentos...</p>
      ) : error ? (
        <div className="list-message list-error" role="alert">
          <span>{error}</span>
          <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
        </div>
      ) : documents.length === 0 ? (
        <p className="list-message">Nenhum documento encontrado.</p>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <div className="file-mark" aria-hidden="true">DOC</div>
              <div className="document-details">
                <h3 title={document.originalName}>{document.originalName}</h3>
                <p>{formatFileSize(document.size)} <span aria-hidden="true">/</span> {formatDate(document.uploadedAt)}</p>
              </div>
              <DownloadButton documentId={document.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
