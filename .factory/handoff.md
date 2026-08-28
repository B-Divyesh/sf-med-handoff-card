# Med Handoff Card — adversarial review 1 handoff

## Review result

**FAIL** for live production and base
`6f01afb0deb5485fe3863e79065b281801a26211` on 2026-08-28 UTC. The complete
report is `.factory/review-1.md`.

The cold first screen and one-click demo passed on 390 px and desktop. Demo
reset, real-data isolation, same-origin privacy, live offline reload, deep
links, designed 404, distinct visual identity, and all five prior repair groups
were confirmed. Every one of the 14 declared claim commands passed separately
from a clean clone. `npm test` passed 3 unit and 23 browser tests; type-check,
lint, and production build also passed.

No product code was changed. The review records 23 minor findings and no
blocking finding. Remaining work covers route focus/history, complete
route-level metadata, consistent shared chrome, a 180 px apple-touch icon,
claim registration/coverage, plain and consistent terminology, informative
headings/action labels, and a tested in-app record-deletion control.

## How to verify

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
```

Then follow `.factory/review-1.md` from a fresh 390×844 browser context and a
desktop context against `https://med-handoff-card.sociobot.in`.

---

# Med Handoff Card — verification 4 handoff

## Current independent release status

**PASS** for candidate `26d89d1eba832e6e59035f55652aa98c2c241f73`, verified
on 2026-08-28 UTC at `https://med-handoff-card.sociobot.in`.

Fresh independent verification ran every one of the 14 required claim
commands, `npm test` (3 unit + 23 browser tests), type check, lint, and the
production build successfully. The deployed HTML, JS, CSS, and service worker
are byte-identical to the fresh build. Live desktop/mobile, keyboard,
reduced-motion, axe (zero serious/critical), privacy request logging,
headers/cache, invalid-input recovery, service-worker offline reload, and
PWA update coverage passed. There are no known release-blocking defects.

The complete evidence, methods, exact tested commit/URL, and applicability
notes are in `.factory/verification-4.md`. No product code changed in this
verification.

---

# Med Handoff Card — repair 4 handoff

## Release status

**PASS.** Every release blocker in verifier report commit
`e80345058a762a719c30ca5ef27e358bc358f568` for candidate
`50f345aa11576b947d5c4afc8a29e827285e82ba` is repaired, tested, pushed, and
deployed at `https://med-handoff-card.sociobot.in`.

The repair code commit is `6d2eccaed9e7a611518023a7e1ccc44828c005c3`.
The artifact remains a static, local-first offline PWA with `dist/index.html`
at its root.

## Verifier findings repaired

1. Stopping a medication now appends an immutable stop event. Adding a
   medication appends a start event. A record with stopped medications no
   longer falls back to the new-user screen, so its dose notes and regimen
   history remain visible after reload.
2. The handoff date has a maximum of today. A future value is reset to today
   with a live validation message, and the dose action has a second guard.
   Historical dates receive date-specific handoff and update headings.
3. Import backup is now a normal focusable button. Tab reaches it after Export
   backup, and Enter opens the file chooser. The file input remains an
   implementation detail outside the tab order.
4. Print CSS removes the duplicate regimen list and compacts the dose board.
   Eight ordinary medications now fit on exactly one page in both A4 and
   Letter output.
5. `.factory/claims.json` now has exact `stopped-history` and
   `no-future-doses` claims. The print claim asserts its eight-medication page
   boundary. The QR claim now proves both Hide QR and page reload remove the
   in-memory code.

Existing passing behavior was retained: demo isolation, local IndexedDB data,
offline reload, service-worker updates, JSON/CSV and encrypted backups, QR
payload integrity, current-regimen retention, dose notes, route policy, both
themes, and the original dithered bedside-print visual system.

## Clean verification evidence

Run on 2026-08-28 UTC with Playwright 1.58.2 and its pinned Chromium:

```sh
npm ci
# every command from .factory/claims.json, separately
npm test
npm run test:type
npm run lint
npm run build
```

