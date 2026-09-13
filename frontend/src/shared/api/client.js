// Single source of truth for where the backend lives.
//
// Resolved at *runtime*, not at build time. Create React App inlines
// process.env.REACT_APP_* into the bundle when it compiles, which means moving
// the backend -- between Render, a Cloudflare tunnel, or a machine on the
// desk -- used to require a rebuild and a full redeploy of the frontend. That is
// a slow, failure-prone step to be performing while people are waiting to use
// the app, and a tunnel hands out a new hostname every time it restarts.
//
// public/config.js is copied verbatim into the build and loaded before the
// bundle, so the URL can be changed by editing one deployed file. See the
// comments in that file.
//
// The build-time value is kept as a fallback so existing deployments and local
// `npm start` keep working untouched: nothing breaks if config.js is missing or
// has not been filled in.
const runtimeConfig = (typeof window !== 'undefined' && window.__SYNTAXTYPE_CONFIG__) || {};

// A placeholder left in config.js counts as "not configured" -- otherwise an
// unedited file would silently point every request at a literal __API_BASE_URL__
// host and the failure would look like a network problem rather than a missing
// deploy step.
const configured = typeof runtimeConfig.apiBaseUrl === 'string'
  && runtimeConfig.apiBaseUrl.trim() !== ''
  && !runtimeConfig.apiBaseUrl.includes('__');

// Trailing slashes are stripped because every caller supplies a path that
// already starts with one, and `https://host//api/...` does not match the
// backend's CORS allow-list or its route table.
export const API_BASE = (configured
  ? runtimeConfig.apiBaseUrl.trim()
  : (process.env.REACT_APP_API_BASE_URL || '')
).replace(/\/+$/, '');

export function resolveApi(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}

export const apiUrl = path => resolveApi(path);
