const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const storageDir = mkdtempSync(path.join(tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.UPLOAD_MAX_SIZE_BYTES = '8';
process.env.DMS_MAX_STORAGE_BYTES = '8';
process.env.DMS_MAX_DOCUMENTS_PER_OWNER = '2';
process.env.DMS_OWNER_ID = 'test-owner';

const app = require('../src/app');

let server;
let baseUrl;
let uploadedDocument;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  rmSync(storageDir, { recursive: true, force: true });
});

function createUploadForm(contents, fileName = 'document.txt') {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: 'text/plain' }), fileName);
  return form;
}

test('uploada, lista e baixa um documento como anexo binário', async () => {
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('data'),
  });

  assert.equal(uploadResponse.status, 201, await uploadResponse.clone().text());
  uploadedDocument = (await uploadResponse.json()).document;
  assert.equal(uploadedDocument.size, 4);
  assert.equal(uploadedDocument.owner, 'test-owner');

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.deepEqual((await listResponse.json()).documents, [uploadedDocument]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /^attachment;/);
  assert.equal(await downloadResponse.text(), 'data');
});

test('rejeita upload sem arquivo e multipart com campos extras', async () => {
  const emptyResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(emptyResponse.status, 400);
  assert.equal((await emptyResponse.json()).error.code, 'FILE_REQUIRED');

  const form = createUploadForm('x');
  form.append('description', 'campo não permitido');
  const extraFieldResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.equal(extraFieldResponse.status, 400);
});

test('rejeita arquivo acima do limite individual', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('123456789'),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
});

test('rejeita upload que excede a quota e remove o arquivo temporário', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('12345'),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'STORAGE_QUOTA_EXCEEDED');
  assert.equal(readdirSync(storageDir).length, 1);
});

test('rejeita novo documento após atingir a quantidade máxima', async () => {
  const secondDocumentResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('1234', 'second.txt'),
  });
  assert.equal(secondDocumentResponse.status, 201);

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm(''),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'DOCUMENT_LIMIT_EXCEEDED');
  assert.equal(readdirSync(storageDir).length, 2);
});

test('ID com componentes de caminho não permite baixar arquivo arbitrário', async () => {
  const documentId = encodeURIComponent('../etc/passwd');
  const response = await fetch(`${baseUrl}/documents/${documentId}/download`);

  assert.equal(response.status, 404);
});