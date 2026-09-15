// Runtime configuration for the deployed frontend.
//
// Everything in public/ is copied into the build untouched, and this file is
// loaded before the application bundle, so it can be edited on a deployed site
// WITHOUT rebuilding or redeploying. That is the point of it: the backend URL
// changes (Render, a Cloudflare tunnel, a laptop on the desk) and a tunnel hands
// out a new hostname every time it restarts, so baking the URL into the bundle
// turns a thirty-second change into a full redeploy.
//
// HOW TO POINT THE APP AT A DIFFERENT BACKEND
//   1. Set apiBaseUrl below to the backend's origin, with NO trailing slash.
//        e.g. "https://something.trycloudflare.com"
//   2. Save. Reload the page. That is the whole procedure.
//
// Leave it as an empty string to fall back to REACT_APP_API_BASE_URL from the
// build, which is what every existing deployment already uses. So an untouched
// copy of this file changes nothing.
//
// Remember the backend must also allow this site's origin: its FRONTEND_URL
// environment variable feeds the CORS allow-list, and a mismatch shows up as a
// 403 with no Access-Control-Allow-Origin header rather than a useful message.
// Currently a Cloudflare quick tunnel to the backend running on a desktop.
// Quick tunnels get a NEW hostname every time cloudflared restarts, so if the
// site suddenly cannot reach the backend, check this value against whatever
// cloudflared last printed before looking anywhere else.
window.__SYNTAXTYPE_CONFIG__ = {
    apiBaseUrl: "https://atom-gras-logistics-bean.trycloudflare.com"
};
