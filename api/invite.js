import { get, list, put } from '@vercel/blob';
import { randomBytes } from 'node:crypto';
import { applyCors } from './_cors.js';

const INVITE_ID_RE = /^[a-zA-Z0-9_-]{6,64}$/;
const DEFAULT_USERNAME = 'yunchai';
const DEFAULT_FRAME_NAME = 'my frame';
const DEFAULT_ORIGIN = 'https://retake.it.com';

function getOrigin(req) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || 'https';
  return host ? `${proto}://${host}` : DEFAULT_ORIGIN;
}

function makeInviteId() {
  return randomBytes(12).toString('base64url');
}

function cleanText(value, fallback, maxLength = 80) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function isAllowedFrameUrl(frameUrl) {
  if (typeof frameUrl !== 'string' || !frameUrl.trim()) return false;
  if (frameUrl.startsWith('/api/frame?')) return true;
  try {
    const url = new URL(frameUrl);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function streamToText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

async function putInvite(pathname, payload) {
  const blob = await put(pathname, JSON.stringify(payload), {
    access: 'public',
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 60,
  });
  return { blob, access: 'public' };
}

async function getInvite(pathname) {
  try {
    const result = await get(pathname, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      useCache: false,
    });
    if (result?.stream) return result;
  } catch (err) {
    console.warn('[invite] Pathname get failed, falling back to list:', err?.message || err);
  }

  const { blobs } = await list({
    prefix: pathname,
    limit: 1,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  const blob = blobs.find(item => item.pathname === pathname);
  if (!blob?.url) return null;

  const response = await fetch(blob.url, { cache: 'no-store' });
  if (!response.ok || !response.body) return null;

  return {
    statusCode: 200,
    stream: response.body,
  };
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Blob token missing',
      detail: 'Connect a Vercel Blob store to this project or add BLOB_READ_WRITE_TOKEN in Vercel project environment variables.',
    });
  }

  if (req.method === 'POST') {
    const { frameUrl, frameName, username } = req.body ?? {};

    if (!isAllowedFrameUrl(frameUrl)) {
      return res.status(400).json({ error: 'Invalid frame URL' });
    }

    const id = makeInviteId();
    const pathname = `invites/${id}.json`;
    const payload = {
      id,
      frameUrl,
      frameName: cleanText(frameName, DEFAULT_FRAME_NAME),
      username: cleanText(username, DEFAULT_USERNAME, 40),
      createdAt: new Date().toISOString(),
    };

    try {
      await putInvite(pathname, payload);
      return res.status(200).json({
        id,
        inviteUrl: new URL(`/invite/${id}`, getOrigin(req)).toString(),
      });
    } catch (err) {
      console.error('[invite] Blob write failed:', err);
      return res.status(500).json({
        error: 'Invite creation failed',
        detail: err?.message || 'Vercel Blob invite write failed',
      });
    }
  }

  if (req.method === 'GET') {
    const id = req.query?.id;

    if (typeof id !== 'string' || !INVITE_ID_RE.test(id)) {
      return res.status(400).json({ error: 'Invalid invite id' });
    }

    try {
      const result = await getInvite(`invites/${id}.json`);
      if (!result?.stream) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      const invite = JSON.parse(await streamToText(result.stream));
      return res.status(200).json({
        id: invite.id,
        frameUrl: invite.frameUrl,
        frameName: invite.frameName || DEFAULT_FRAME_NAME,
        username: invite.username || DEFAULT_USERNAME,
      });
    } catch (err) {
      console.error('[invite] Blob read failed:', err);
      return res.status(500).json({
        error: 'Invite lookup failed',
        detail: err?.message || 'Vercel Blob invite lookup failed',
      });
    }
  }

  return res.status(405).end();
}
