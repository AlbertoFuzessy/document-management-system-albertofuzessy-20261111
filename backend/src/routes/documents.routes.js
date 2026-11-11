const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDir = path.resolve(
  process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage')
);
const configuredMaxSize = Number(process.env.UPLOAD_MAX_SIZE_BYTES || 10 * 1024 * 1024);

if (!Number.isSafeInteger(configuredMaxSize) || configuredMaxSize <= 0) {
  throw new Error('UPLOAD_MAX_SIZE_BYTES deve ser um inteiro positivo.');
}

const allowedMimeTypes = (process.env.UPLOAD_ALLOWED_MIME_TYPES || '')
  .split(',')
  .map((mimeType) => mimeType.trim())
  .filter(Boolean);

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDir, { recursive: true }, (error) => {
        callback(error, storageDir);
      });
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  }),
  limits: {
    files: 1,
    fileSize: configuredMaxSize,
  },
  fileFilter(req, file, callback) {
    if (allowedMimeTypes.length && !allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error('Tipo de arquivo não permitido.');
      error.code = 'FILE_TYPE_NOT_ALLOWED';
      return callback(error);
    }

    return callback(null, true);
  },
});

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, next);
}, documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

router.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    const tooManyFiles = error.code === 'LIMIT_FILE_COUNT';

    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : tooManyFiles ? 'TOO_MANY_FILES' : 'INVALID_UPLOAD',
        message: tooLarge
          ? 'O arquivo excede o tamanho máximo permitido.'
          : 'Não foi possível processar o arquivo enviado.',
      },
    });
  }

  if (error.code === 'FILE_TYPE_NOT_ALLOWED') {
    return res.status(400).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro interno ao processar a solicitação.',
    },
  });
});

module.exports = router;