import { useRef, useState } from 'react';

export default function UploadComponent({ onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    setError('');
    setSuccess('');
    setIsUploading(true);

    try {
      await onUpload(file);
      setSuccess('Documento enviado.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] || null);
    setError('');
    setSuccess('');
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="section-kicker">01 / ENTRADA</div>
      <h2 id="upload-title">Adicionar documento</h2>
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="document-file">Arquivo</label>
        <input
          ref={inputRef}
          id="document-file"
          name="file"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {file && <p className="selected-file" title={file.name}>{file.name}</p>}
        <button className="button button-primary upload-submit" type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
      {error && <p className="form-feedback feedback-error" role="alert">{error}</p>}
      {success && <p className="form-feedback feedback-success" role="status">{success}</p>}
    </section>
  );
}
