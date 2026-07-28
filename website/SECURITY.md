# Security notes

6 HTML pages, one stylesheet, five scripts, self-hosted fonts, and a small
PHP + MySQL backend under `api/` for the contact form and the account
system. No package manager, no third-party requests at runtime. Served
locally via MAMP (Apache + PHP 8.3 + MySQL) with the site folder junctioned
into `C:\MAMP\htdocs\nepal`, reachable at `http://localhost/nepal/`.

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

## The backend (`api/`)

`contact.html` and `login.html` submit to real PHP endpoints backed by
MySQL. What's actually implemented:

- **Passwords are hashed with `password_hash()`** (bcrypt via
  `PASSWORD_DEFAULT`) — never stored or logged in plain text.
- **Every query is parameterised** (`PDO` with `ATTR_EMULATE_PREPARES =>
  false`) — no string-built SQL anywhere, so there's no injection surface.
- **CSRF via double-submit token**: `GET api/csrf.php` puts a random token
  in the (`HttpOnly`, `SameSite=Lax`) session; every state-changing POST
  must echo it back in an `X-CSRF-Token` header, checked with
  `hash_equals()`. A cross-site request can read neither the cookie nor the
  token, so it can't forge the header.
- **Timing-safe login**: `api/signin.php` runs `password_verify()` against
  a dummy hash even when the email doesn't exist, so "no such account" and
  "wrong password" take the same code path and roughly the same time —
  response timing can't be used to enumerate registered emails.
- **Rate limiting is per-IP**, not per-session (a file-locked counter
  keyed on `REMOTE_ADDR`), so it isn't defeated by clearing cookies. It's
  single-instance only — a real multi-server deployment needs this in
  something shared, like Redis.
- **Generic error responses**: a global exception handler catches anything
  unexpected, logs the real message server-side, and returns a flat "try
  again" to the client — never a stack trace or a DB error string.
- **`config.php` is gitignored** (see `api/config.sample.php` for the
  template) and blocked from direct HTTP access via `api/.htaccess`, same
  for `bootstrap.php`. `sql/.htaccess` denies the whole folder — nothing in
  there is meant to be requested, and serving `schema.sql` as plain text
  would hand over the table structure for free.

What this setup does **not** provide, and would need before facing real
users beyond a local dev machine:

- **HTTPS.** MAMP serves plain `http://localhost`. The session cookie is
  `Secure` only when the request actually arrives over HTTPS — on a real
  deployment behind TLS this becomes automatic, no code change needed.
- **Email verification** — signup takes any email address at face value.
- **Account lockout** — rate limiting slows brute-forcing, it doesn't lock
  an account after N failures.
- **Password reset flow** — "Forgot password?" currently links to the
  contact page.

Client-side validation in `login.js` / `contact.js` is a convenience for
the user, **not** a security control — every one of those checks is
re-run server-side, because the client can always be bypassed.

## Local database (MAMP)

- MySQL on `localhost:3306`, default credentials `root` / `root`.
- Schema: `sql/schema.sql` — two tables, `users` and `contact_messages`.
  Import once via phpMyAdmin (`http://localhost/phpMyAdmin`) or:
  ```
  "C:\MAMP\bin\mysql\bin\mysql.exe" -u root -proot < sql/schema.sql
  ```
- The site is reached through Apache, not by opening the `.html` files
  directly — `file://` pages have no PHP and the forms can't reach the
  API. Start MAMP, then browse to `http://localhost/nepal/mainpage.html`.
  `C:\MAMP\htdocs\nepal` is an NTFS junction pointing at this folder, so
  there's one copy of the site, not two drifting in and out of sync.

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
