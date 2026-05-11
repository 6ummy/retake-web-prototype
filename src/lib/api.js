import { upload } from '@vercel/blob/client';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function apiUrl(path) {
  const base = import.meta.env.VITE_API_ORIGIN || '';
  return `${base}${path}`;
}

async function readJsonOrNull(response) {
  return response.json().catch(() => null);
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await readJsonOrNull(response);

  if (!response.ok) {
    throw new Error(body?.detail || body?.error || `Request failed with ${response.status}`);
  }

  if (!body || typeof body !== 'object') {
    throw new Error(`Expected JSON response from ${url}`);
  }

  return body;
}

export async function signup({ email }) {
  return requestJson(apiUrl('/api/signup'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
}

export async function uploadFrame({ frameDataUrl, frameName }) {
  return requestJson(apiUrl('/api/upload-frame'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ frameDataUrl, frameName }),
  });
}

export async function createInvite({ frameUrl, frameName, username }) {
  return requestJson(apiUrl('/api/invite'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ frameUrl, frameName, username }),
  });
}

export async function getInvite({ id }) {
  const params = new URLSearchParams({ id });
  return requestJson(apiUrl(`/api/invite?${params.toString()}`));
}

export async function recordRetake({ inviteId, mediaUrl, mediaType, mode, frameName, username }) {
  return requestJson(apiUrl('/api/retake'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ inviteId, mediaUrl, mediaType, mode, frameName, username }),
  });
}

export async function uploadRetakeMedia({ inviteId, mode, filename, blob }) {
  return upload(`retakes/${inviteId}/${filename}`, blob, {
    access: 'public',
    handleUploadUrl: apiUrl('/api/blob-upload'),
    clientPayload: JSON.stringify({ inviteId, mode }),
  });
}
