import { getAuthToken } from '../auth/AuthUtils';
// Imported rather than re-read from process.env: the base is resolved at runtime
// now, and a second copy here would keep the build-time value and quietly send
// half the app to the old backend.
import { API_BASE } from './client';

export function authFetch(path, options = {}) {
  const token = getAuthToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
