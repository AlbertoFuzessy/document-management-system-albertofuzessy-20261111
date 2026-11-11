const path = require('node:path');

function readPositiveInteger(name, defaultValue) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim() === '') {
    return defaultValue;
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }

  return value;
}

const storageDir = path.resolve(
  process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage')
);

module.exports = {
  allowedMimeTypes: (process.env.UPLOAD_ALLOWED_MIME_TYPES || '')
    .split(',')
    .map((mimeType) => mimeType.trim())
    .filter(Boolean),
  maxDocumentsPerOwner: readPositiveInteger('DMS_MAX_DOCUMENTS_PER_OWNER', 1000),
  maxStorageBytes: readPositiveInteger('DMS_MAX_STORAGE_BYTES', 100 * 1024 * 1024),
  maxUploadSizeBytes: readPositiveInteger('UPLOAD_MAX_SIZE_BYTES', 10 * 1024 * 1024),
  storageDir,
};