// Content Security Policy. It limits where the page may load code, images and connections from: this site, Unsplash
// photos, Google Fonts (Japanese mode) and, for accounts, Firebase Auth / Firestore and Google sign-in. 'unsafe-inline'
// is needed for Next's inline hydration scripts and inline styles (a static export can't use per-request nonces);
// everything else is an allow-list. Connections are limited to the three Firebase APIs the site uses.
//
// It is used twice: as a <meta> in every page (app/layout.tsx, production only; dev needs eval for fast refresh), which
// works on any static host, and as a real response header on AWS Amplify (scripts/build-aws.mjs → customHttp.yml).
// Only the header can forbid framing (frame-ancestors); a <meta> policy ignores it.
const policy = (extraConnect: string[]) =>
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://firestore.googleapis.com",
      "https://www.googleapis.com",
      "https://*.firebaseapp.com",
      ...extraConnect,
    ].join(" "),
    "frame-src https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

/** The <meta> version. The ws:// entries let VS Code Live Server's reload socket through when opened locally. */
export const CSP = policy(["ws://127.0.0.1:*", "ws://localhost:*"]);

/** The header version (AWS Amplify): no local sockets, upgrade any stray http:// request, forbid framing. */
export const CSP_HEADER = `${policy([])}; upgrade-insecure-requests; frame-ancestors 'none'`;
