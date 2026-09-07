# Deploying

The site is six static HTML pages plus a four-endpoint PHP API. It needs
PHP 8.3 with PDO MySQL, a MySQL database, and TLS. Nothing else — no
build step to serve it, no outbound API calls, no mail transport.

Two config files live here-ish:

- `../.htaccess`, `../api/.htaccess`, `../sql/.htaccess` — Apache
- `nginx.conf` — the nginx equivalent, because **nginx does not read
  .htaccess at all**

Pick the one matching your server. If you deploy to nginx and skip
`nginx.conf`, the deny rules are silently absent and `/api/config.php`
and `/sql/schema.sql` become fetchable.

## 1. Database

```sh
mysql -u root -p < sql/schema.sql
```

Then make a least-privilege user rather than reusing `root`:

```sql
CREATE USER 'nepal_app'@'localhost' IDENTIFIED BY 'a-long-random-password';
GRANT SELECT, INSERT ON nepal_travel.* TO 'nepal_app'@'localhost';
FLUSH PRIVILEGES;
```

`SELECT, INSERT` is all the code does — sign-in reads `users`, sign-up and
the contact form insert. No endpoint updates or deletes anything, so
withholding those privileges costs nothing and caps the blast radius of an
injection bug.

## 2. Credentials

`api/config.php` is gitignored and will not exist on a fresh checkout.
`api/bootstrap.php` falls back to the environment when it is missing, so
prefer that over writing secrets to disk. With php-fpm, in the pool config:

```ini
env[DB_HOST] = 127.0.0.1
env[DB_PORT] = 3306
env[DB_NAME] = nepal_travel
env[DB_USER] = nepal_app
env[DB_PASS] = a-long-random-password
```

A present `config.php` takes precedence over the environment, which is what
keeps the local MAMP setup working unchanged.

## 3. Files

Copy the whole folder to the document root. `partials/` and `sql/` are
build inputs rather than site content and are denied by both configs;
they can be excluded from the upload entirely.

Run `perl build.pl --check` before deploying — it exits non-zero if a page's
inlined nav or footer has drifted from `partials/`.

## 4. TLS

The session cookie's `Secure` flag is set from the request scheme, and
`api/bootstrap.php` honours `X-Forwarded-Proto`, so this works both on a
directly-terminating server and behind a proxy or load balancer. No code
change either way.

Turn HSTS on **after** HTTPS is confirmed working — it is uncommented in
`nginx.conf` but deliberately left commented in `../.htaccess`, because a
browser that sees the header on a site still reachable over http:// will
refuse the plain-http version for a year.

## 5. Check it

```sh
curl -I  https://example.com/                      # 200, security headers present
curl -sI https://example.com/api/config.php        # 403 — NOT 200
curl -sI https://example.com/sql/schema.sql        # 403 — NOT 200
curl -sI https://example.com/partials/nav.html     # 403/404 — NOT 200
```

The second and third are the ones worth actually running. A 200 on either
means the deny rules are not loading — on Apache, usually because the vhost
lacks `AllowOverride All`.

## Known limit

The per-IP rate limiter in `api/bootstrap.php` keeps its counters in local
temp files. That is correct on a single server and quietly useless across
two or more, where each box would keep its own count. Moving to more than
one instance means moving those counters into Redis or the database.