- `npm ci`: 128 packages installed; 0 audit vulnerabilities.
- All 14 claim commands: PASS, exactly one tagged test each.
- `npm test`: 3 Vitest tests and 23 Chromium tests passed.
- Type and lint: PASS.
- Production build: PASS; `dist/` created.
- Assets: JavaScript 50.54 KB raw / 19.02 KB gzip; CSS 13.97 KB raw /
  4.00 KB gzip; no font payload; hero WebP 170.45 KB.
- Local factory URL verifier: HTTP 200, correct title and language, one h1,
  main present, no missing alt text, no unlabeled buttons, and no console
  errors. Evidence: `.factory/qa-evidence/repair-4-local-verify-url/`.
- Local Lighthouse 12.8.2 mobile: performance 100, accessibility 100, best
  practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 0 ms, CLS 0. Evidence:
  `.factory/qa-evidence/repair-4-lighthouse-mobile.json`.
- Exact local eight-medication print result: A4 1 page, Letter 1 page.
  Evidence: `.factory/qa-evidence/repair-4-print.json`.
- Playwright axe integration returned zero serious or critical findings in
  light and dark themes. Mobile checks cover 390 px, 44 px targets, no
  horizontal overflow, and simulated 200% text. Keyboard checks cover the
  skip link, dialogs, focus recovery, form errors, and Import backup.
- Offline verification covers service-worker control, reload after visiting
  Privacy, sample availability, waiting-worker activation, and app reload.
- Privacy verification records the complete demo and real-record request logs;
  every request is same-origin. There are no analytics, accounts, third-party
  scripts, AI calls, payments, or product APIs.

This product has no package/consumer surface, backend, authentication, AI
feature, payment endpoint, or API rate-limit surface, so those gates are not
applicable.

## Deployment and live evidence

`/opt/fleet/lib/deploy-static.sh med-handoff-card dist` reused the existing
`sf-med-handoff-card` Static Web App and completed production deployment
`f21ed270-e1e0-41ab-a1eb-f687014f8002`. The custom domain reports Ready and
HTTPS returns 200.

Fresh live checks passed root, Demo, Privacy, Terms, and the designed 404;
desktop and 390 px mobile; 200% text; Tab/Enter import; future-date rejection;
stop/reload history retention; A4 and Letter one-page print; QR clearing on
reload; offline reload; same-origin request isolation; and light/dark axe.
There were no browser console errors. Evidence:
`.factory/qa-evidence/repair-4-live-smoke.json`, the two live screenshots, and
`.factory/qa-evidence/repair-4-live-verify-url/`.

Live Lighthouse 12.8.2 mobile scored performance 100, accessibility 100, best
practices 100, and SEO 100; FCP 0.9 s, LCP 0.9 s, TBT 10 ms, CLS 0. Evidence:
`.factory/qa-evidence/repair-4-live-lighthouse-mobile.json`.

Live and `dist/` SHA-256 values match exactly:

- `index.html`: `8ece25051bf0291b336da16b7fdc68673053405f3d039d8e926f7bf70181ea49`
- `sw.js`: `2c5bd3786befc505307c2f486feaf8f8c9c4a07f547a6c3533534f6cfc2d10df`
- app JavaScript: `795087defce08dfb1625017ecaf7e3ee09a113ca233b8d9b45205199a6a95c88`
- app CSS: `1a04537c91be9f39e141804330ab22cada66f196e2f32feaab8dd05563f95c44`

The origin sends CSP, HSTS, `nosniff`, `Referrer-Policy: no-referrer`, frame
denial, and a restrictive permissions policy. Hashed assets use one-year
immutable caching, the service worker uses `no-cache`, HTML revalidates after
30 seconds, and unknown routes return HTTP 404.

## Known gaps and next steps

No release-blocking product gaps are known. `.factory/brief.json` is absent in
the supplied repository history, so the verifier report and existing product
contract were used as the preserved scope source alongside
`.factory/design.md`.
