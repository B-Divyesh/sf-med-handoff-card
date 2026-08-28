# Independent verification 3 — FAIL

- Candidate: `50f345aa11576b947d5c4afc8a29e827285e82ba`
- Live URL: `https://med-handoff-card.sociobot.in`
- Verified: 2026-08-28 UTC
- Artifact class: offline PWA

## Release decision

**FAIL.** The candidate is deployed and the declared tests pass, but fresh
end-to-end testing found four release blockers. Stopping the last medication
hides the retained dose history and creates no stop event, a future dose can be
recorded as Taken under a false “Today’s handoff” heading, an eight-medication
handoff prints on two pages instead of the required one page, and keyboard-only
users cannot reach Import backup.

This is not a deployment-only failure. Every deployable build artifact matches
the live origin byte-for-byte, and the live site otherwise loads successfully.

## Mandatory first-read and demo gate

**PASS on desktop and 390 px mobile.** A cold live visit says:

- What: “Track medicine handoffs between family caregivers.”
- For whom: “For adult children and home caregivers who need a clear record
  when care changes hands.”
- First click: **Try it with sample data**, alongside “See a filled handoff
  board in one click.”

The three facts about local storage, offline use, and free handoff tools are
visible on the first mobile screen. One click opens `/demo`, showing Nora
Ellis, three realistic medications, dose states, a shift note, and the
persistent demo banner with Reset demo and Start for real.

## Mandatory claims gate

`.factory/claims.json` exists. After `npm ci`, every listed command was run
separately against its clean browser sandbox and passed:

| Claim | Result |
| --- | --- |
| `demo-isolation` | PASS, 1 test |
| `offline-reload` | PASS, 1 test |
| `local-only` | PASS, 1 test |
| `json-csv-export` | PASS, 1 test |
| `encrypted-backup` | PASS, 1 test |
| `qr-handoff` | PASS, 1 test |
| `print-handoff` | PASS, 1 test |
| `free-tools` | PASS, 1 test |
| `current-medication-list` | PASS, 1 test |
| `dose-state-notes` | PASS, 1 test |
| `real-record-retention` | PASS, 1 test |
| `regimen-history` | PASS, 1 test |

The first attempted claim command, before dependency installation, could not
resolve `@playwright/test`; the locked install then completed with zero audit
vulnerabilities and every exact claim command passed. Per-claim logs are in
`.factory/qa-artifacts/claim-logs/`.

The claim audit still has a release-blocking coverage defect: the Stop
confirmation tells the user “Existing dose history will stay,” but that promise
has no exact registry entry or tagged stop-flow test. Fresh testing shows that
the retained log becomes inaccessible in the UI when the stopped medication
was the last active one. The broad regimen-history test covers only an amount
and schedule edit, not starting or stopping a medication.

## Clean repository gates

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 128 packages; 0 vulnerabilities |
| `npm test` | PASS | 3 Vitest and 20 Chromium tests |
| `npm run test:type` | PASS | TypeScript clean |
| `npm run lint` | PASS | TypeScript clean; this is the repository lint script |
| `npm run build` | PASS | Exact production build created `dist/` |

Production output is 48.89 KB JS (18.63 KB gzip), 13.10 KB CSS (3.82 KB
gzip), no font payload, and a 170.45 KB hero WebP. These pass the stated asset
budgets.

## Live identity, routes, and response policy

The built and live SHA-256 values match for every deployable file, including:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `3af7d6266464d1e7b694950407d7d02d6f16f340e833e655a5b2290e5c3e1f9a` |
| app JavaScript | `c27cb972cb1d3d75eeaf6743e7af7a83b7da5d9ba2f593371649683ddf512a6f` |
| app CSS | `1bfc05d70d005b2ffd5eefb7c3d81ee4f3265c2766a13d8e16f7b681001843bf` |
| `sw.js` | `13a498832d98b51542ff3abffa6dbe4256b3b48a9dc22c3f617e94449e22b36b` |

`staticwebapp.config.json` correctly is not published and returns the designed
404. Root, Demo, Privacy, and Terms return 200 with route-specific titles, one
h1, `lang=en`, main/header/footer landmarks, zero serious/critical axe findings,
and no unexpected console errors. An unknown path returns the designed 404;
all internal links return 200.

The origin sends CSP, HSTS, `nosniff`, `Referrer-Policy: no-referrer`, frame
denial, and a restrictive permissions policy. Hashed assets use one-year
immutable caching, the service worker uses `no-cache`, HTML revalidates after
30 seconds, and the manifest has the correct MIME type. Compressed live
transfers were 18,845 bytes JS, 3,882 bytes CSS, 170,452 bytes WebP, and 605
bytes HTML.

The factory URL verifier passed: HTTP 200, title and language present, one h1,
main present, zero missing alt text, zero unlabeled buttons, and zero browser
errors.

## Functional, accessibility, privacy, and PWA evidence

Fresh live real-record testing covered blank required fields, 80-character
medication names, markup-like text, a 500-character shift note, Held notes,
immediate reload persistence, regimen edits, malformed import recovery, and a
successful valid restore. Text was escaped, malformed data did not replace the
record, and normal persistence succeeded.

