const API_PREFIX = '/api';

async function request(path, options) {
  let response;

  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';

    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      // Mantém a mensagem padrão quando a resposta não contém JSON.
    }

    throw new Error(message);
  }

  return response;
}

export async function getDocuments(options = {}) {
  const response = await request('/documents', options);
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  const contentDisposition = response.headers.get('Content-Disposition') || '';
  const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  let fileName = `document-${id}`;

  if (fileNameMatch?.[1]) {
    try {
      fileName = decodeURIComponent(fileNameMatch[1]);
    } catch {
      fileName = fileNameMatch[1];
    }
  } else if (fileNameMatch?.[2]) {
    fileName = fileNameMatch[2];
  }

  return {
    blob: await response.blob(),
    fileName,
  };
}
