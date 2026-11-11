const documentsService = require('../services/documents.service');

function getOwner() {
  return process.env.DMS_OWNER_ID || 'local-user';
}

async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie um arquivo no campo "file".',
      },
    });
  }

  const document = await documentsService.createDocument(req.file, getOwner());
  return res.status(201).json({ document });
}

function list(req, res) {
  const documents = documentsService.listDocuments(getOwner());
  return res.status(200).json({ documents });
}

async function download(req, res, next) {
  const result = await documentsService.getDocumentDownload(req.params.id, getOwner());
  if (!result) {
    return res.status(404).json({
      error: {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      },
    });
  }

  res.type('application/octet-stream');
  return res.download(result.filePath, result.document.originalName, (error) => {
    if (error) {
      return next(error);
    }
  });
}

module.exports = {
  download,
  list,
  upload,
};