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

export async function registerUser(email, password) {
  return request('/api/auth/create', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser() {
  return request('/api/auth/logout', {
    method: 'DELETE',
  });
}

export async function getCurrentUser() {
  return request('/api/auth/me');
}

export async function getProtectedMessage() {
  return request('/api/protected');
}

