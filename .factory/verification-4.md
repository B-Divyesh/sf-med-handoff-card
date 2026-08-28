# Independent verification 4 — Med Handoff Card

## Verdict: PASS

Verified on 2026-08-28 UTC against candidate commit
`26d89d1eba832e6e59035f55652aa98c2c241f73` and the deployed origin
`https://med-handoff-card.sociobot.in`.

The deployed HTML, service worker, application JavaScript, and application CSS
match a fresh production build of that commit byte-for-byte. This is therefore
a verification of the candidate, not a stale deployment.

## Required first read

Cold opening the live home page plainly answered all required questions:

- **Does:** “Track medicine handoffs between family caregivers.”
- **For whom:** “For adult children and home caregivers who need a clear
  record when care changes hands.”
- **First action:** the visible one-click **Try it with sample data** link,
  followed by “See a filled handoff board in one click.”

The first screen also states the three required facts: records stay in this
browser, the board works offline after the first visit, and printing/QR/exports
are free. The demo loaded the isolated Nora Ellis sample (three medications)
and displayed the persistent demo boundary.

## Clean local gates

`npm ci` installed the lockfile (128 packages, zero reported audit
vulnerabilities). From the clean candidate checkout:

| Gate | Result |
| --- | --- |
| Every command listed in `.factory/claims.json` (14 individual commands) | PASS — one tagged claim test per claim |
| `npm test` | PASS — 3 Vitest unit tests and 23 Chromium browser tests |
| `npm run test:type` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS; generated `dist/` |

The 14 passing claims were: demo isolation, offline reload, local-only
requests, JSON/CSV export, encrypted backup, QR handoff, one-page print,
free tools, current medication list, dose notes, real-record retention,
regimen history, stopped-history retention, and future-date rejection.

Fresh build sizes: application JS **50.54 KB raw / 19.02 KB gzip**, CSS
**13.97 KB raw / 4.00 KB gzip**, and the only hero image **170.45 KB**. These
meet the static/PWA budgets.

## Live product evidence

- **Deployment identity:** SHA-256 of `index.html`, `sw.js`, JS, and CSS from
  live exactly matched the fresh `dist/` output. The application asset is
  `/assets/index-CG8WRlXt.js`; live immutable cache control is one year.
- **End-to-end flow:** added a medication from keyboard, verified initial
  dialog focus and invalid-field recovery, saved it, rejected `2099-12-31`
  back to 2026-08-28, recorded a held dose/note, changed 5 mg Morning to
  10 mg Evening, stopped it, reloaded, and confirmed the stop, note, and
  regimen-change history remained. Invalid backup import recovered with a
  clear error.
- **Demo/tools:** marked a demo dose, generated a local QR handoff, and
  exported both JSON and CSV files. The reduced-motion dose stamp had
  `animation-name: none`.
- **Offline/PWA:** after service-worker control and a reload, `/demo` loaded
  the complete Nora Ellis sample while the browser was offline, including the
  “OFFLINE · CHANGES SAVE ON THIS DEVICE” status. The local browser suite also
  passed its waiting-service-worker activation/update test.
- **Accessibility:** `/opt/fleet/lib/verify-url.sh` passed the live origin:
  title/lang, one h1, main landmark, image alt text, labeled buttons, and zero
  console errors. Axe found **0 serious/critical** issues on desktop light,
  desktop dark, and 390 px mobile. At 390 px there was no horizontal overflow,
  no interactive target below 44 px, and no clipping/overflow at simulated
  200% text. Keyboard Tab reached the skip link first with a visible 3 px
  solid focus ring.
- **Privacy:** Playwright recorded the whole demo interaction (dose note, QR,
  export, theme) and real-record flow. Every request was same-origin; no
  analytics, third-party runtime scripts, account controls, or browser/page
  errors occurred.
- **Headers/routing/cache:** root, demo, privacy, and terms returned 200;
  an unknown route returned designed HTTP 404. Responses provided CSP with
  `connect-src 'self'`, HSTS, `nosniff`, `Referrer-Policy: no-referrer`, and
  `X-Frame-Options: DENY`. `sw.js` is `no-cache`, HTML revalidates after
  30 seconds, assets are immutable, and the manifest uses
  `application/manifest+json`.

## Scope checks and findings

The product meets the researched job: an offline caregiver handoff with a
large schedule, Taken/Held/Unknown states, current regimen, QR, export, and
one-page printout. It is explicit that it is not medical advice,
drug-interaction checking, refill service, or emergency service.

There are **no defects by severity** (critical: 0, high: 0, medium: 0,
low: 0). It has no backend/API endpoint, product-unlock endpoint, sign-in,
payment flow, or AI feature; accordingly, API 429/Retry-After allowance and
Sociobot Entra tenant checks are not applicable.

No product code was modified during this verification.
