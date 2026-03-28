const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: defaultHeaders,
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed.');
  }

  return payload;
}

export function normalizeProgress(progress) {
  return {
    scores: progress?.scores && typeof progress.scores === 'object' ? progress.scores : {},
    sig: progress?.sig && typeof progress.sig === 'object' ? progress.sig : {},
  };
}

export async function createBracket(payload) {
  return request('/api/brackets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listBrackets() {
  return request('/api/brackets');
}

export async function getBracket(id) {
  return request(`/api/brackets/${encodeURIComponent(id)}`);
}

export async function updateBracket(id, payload) {
  return request(`/api/brackets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBracket(id) {
  return request(`/api/brackets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
