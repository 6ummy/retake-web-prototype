import { put } from '@vercel/blob';
import { randomBytes } from 'node:crypto';
import { applyCors } from './_cors.js';

const INVITE_ID_RE = /^[a-zA-Z0-9_-]{6,64}$/;

function cleanText(value, fallback, maxLength = 80) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function isAllowedBlobUrl(mediaUrl) {
  try {
    const url = new URL(mediaUrl);
    return url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;

  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Blob token missing',
      detail: 'Connect a Vercel Blob store to this project or add BLOB_READ_WRITE_TOKEN in Vercel project environment variables.',
    });
  }

  const { inviteId, mediaUrl, mediaType, mode, frameName, username } = req.body ?? {};
  if (typeof inviteId !== 'string' || !INVITE_ID_RE.test(inviteId)) {
    return res.status(400).json({ error: 'Invalid invite id' });
  }
  if (!isAllowedBlobUrl(mediaUrl)) {
    return res.status(400).json({ error: 'Invalid retake media URL' });
  }

  const id = randomBytes(12).toString('base64url');
  const payload = {
    id,
    inviteId,
    mediaUrl,
    mediaType: cleanText(mediaType, 'application/octet-stream', 80),
    mode: mode === 'video' ? 'video' : 'photo',
    frameName: cleanText(frameName, 'my frame'),
    username: cleanText(username, 'guest', 40),
    createdAt: new Date().toISOString(),
  };

  try {
    await put(`retakes/${inviteId}/${id}.json`, JSON.stringify(payload), {
      access: 'public',
      contentType: 'application/json',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60,
    });

    return res.status(200).json({ id, ok: true });
  } catch (err) {
    console.error('[retake] Blob write failed:', err);
    return res.status(500).json({
      error: 'Retake submission failed',
      detail: err?.message || 'Vercel Blob retake write failed',
    });
  }
}
