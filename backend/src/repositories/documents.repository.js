const fs = require('node:fs/promises');
const path = require('node:path');
const documentsConfig = require('../config/documents.config');

const documents = new Map();

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

function getStoredFilePath(storageName) {
  if (path.basename(storageName) !== storageName) {
    throw new Error('Nome interno de armazenamento inválido.');
  }

  return path.join(documentsConfig.storageDir, storageName);
}

function create(document) {
  documents.set(document.id, document);
  return toPublicDocument(document);
}

function listByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(toPublicDocument);
}

function getOwnerUsage(owner) {
  const ownedDocuments = [...documents.values()].filter((document) => document.owner === owner);
  return {
    documentCount: ownedDocuments.length,
    totalBytes: ownedDocuments.reduce((total, document) => total + document.size, 0),
  };
}

async function findDownloadByIdAndOwner(id, owner) {
  const document = documents.get(id);
  if (!document || document.owner !== owner) {
    return null;
  }

  return {
    document: toPublicDocument(document),
    filePath: getStoredFilePath(document.storageName),
  };
}

async function removeStoredFile(storageName) {
  try {
    await fs.unlink(getStoredFilePath(storageName));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  create,
  findDownloadByIdAndOwner,
  getOwnerUsage,
  listByOwner,
  removeStoredFile,
};