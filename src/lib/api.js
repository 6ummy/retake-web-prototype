import { upload } from '@vercel/blob/client';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const LOCAL_INVITES_KEY = 'retake.localInvites.v1';
const LOCAL_RETAKES_KEY = 'retake.localRetakes.v1';

function useLocalPrototypeApi() {
  return import.meta.env.DEV && !import.meta.env.VITE_API_ORIGIN;
}

function apiUrl(path) {
  const base = import.meta.env.VITE_API_ORIGIN || '';
  return `${base}${path}`;
}

function makeLocalId() {
  const cryptoId = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 18);
  return cryptoId || Math.random().toString(36).slice(2, 20);
}

function readLocalRecord(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

// localStorage on iOS Safari has a hard ~5 MB quota per origin. Since the DEV
// fake-backend stores entire image/video data URLs (1–2 MB each), the quota is
// blown after only a handful of invites or retakes. Rather than letting the
// app crash, drop the oldest entries and retry, then silently skip if even
// pruning can't make room. Real production code stores blobs in Vercel Blob
// instead of localStorage, so this only matters in dev.
function isQuotaError(err) {
  if (!err) return false;
  return err.name === 'QuotaExceededError'
    || err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || err.code === 22
    || err.code === 1014;
}

function pruneOldestEntries(record, targetCount) {
  // Records are keyed by id; values may have `createdAt` we can sort on.
  const entries = Object.entries(record);
  entries.sort((a, b) => {
    const av = a[1]?.createdAt || '';
    const bv = b[1]?.createdAt || '';
    return av.localeCompare(bv);
  });
  const next = {};
  for (const [k, v] of entries.slice(-targetCount)) next[k] = v;
  return next;
}

function writeLocalRecord(key, value) {
  let payload = value;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
      return;
    } catch (err) {
      if (!isQuotaError(err)) return;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const keep = Math.max(1, Math.floor(Object.keys(payload).length / 2));
        payload = pruneOldestEntries(payload, keep);
        continue;
      }
      // Non-object payload (or already pruned to nothing): give up silently so
      // the calling flow can keep working with in-memory state only.
      console.warn(`[api] localStorage quota exceeded for "${key}"; skipping persistence.`);
      try { window.localStorage.removeItem(key); } catch { /* ignore */ }
      return;
    }
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read media'));
    reader.readAsDataURL(blob);
  });
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
  if (useLocalPrototypeApi()) {
    return {
      url: frameDataUrl,
      pathname: `local-frames/${makeLocalId()}.png`,
      frameName,
    };
  }

  return requestJson(apiUrl('/api/upload-frame'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ frameDataUrl, frameName }),
  });
}

export async function createInvite({ frameUrl, frameName, username }) {
  if (useLocalPrototypeApi()) {
    const id = makeLocalId();
    const invites = readLocalRecord(LOCAL_INVITES_KEY);
    const invite = {
      id,
      frameUrl,
      frameName: frameName || 'my frame',
      username: username || 'yunchai',
      createdAt: new Date().toISOString(),
    };
    invites[id] = invite;
    writeLocalRecord(LOCAL_INVITES_KEY, invites);
    return {
      ...invite,
      inviteUrl: new URL(`/invite/${id}`, window.location.origin).toString(),
    };
  }

  return requestJson(apiUrl('/api/invite'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ frameUrl, frameName, username }),
  });
}

export async function getInvite({ id }) {
  if (useLocalPrototypeApi()) {
    const invite = readLocalRecord(LOCAL_INVITES_KEY)[id];
    if (!invite && id === 'demo') {
      return {
        id: 'demo',
        frameUrl: '/canvas-frame-teletubby.png',
        frameName: 'demo frame',
        username: 'yunchai',
      };
    }
    if (!invite) throw new Error('Invite not found');
    return invite;
  }

  const params = new URLSearchParams({ id });
  return requestJson(apiUrl(`/api/invite?${params.toString()}`));
}

export async function recordRetake({ inviteId, mediaUrl, mediaType, mode, frameName, username }) {
  if (useLocalPrototypeApi()) {
    const retakes = readLocalRecord(LOCAL_RETAKES_KEY);
    retakes[inviteId] = [
      ...(retakes[inviteId] || []),
      { mediaUrl, mediaType, mode, frameName, username, createdAt: new Date().toISOString() },
    ];
    writeLocalRecord(LOCAL_RETAKES_KEY, retakes);
    return { ok: true };
  }

  return requestJson(apiUrl('/api/retake'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ inviteId, mediaUrl, mediaType, mode, frameName, username }),
  });
}

export async function uploadRetakeMedia({ inviteId, mode, filename, blob }) {
  if (useLocalPrototypeApi()) {
    return {
      url: await blobToDataUrl(blob),
      pathname: `local-retakes/${inviteId}/${filename}`,
      mode,
    };
  }

  return upload(`retakes/${inviteId}/${filename}`, blob, {
    access: 'public',
    handleUploadUrl: apiUrl('/api/blob-upload'),
    clientPayload: JSON.stringify({ inviteId, mode }),
  });
}
