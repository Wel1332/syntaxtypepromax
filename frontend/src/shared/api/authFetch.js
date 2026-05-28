import { getAuthToken } from '../auth/AuthUtils';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export function authFetch(path, options = {}) {
  const token = getAuthToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
