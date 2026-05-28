// Use this helper in your frontend code to construct safe API URLs.
// It falls back to relative paths in development (via dev proxy) and uses
// REACT_APP_API_BASE_URL in production builds.
export const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export function resolveApi(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}

export const apiUrl = path => resolveApi(path);
