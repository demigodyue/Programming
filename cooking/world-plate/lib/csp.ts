// Content Security Policy. It limits where the page may load code, images and connections from: this site, Unsplash
// photos, and (for accounts) Firebase and Google sign-in. 'unsafe-inline' is needed for Next's inline hydration scripts
// and inline styles; everything else is an allow-list. The ws:// entries let VS Code Live Server's reload socket through.
//
// It is used twice: as a <meta> in every page (app/layout.tsx, production only; dev needs eval for fast refresh), which
// works on any static host, and as a real response header on AWS Amplify (scripts/build-aws.mjs → customHttp.yml).
// Only the header can forbid framing (frame-ancestors); a <meta> policy ignores it.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com ws://127.0.0.1:* ws://localhost:*",
  "frame-src https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** The header version: the same policy, plus a ban on other sites framing these pages. */
export const CSP_HEADER = `${CSP}; frame-ancestors 'none'`;
