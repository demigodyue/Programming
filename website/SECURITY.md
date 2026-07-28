# Security notes

A static, dependency-free site: 6 HTML pages, one stylesheet, three scripts,
self-hosted fonts. No build step, no package manager, no third-party requests
at runtime.

## Content Security Policy

Every page ships this policy in a `<meta http-equiv>` tag:

```
default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self';
img-src 'self' data:; form-action 'self'; base-uri 'none'; object-src 'none'
```

It is strict on the directives that matter: **no `'unsafe-inline'` for either
scripts or styles**. That required two things, both done:

- all inline `<script>` blocks moved to `contact.js` / `login.js`
- all inline `style="…"` attributes moved to CSS classes

If you add an inline `<script>` or a `style="…"` attribute later, it will be
**silently blocked**. Put it in a `.js` or `.css` file instead.

Element styling from JavaScript (`el.style.transform = …`,
`el.style.setProperty(…)`) is CSSOM, not an inline style attribute, and is
unaffected by this policy — the animation engine relies on that.

## Headers that must come from the server

Three protections cannot be delivered via `<meta>`:

| Header | Why meta doesn't work |
|---|---|
| `frame-ancestors` | Browsers ignore it in meta form — clickjacking stays open |
| `X-Content-Type-Options: nosniff` | Header-only |
| `Strict-Transport-Security` | Header-only, and requires HTTPS |

`_headers` covers Netlify and Cloudflare Pages. Equivalents:

**nginx**

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Apache** (`.htaccess`)

```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

**GitHub Pages cannot set custom headers.** The `<meta>` CSP still applies, but
`frame-ancestors`, `nosniff` and HSTS will not. Put Cloudflare in front if you
need them.

## The account page is a demo

`login.html` performs **no authentication**. Nothing is transmitted, verified
or stored, and no credential leaves the browser. The page says so on screen.

Before putting it in front of real users you need, at minimum:

- HTTPS, with HSTS
- a server-side session or token in an `HttpOnly; Secure; SameSite=Lax` cookie
- password hashing server-side (argon2id, or bcrypt with cost ≥ 12)
- rate limiting on the sign-in endpoint, and lockout/backoff on repeated failures
- CSRF protection on every state-changing POST
- server-side revalidation of everything the client already checked

Client-side validation in `login.js` is a convenience for the user, **not a
security control**. Anyone can bypass it.

## Why the forms are `method="post"`

All three forms are `method="post"` even though no backend receives them.

A form with no `method` defaults to **GET**. If the JavaScript ever fails to
run — blocked, cached stale, syntax error — the browser submits natively, and
GET puts every named field in the URL: browser history, server access logs,
and the `Referer` header sent to any third party. For `contact.html` that is
the visitor's name, email and phone number. POST never does this.

## Third-party exposure: none

Fonts are self-hosted in `fonts/` (DM Sans and Space Grotesk, both SIL Open
Font License 1.1). There are no CDNs, analytics, trackers, or external
requests of any kind, so no visitor IP is disclosed to anyone but your host.

## Known accepted risks

- **Animation ignores `prefers-reduced-motion`** by explicit request of the
  site owner. Visitors with vestibular disorders get the full motion set.
  Re-enabling it means gating the animation code on that media query.
- **No Subresource Integrity** on local assets — unnecessary, they are
  same-origin and covered by `default-src 'self'`.
