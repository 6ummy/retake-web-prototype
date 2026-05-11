import { buildInviteUrl as buildInviteRouteUrl, buildPrototypeUrl } from './routes.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

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

export async function uploadFrame({ frameDataUrl, frameName }) {
  return requestJson('/api/upload-frame', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ frameDataUrl, frameName }),
  });
}

export async function createInvite({ frameUrl, frameName, username }) {
  return requestJson('/api/invite', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ frameUrl, frameName, username }),
  });
}

export async function fetchInvite({ id }) {
  return requestJson(`/api/invite?id=${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

export function buildRequestInviteUrl({ requestId, origin }) {
  return buildInviteRouteUrl(requestId, origin);
}

export function buildLegacyInviteUrl({ frameUrl, frameName, origin }) {
  const inviteUrl = new URL(buildPrototypeUrl('/invitee', origin));
  inviteUrl.searchParams.set('frame', frameUrl);
  inviteUrl.searchParams.set('name', frameName || 'my frame');
  return inviteUrl.toString();
}

export async function signup({ email }) {
  return requestJson('/api/signup', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
}
