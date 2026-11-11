const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const documentsConfig = require('../config/documents.config');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(documentsConfig.storageDir, { recursive: true }, (error) => {
        callback(error, documentsConfig.storageDir);
      });
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  }),
  limits: {
    files: 1,
    fileSize: documentsConfig.maxUploadSizeBytes,
    fields: 0,
    fieldNameSize: 100,
    fieldSize: 1024,
    headerPairs: 100,
  },
  fileFilter(req, file, callback) {
    if (documentsConfig.allowedMimeTypes.length
      && !documentsConfig.allowedMimeTypes.includes(file.mimetype)) {
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
    const tooManyFiles = ['LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(error.code);

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

  if (error.code === 'STORAGE_QUOTA_EXCEEDED' || error.code === 'DOCUMENT_LIMIT_EXCEEDED') {
    return res.status(413).json({
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