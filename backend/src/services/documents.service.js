const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

async function createDocument(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype || 'application/octet-stream',
    storageName: file.filename,
  };

  try {
    return documentsRepository.create(document);
  } catch (error) {
    await documentsRepository.removeStoredFile(file.filename);
    throw error;
  }
}

function listDocuments(owner) {
  return documentsRepository.listByOwner(owner);
}

function getDocumentDownload(id, owner) {
  return documentsRepository.findDownloadByIdAndOwner(id, owner);
}

module.exports = {
  createDocument,
  getDocumentDownload,
  listDocuments,
};