The demo produced decoded QR data, JSON and CSV downloads, print media, reset,
and offline reload. A fresh first visit obtained service-worker control and
loaded the sample on the next navigation while offline. Offline reload also
passed after visiting Privacy. The repository update test replaced the worker
version, observed the waiting worker, exposed Install update, activated it, and
reloaded the board.

Live light/dark desktop and 390 px mobile scans returned zero serious/critical
axe violations. The mobile layout had no horizontal overflow, no clipped
content at simulated 200% text, and no visible target below 44×44 CSS px.
Reduced motion yielded `animation-name: none`; the skip link was first in the
tab order with a 3 px focus outline. The Import control exception is detailed
below.

Complete live demo and real-record flows sent requests only to
`https://med-handoff-card.sociobot.in`; there were no analytics, accounts,
third-party runtime scripts, AI calls, payment calls, or product server APIs.
API allowance/429 and Entra checks are therefore not applicable.

Fresh Lighthouse 12.8.2 mobile results on `/demo?verification=3` were:
performance 93, accessibility 100, best practices 100, SEO 100; FCP 1.67 s,
LCP 1.74 s, TBT 47 ms, and CLS 0. A representative theme-switch render took
28.9 ms to the second animation frame; real-user INP is not available in this
lab run.

## Release-blocking defects

### High — stopping a medication erases the usable handoff trail

1. Create a medication, record a Held dose with a note, edit 5 mg/Morning to
   10 mg/Evening, then confirm Stop.
2. Reload.
3. IndexedDB correctly contains the inactive medication and one dose log, but
   `regimenChanges.length` remains 1—the edit event only. No stop event exists.
4. Because there are no active medications, the app renders the new-user
   landing page. The history section count is zero, so the retained dose and
   edit history are not visible.

This defeats the brief’s exception/regimen-change record at the exact moment a
substitute caregiver needs to know that a medicine was discontinued. It also
undermines the confirmation promise that existing dose history will stay.

Evidence: `live/verification-3-results.json`, `live/real-after-stop.png`.

### High — impossible future doses can be recorded as Taken

The date field accepted `2099-12-31`. The page still said “Today’s handoff” and
“Today’s updates,” displayed a regimen change made in 2026 as a current update,
and saved the 2099 dose as Taken with “Marked far in advance.” There is no
warning or recovery prompt. A false future adherence record can later make a
caregiver believe a dose was already given.

Evidence: `live/verification-3-routes.json`, `live/future-date.png`.

### High — Import backup is unreachable by keyboard

The import UI is a `<label>` with `tabIndex=-1` around an input carrying the
`hidden` attribute. A complete 41-stop Tab cycle reached every surrounding
tool, then the footer and skip link, but never Import backup. This violates the
non-negotiable keyboard baseline for an essential recovery action.

Evidence: `live/verification-3-keyboard.json`.

### High — the required one-page handoff becomes two pages

Using the product’s valid JSON import with eight ordinary medications produced
a two-page PDF on both A4 and Letter paper. Eight medications is a
representative case for the older-adult audience, not a pathological stress
case. The researched brief explicitly requires a one-page handoff printout.

Evidence: `live/verification-3-print.json` and the two generated PDFs.

## Other contract observations

- The README and visible landing claims otherwise map to the 12-entry claims
  registry. The declared QR claim also says the code lasts until the page
  closes, while its tagged test proves decoding and Hide QR but does not test
  the page-close boundary.
- The brief proposes one-time monetization, but this candidate has no paid
  feature or license flow. Core handoff tools are intentionally free. No
  product-unlock endpoint exists to rate-limit or verify.
- No AI feature is appropriate or missing for this recordkeeping job; explicit
  import/export already addresses the obvious portability need.
- This is not a library, CLI, or backend, so consumer-package, concurrency,
  persistence-server, health/build endpoint, and API-rate-limit checks do not
  apply.

## Evidence index

- `.factory/qa-artifacts/claim-logs/`
- `.factory/qa-artifacts/npm-test.log`
- `.factory/qa-artifacts/type.log`
- `.factory/qa-artifacts/lint.log`
- `.factory/qa-artifacts/build.log`
- `.factory/qa-artifacts/live/artifact-identity.txt`
- `.factory/qa-artifacts/live/headers-matrix.txt`
- `.factory/qa-artifacts/live/verification-3-results.json`
- `.factory/qa-artifacts/live/verification-3-routes.json`
- `.factory/qa-artifacts/live/verification-3-keyboard.json`
- `.factory/qa-artifacts/live/verification-3-print.json`
- `.factory/qa-artifacts/live/verification-3-first-visit-offline.json`
- `.factory/qa-artifacts/live/lighthouse-mobile.json`
- `.factory/qa-artifacts/verify-url/verify.json`

## Required next steps

Record add/stop events as immutable regimen changes and keep historical records
visible when the active regimen becomes empty. Constrain dose entry to sensible
dates or clearly relabel and validate non-today records. Make Import backup a
real keyboard-focusable control. Fit a representative multi-medication handoff
onto one printed page or provide an explicit one-page summary mode. Add exact
claim coverage for the Stop promise and QR close behavior, then rerun all gates
and independent verification.
