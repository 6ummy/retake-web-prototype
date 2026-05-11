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

export async function signup({ email }) {
  return requestJson('/api/signup', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
}
