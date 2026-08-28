# Independent verification 2 — FAIL

- Candidate: `a0605682d1f662b9934a85fea10ecef6e42082f3`
- Live URL: `https://med-handoff-card.sociobot.in`
- Verified: 2026-08-28 UTC
- Artifact class: offline PWA

## Release decision

**FAIL.** The required claims commands and repository gates pass, and the live
deployment matches the candidate build. The product still has release-blocking
safety, offline, accessibility, QR-handoff, and input-recovery defects. In
particular, a malformed backup can persist corrupt data and leave the app unable
to render, whitespace-only medicines create blank scheduled doses, regimen
changes have no durable history, and the dark theme has serious axe findings.

## Mandatory first-read and demo gate

**PASS.** On a cold 1440 × 900 live visit, the first screen says:

- What: “Track medicine handoffs between family caregivers.”
- For whom: “For adult children and home caregivers who need a clear record
  when care changes hands.”
- First click: **Try it with sample data**, followed by “See a filled handoff
  board in one click.”

The action opens `/demo` in one click. The resulting screen immediately shows
Nora Ellis, three realistic medicines, Taken/Held/Unknown states, a shift note,
and the persistent “Demo — sample data, nothing is saved” banner with **Reset
demo** and **Start for real**. The cold load returned 200, made only same-origin
requests, and logged no console or page errors.

## Mandatory claims gate

