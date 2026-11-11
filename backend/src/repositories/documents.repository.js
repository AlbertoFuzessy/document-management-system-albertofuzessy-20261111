const fs = require('node:fs/promises');
const path = require('node:path');

const storageDir = path.resolve(
  process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage')
);
const documents = new Map();

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

function getStoredFilePath(storageName) {
  if (path.basename(storageName) !== storageName) {
    throw new Error('Nome interno de armazenamento inválido.');
  }

  return path.join(storageDir, storageName);
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
  listByOwner,
  removeStoredFile,
};