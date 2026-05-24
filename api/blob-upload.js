import { handleUpload } from '@vercel/blob/client';
import { applyCors } from './_cors.js';

const INVITE_ID_RE = /^[a-zA-Z0-9_-]{6,64}$/;

export default async function handler(req, res) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;

  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Blob token missing',
      detail: 'Connect a Vercel Blob store to this project or add BLOB_READ_WRITE_TOKEN in Vercel project environment variables.',
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const inviteId = payload.inviteId;
        if (typeof inviteId !== 'string' || !INVITE_ID_RE.test(inviteId)) {
          throw new Error('Invalid invite id');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/webm', 'video/mp4'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            inviteId,
            mode: payload.mode === 'video' ? 'video' : 'photo',
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info('[blob-upload] Upload completed', {
          pathname: blob.pathname,
          tokenPayload,
        });
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error('[blob-upload] Failed:', err);
    return res.status(400).json({ error: err?.message || 'Upload failed' });
  }
}
