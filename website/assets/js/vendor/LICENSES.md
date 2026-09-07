# Vendored libraries

Fetched as stock ESM builds because the site's CSP is
`default-src 'self'` — nothing can be loaded from a CDN at runtime.

| File | Package | Version | Licence |
|---|---|---|---|
| `gsap.esm.js` | `gsap` | 3.13.0 | **GreenSock Standard "No Charge" licence** — not MIT. Free for most uses; commercial redistribution and some paid-product cases require a Club GreenSock membership. See https://gsap.com/licensing/ |
| `ScrollTrigger.esm.js` | `gsap/ScrollTrigger` | 3.13.0 | Same GreenSock licence as above |
| `lenis.esm.js` | `lenis` | 1.3.11 | MIT |
| `three.module.min.js`, `three.core.min.js` | `three` | see `three.LICENSE.txt` | MIT |

`lenis` is the current package; the integration notes referenced
`@studio-freight/lenis`, which is the deprecated name for the same
library and now just re-points here.
