# Independent verification — FAIL

Candidate: 1a9aa597d3de2d1e41ee413c5b9c9d893773a28e
Live URL: https://med-handoff-card.sociobot.in
Verified: 2026-08-28 after a fresh npm ci install at the requested commit

## Release decision

FAIL. The mandatory claims gate cannot run: .factory/claims.json does not exist. The first-screen/demo gate also fails. The live first screen has no visible “Try it with sample data” action, and ?demo=1 opens the same empty, real-data application: zero medications, no demo banner, no Reset demo, and no Start for real. .factory/demo.md is absent.

The first cold screen appears to be a private caregiver medication record that can mark a dose Taken, Held, or Unknown. Its apparent audience is a caregiver and its only first action is Add first medication. It does not plainly name the adult-child/home-caregiver situation and has no one-click realistic sample. This fails the plain-words and demo contract regardless of the checks below.

## Mandatory claims gate

| Check | Result | Evidence |
| --- | --- | --- |
| Claims registry exists | FAIL | .factory/claims.json was absent before installation or other QA action. |
| Every listed claim test runs through demo | FAIL | No registry, declared claim test, or functioning demo entry point exists. |
| Visitor claims are registered and observable | FAIL | README claims offline reload, local-only storage, JSON/CSV export, AES-GCM encryption, printing, QR sharing, no analytics, and paid profiles. None has the required registry/test. |

## Checks that passed

### Clean checkout

    npm ci
    npm test
    npm run build

npm ci installed 126 packages with 0 reported audit vulnerabilities. npm test passed 1 file / 2 tests. The exact TypeScript/Vite production build passed. Output sizes: JS 44.92 kB (17.33 kB gzip), CSS 10.97 kB (3.31 kB gzip), and illustration 170.45 kB; all fit the static PWA byte budgets.

### Functional exercise

A local production preview was exercised with Metformin 500 mg at Morning and Evening. Missing schedule validation said “Choose at least one time of day.” A Taken state and note appeared in same-day history, changed to Unknown on the next date, and persisted after reload.

QR generation produced a local data:image/png result. Malformed JSON import gave “Could not import that backup. Check the file and passphrase.” A valid Lisinopril backup restored recipient, regimen, and Held state. Clear export produced both med-handoff-backup-2026-08-28.json and med-handoff-dose-log-2026-08-28.csv. The CSV had its header and a recorded Aspirin dose row. Encrypted export produced a parcel with encrypted: true, algorithm: AES-GCM, and ciphertext. Print media hid the tools and retained handoff content.

### Browser, accessibility, privacy, PWA

- Desktop and 390 × 844 mobile checks had no console or page errors; mobile scrollWidth and clientWidth were both 390.
- Playwright axe found 0 serious/critical violations in the populated desktop workflow and mobile empty state.
- Keyboard activation opened the medication dialog, put initial focus in the medication-name input, and the primary control showed a 3 px cobalt focus outline. The schedule error is an assertive live region.
- The worker helper passed:
  /opt/fleet/lib/verify-url.sh https://med-handoff-card.sociobot.in .factory/qa-evidence/verify-url
  It reported 200, title, lang=en, one h1, main, no images without alt, no unlabeled buttons, and no browser errors; observed load was 701 ms.
- After a first live visit established service-worker control, a 390 px context set offline reloaded successfully with 200, the normal handoff heading, and no errors. The local preview had the same result.
- A full local entry/QR/export flow made no external browser requests. Health records use IndexedDB. The only application external request in source is explicit license verification.
- The live checkout endpoint returned 303 to hosted Sociobot/Dodo checkout. There is no sign-in flow.

### Deployment identity and API policy

Live HTML, referenced JS, and service worker exactly match this candidate:

    index.html  970d6738837bb94b7e6dacd3360fbda474e5870ffaf3e0e8fbe191d335bcf24d
    index JS    0ac0077be30d857c4db6c761f87863bf842ce23ae67a379210ec8d8dd82e513f
    sw.js       a5ee0dd5877ca76cb0943f2ef5b3dc71aa23a1b9a8de511b0523dd5783b0875d

Rate limiting was confirmed on the license verification API. Eighty rapid requests produced 30 × 200 followed by 50 × 429. A follow-up 429 carried Retry-After: 1 and X-RateLimit-After: 1. The observed threshold was 30 successful requests in the test window.

## Defects

### Critical

1. Claims registry and claim tests are absent. This alone is a release-blocking contractual failure.
2. The required isolated, one-click sample demo is absent. ?demo=1 is ignored; there is no separate storage namespace or demo documentation. Offline behavior therefore cannot be demonstrated in demo mode.
3. The paid $9 named-profile promise is not implemented. The Plus copy offers separate named profiles, while storage has one fixed current record and the UI has no profile creation/switching capability. The existing builder handoff acknowledges this. Do not present checkout for this feature until it works or remove the offer.

### High

1. The live deployment has no Content-Security-Policy header. It does provide HSTS, nosniff, and Referrer-Policy, but CSP is required for this sensitive local health-record product.
2. Required routing/discovery assets are incomplete: /robots.txt and /sitemap.xml return 404; an unknown URL returns the normal empty board with HTTP 200 instead of a designed 404; there is no staticwebapp.config.json.

### Medium

1. Mobile touch targets miss the 44 × 44 px baseline: wordmark 138 × 37 px, theme button 24 × 44 px, Privacy 45 × 15 px, and Terms 37 × 15 px.
2. Hashed JS/CSS responses use Cache-Control: public, must-revalidate, max-age=30 instead of long-lived immutable caching. manifest.webmanifest is served as application/octet-stream.
3. Offline reload was proved, but a real service-worker update sequence was not: the deployed worker did not change during QA. The update control only reloads and does not message a waiting worker.

## Verification limitation

Mobile Lighthouse was attempted with the installed Chromium but Lighthouse could not connect because its root-browser launch did not accept the supplied no-sandbox setting. No Lighthouse score is claimed. Byte budgets, browser checks, axe, the verification helper, and offline tests completed.

## Required next steps

1. Add the isolated sample demo and .factory/demo.md, then add .factory/claims.json with one tagged demo-entry test per claim.
2. Remove the paid named-profile offer or implement and test profiles before accepting payment.
3. Add CSP, immutable caching for hashed assets, correct manifest MIME type, robots/sitemap, and a real 404 route.
4. Increase undersized touch targets and verify an actual service-worker update cycle.
5. Re-run this clean-checkout verification and publish a fresh mobile Lighthouse result.
