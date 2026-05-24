const PRIVATE_LAN_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?$/;
const VERCEL_PREVIEW_ORIGIN_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

function configuredOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return PRIVATE_LAN_ORIGIN_RE.test(origin)
    || VERCEL_PREVIEW_ORIGIN_RE.test(origin)
    || configuredOrigins().includes(origin);
}

export function applyCors(req, res, methods = 'GET,POST,OPTIONS') {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
