const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');
const documentsConfig = require('../config/documents.config');

async function rejectUpload(file, code, message) {
  await documentsRepository.removeStoredFile(file.filename);
  const error = new Error(message);
  error.code = code;
  throw error;
}

async function createDocument(file, owner) {
  const usage = documentsRepository.getOwnerUsage(owner);
  if (usage.documentCount >= documentsConfig.maxDocumentsPerOwner) {
    await rejectUpload(
      file,
      'DOCUMENT_LIMIT_EXCEEDED',
      'O limite de documentos para este usuário foi atingido.'
    );
  }

  if (usage.totalBytes + file.size > documentsConfig.maxStorageBytes) {
    await rejectUpload(
      file,
      'STORAGE_QUOTA_EXCEEDED',
      'O limite de armazenamento para este usuário foi atingido.'
    );
  }

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