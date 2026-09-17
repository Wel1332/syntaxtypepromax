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
//
// Currently the Render deployment, so the site works for anyone at any time
// without a machine on the desk. Render's free plan SLEEPS after 15 minutes
// idle: the first request after that takes 50s-3.5min (measured 212s on
// 2026-09-17) while the container cold-starts, then settles to ~0.14s. The
// landing page's leaderboard fetch gives up after 8 seconds, so the first load
// after an idle period shows an empty board even though the backend is fine --
// reload once it has woken. If you need it responsive for a demo, hit
// https://syntaxtype-backend.onrender.com/api/leaderboards/global a few minutes
// beforehand to wake it.
//
// The alternative is a Cloudflare quick tunnel to the desktop backend, which is
// fast and never sleeps but only runs while that machine is on, and hands out a
// NEW hostname every time cloudflared restarts. If you switch back, paste the
// hostname cloudflared printed here -- a stale tunnel hostname in this file is
// the most common cause of "the site cannot reach the backend" and looks
// exactly like an outage.
window.__SYNTAXTYPE_CONFIG__ = {
    apiBaseUrl: "https://syntaxtype-backend.onrender.com"
};