`.factory/claims.json` exists. Each declared command was run separately from the
candidate checkout after `npm ci`, using the product demo entry point.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-isolation` | `npm run test:claims -- --grep "@claim:demo-isolation"` | PASS, 1 test |
| `offline-reload` | `npm run test:claims -- --grep "@claim:offline-reload"` | PASS, 1 test |
| `local-only` | `npm run test:claims -- --grep "@claim:local-only"` | PASS, 1 test |
| `json-csv-export` | `npm run test:claims -- --grep "@claim:json-csv-export"` | PASS, 1 test |
| `encrypted-backup` | `npm run test:claims -- --grep "@claim:encrypted-backup"` | PASS, 1 test |
| `qr-handoff` | `npm run test:claims -- --grep "@claim:qr-handoff"` | PASS, 1 test |
| `print-handoff` | `npm run test:claims -- --grep "@claim:print-handoff"` | PASS, 1 test |
| `free-tools` | `npm run test:claims -- --grep "@claim:free-tools"` | PASS, 1 test |

Per-command logs are in `.factory/qa-evidence/verification-2-claims/`.

Passing those narrow tests is not sufficient for acceptance. Fresh exploratory
evidence below falsifies the general offline promise, and the landing page and
README make unregistered claims about durable medication/state/note handling.
The QR test proves only that a `data:image/png` exists; it does not prove that a
recipient can associate dose states with medicines.

## Clean install and repository gates

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 127 packages; 0 audit vulnerabilities |
| `npm test` | PASS | 2 Vitest tests and 13 Chromium tests |
| `npm run test:type` | PASS | TypeScript clean |
| `npm run lint` | PASS | TypeScript clean; this is the repository's lint script |
| `npm run build` | PASS | `dist/` produced by TypeScript and Vite |

Production output is 46.20 KB JS (17.71 KB gzip), 12.93 KB CSS (3.79 KB
gzip), and 170.45 KB hero WebP. Live compressed transfers were 17,860 bytes
JS, 3,855 bytes CSS, 170,452 bytes hero, and 597 bytes HTML.

## Live deployment identity and response policy

Every deployable candidate artifact checked matched the live byte-for-byte.
`staticwebapp.config.json` correctly returns 404 because Azure consumes it as
deployment configuration rather than publishing it.

| Artifact | Candidate/live SHA-256 |
| --- | --- |
| `index.html` | `cfae52cb929c7f461c309ad39bdb6d360c0280cd91bc29b99253719fc23bd4f6` |
| app JavaScript | `b40f31c6d5e040eade0cc0051ad31a2103778ba547dc14cce1f07d52e4e353bf` |
| app CSS | `8e8da8a967d4778fa85e04eb72546a5e4b6fd6d0f7878dd124edc3e47921c6f6` |
| `sw.js` | `483848335f0ba8aee6c5d21a5bd827fc2e8e7ba0625fc0c2de9ba59fd6a0f468` |

Root, demo, privacy, and terms return 200. An unknown route returns the designed
404. The manifest is `application/manifest+json`; hashed JS/CSS/artwork use
`public, max-age=31536000, immutable`; the service worker uses `no-cache`.
Responses include CSP, HSTS, `nosniff`, `Referrer-Policy: no-referrer`, and a
permissions policy disabling camera, microphone, geolocation, and payment.

The worker verification helper passed after creating its output directory:

```text
/opt/fleet/lib/verify-url.sh https://med-handoff-card.sociobot.in .factory/qa-evidence/verification-2-verify-url
load 773 ms; title present; lang=en; one h1; main present; 0 missing alt;
0 unlabeled buttons; 0 browser errors
```

## End-to-end and boundary exercise

The live demo supported a dose change with a literal `<`/`>` note, local QR
creation, JSON/CSV download, demo reset, and return to real data. The real flow
supported adding an 80-character medication and 80-character amount, reporting
“Choose at least one time of day,” recovering after a schedule was chosen,
saving a shift note, recording Held with a note, and retaining all three after
reload. JSON/CSV downloads contained Nora Ellis and Metformin. Print media kept
the handoff and hid tools.

Light-mode desktop and 390 × 844 demo states had no horizontal overflow, no
console/page errors, no undersized interactive targets, and no serious/critical
axe findings. Reduced motion yielded `animation-name: none`. At simulated 200%
text size, the 390 px page remained 390 px wide with no clipped descendants.
Keyboard-only checks reached the skip link first, showed a 3 px focus ring,
opened the medication dialog, focused the name field, used Space on the schedule
checkbox, submitted with Enter, and changed a dose with Enter.

The normal offline `/demo` reload passed, and the repository's update test made
a changed service worker reach `waiting`, exposed **Install update**, sent
`skip-waiting`, received controller change, and reloaded the board.

## Privacy and performance

A complete live demo flow (dose note, QR, and both exports) made requests only
to `https://med-handoff-card.sociobot.in`. There are no analytics, third-party
runtime scripts, account controls, sign-in flows, paid-unlock calls, AI calls,
or product server endpoints. API rate-limit and Entra checks are therefore not
applicable.

Fresh Lighthouse 12.8.2 mobile results on `/demo?qa=a060568`: performance 93,
accessibility 100, best practices 100, SEO 100; LCP 1.20 s, FCP 0.93 s, CLS 0,
and TBT 320.5 ms. A representative theme-switch interaction measured 32 ms.
The Lighthouse accessibility score covers the default light theme; the dark
theme failure below was measured separately with axe.

## Defects

### Critical

1. **Malformed import can brick the persisted record.** Importing
   `{"personName":"QA","shiftNote":"","medications":[{"active":true}],"logs":[]}`
   passes the shallow array-only validation and replaces IndexedDB. Rendering
   then throws `Cannot read properties of undefined (reading 'includes')`.
   Reload throws again and leaves only the skip-link text, with no in-product
   recovery. A user selecting a damaged or wrong-schema backup can lose access
   to the handoff.

### High

1. **Regimen changes are not recorded and rewrite historical context.** A live
   medication was recorded as Taken at 5 mg/Morning, then edited to 10
   mg/Evening. Afterwards 5 mg disappeared everywhere; Morning said “Nothing
   due,” while history retained only “Taken Test medicine · Morning.” There is
   no prior amount, old schedule, or regimen-change event. This contradicts the
   brief's requirement to record regimen changes.
