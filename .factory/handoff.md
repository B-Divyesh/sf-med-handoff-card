# Med Handoff Card — repair handoff

## Release status: PASS locally

Repaired the release blockers reported in verifier commit `c64a14a838688927712a65805196204ac77c8788` for candidate `1a9aa597d3de2d1e41ee413c5b9c9d893773a28e`.

## What changed

- Added a first-screen **Try it with sample data** action and `/demo` route. The realistic Nora Ellis sample is created in memory and cannot read or write the real IndexedDB record.
- Added the persistent demo banner, working **Reset demo** and **Start for real** controls, and `.factory/demo.md`.
- Added `.factory/claims.json` with eight claims. Each has exactly one tagged Playwright test against `/demo`.
- Rewrote the cold first screen to name adult children and home caregivers, state the job, explain the next click, and list three tested facts.
- Removed the unimplemented $9 Plus profile offer, checkout, token storage, and verification request. The product no longer takes payment or promises profiles.
- Added CSP and privacy headers, immutable hashed-asset caching, correct webmanifest MIME, `robots.txt`, `sitemap.xml`, Azure Static Web Apps configuration, and a designed HTTP 404 response.
- Raised mobile targets to at least 44 × 44 CSS px.
- Changed service-worker updates to wait, show **Install update**, post `skip-waiting`, and reload only after `controllerchange`.
- Updated README, privacy, terms, design notes, and the plain-words copy audit.

The existing medication list, Taken/Held/Unknown workflow, notes, history, QR, print, JSON/CSV, encryption, import, IndexedDB schema, dark theme, and offline behavior were retained.

## Exact verification evidence

- `npm ci` — 127 packages installed; 0 audit vulnerabilities.
- `npm test` — PASS: 2 Vitest unit tests and 13 Chromium tests.
- `npm run test:claims` — PASS: all 8 claim tests.
- `npm run test:type` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS; `dist/index.html` exists.
- Production sizes: JS 46.09 KB / 17.67 KB gzip; CSS 12.93 KB / 3.79 KB gzip; hero 170.45 KB.
- Desktop 1280 × 900 and mobile 390 × 844 — one h1, no horizontal overflow, no console or page errors.
- Playwright axe — 0 serious or critical issues on populated desktop and mobile demo states.
- Keyboard — Enter opens the medication dialog, focus enters the medication-name field, and the schedule error is announced.
- Mobile target audit — every visible link, button, input, textarea, and import label is at least 44 × 44 CSS px.
- Privacy — a dose and QR demo flow made 0 cross-origin requests; no account or checkout control exists.
- Offline — `/demo` reloaded with Nora Ellis after the browser context went offline.
- Update — an actual changed worker reached `waiting`; the app exposed **Install update**, activated it, received `controllerchange`, and reloaded.
- Azure SWA emulator — `/demo` 200; unknown route 404 with the designed page; manifest `application/manifest+json`; hashed JS `public, max-age=31536000, immutable`; root and assets include CSP.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4280 .factory/qa-evidence/repair-swa-verify-url` — PASS in 624 ms with title, `lang=en`, one h1, main, alt text, labels, and 0 browser errors.
- Lighthouse mobile on `/demo` — performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.1 s, CLS 0, total blocking time 0 ms.

Evidence is in `.factory/qa-evidence/repair-*`.

## Deploy

Build with `npm run build`, then deploy the static `dist/` directory:

```sh
/opt/fleet/lib/deploy-static.sh med-handoff-card dist
```

## Known gaps

No release-blocking gaps remain. Named profiles are not shipped or advertised; add them only with complete storage, UI, and billing tests in a future release.
