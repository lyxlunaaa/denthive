export function getToken() {
  return localStorage.getItem('denthive_token');
}

export function getRole() {
  return localStorage.getItem('denthive_role');
}

export function getDisplayId() {
  return localStorage.getItem('denthive_displayId');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