2. **Whitespace-only name and amount create a blank dose.** Three spaces in
   each required field plus Morning closed the dialog, showed “Saved on this
   device,” and rendered an empty dose row and “· Morning” regimen entry. A
   safety-adjacent handoff must reject this ambiguous record.
3. **The offline shell can be replaced by a legal page.** The service worker
   writes every successful navigation response to `/index.html`. After demo was
   controlled and `/privacy` was visited, the cached `/index.html` contained
   the Privacy document. Offline navigation to a cache-busted `/demo` then
   returned “Privacy, plainly” instead of the board. The broad “works offline
   after the first visit” claim is therefore false under a normal route
   sequence, although its narrow claim test passes.
4. **QR dose states cannot reliably be matched to medicines.** The QR regimen
   entries omit medication IDs, while dose entries contain only
   `medicationId`. Real IDs are UUIDs. With multiple medicines at one time, a
   recipient cannot associate a Taken/Held/Unknown record with a regimen item.
   The claim test checks only that a PNG data URL was created, not that the
   handoff is interpretable.
5. **Dark mode has serious axe color-contrast violations.** White on the light
   blue brand mark and primary button measures 1.85:1; light text on selected
   Held controls measures 1.22:1. Axe reports the brand mark, primary button,
   and two selected Held labels. This violates the 4.5:1 baseline and the
   non-negotiable serious/critical axe gate.
6. **Claims coverage is incomplete.** The landing page and README promise that
   the app keeps a current medication list, records Taken/Held/Unknown with
   notes, and retains the real record, but no registry entry names and proves
   those outcomes as claims. Existing incidental tests are not one tagged test
   for each listed promise. The QR and offline tests also miss the false
   behaviors above.

### Medium

1. **Demo mode writes a shared real preference.** Switching to Night in `/demo`
   writes `localStorage.mhc_theme=dark`; the value remains on **Start for real**.
   This does not alter health records, but it violates the demo contract's
   separate-storage rule and the banner's absolute “nothing is saved” wording.
2. **Dialog focus management is incomplete.** The dialog has no accessible
   name (`aria-label`/`aria-labelledby`). After a successful save changes the
   empty screen into the board, focus lands on `<body>` rather than a logical
   board heading or action.
3. **Secondary pages do not use the required common skeleton.** Privacy, Terms,
   and 404 are bare documents without the shared header/navigation/footer. The
   app footer also omits “Built by Param Factory” and a version/build ID. The
   social preview is a square 512 SVG icon, not the required product-specific
   1200 × 630 image.

## Evidence

- `.factory/qa-evidence/verification-2-claims/`
- `.factory/qa-evidence/verification-2-npm-test.txt`
- `.factory/qa-evidence/verification-2-type.txt`
- `.factory/qa-evidence/verification-2-lint.txt`
- `.factory/qa-evidence/verification-2-build.txt`
- `.factory/qa-evidence/verification2-live-results.json`
- `.factory/qa-evidence/verification-2-accessibility.json`
- `.factory/qa-evidence/verification-2-live-lighthouse-mobile.json`
- `.factory/qa-evidence/verification-2-verify-url/`
- `.factory/qa-evidence/verification-2-blank-medication.png`
- `.factory/qa-evidence/verification-2-regimen-change.png`
- `.factory/qa-evidence/verification-2-offline-after-privacy.png`
- `.factory/qa-evidence/verification-2-text-resize-200-mobile.png`

## Required next steps

Reject invalid imports before writing IndexedDB and provide recoverable import
errors. Trim and validate required medicine fields. Store immutable regimen
change events or dose snapshots. Include stable IDs on both sides of the QR
payload and test a decoded multi-medicine handoff. Cache only the actual app
shell for offline navigation. Fix dark-theme contrast. Complete the claims
registry/tests, demo storage isolation, dialog focus handling, and secondary
page skeleton, then rerun independent verification.
