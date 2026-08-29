# Adversarial first-read review 4 — Med Handoff Card

**Verdict: FAIL**

Reviewed 2026-08-29 UTC against the live site and a clean local clone. No
product code was modified. The cold-read, demo, claims, privacy, offline,
accessibility, routing, and prior-regression checks passed. This remains a
FAIL because acceptance requires zero findings.

## Findings

### F-4-1 — MINOR — Demo empty-state copy contradicts the sample

- **Location / quote:** The sample demo's `Bedtime` dose-board card says “No
  current medications at this time.” The same board says “3 current
  medications” and lists Metformin, Lisinopril, and Vitamin D3.
- **Why a visitor is misled:** “Current medication” means an active item in
  this product's current medication list. The sentence is false; what is
  absent is a bedtime dose. A rushed caregiver can infer that the list has
  been cleared.
- **Concrete fix:** Replace it with **“No doses are scheduled at this time.”**
  Add a browser test that opens `/demo`, finds Bedtime, and asserts the new
  wording.

### F-4-2 — MINOR — Social-card metadata uses an unreliable image format

- **Location / quote:** Live root metadata sets both `og:image` and
  `twitter:image` to `https://med-handoff-card.sociobot.in/social-card.svg`.
- **Why a visitor is misled:** Open Graph and Twitter card consumers do not
  reliably render SVG card images. A shared link can lose its intended preview
  despite the site declaring a 1200 × 630 social card.
- **Concrete fix:** Ship a self-hosted 1200 × 630 PNG or JPEG derived from the
  current product art; point both tags to it; add a metadata test that checks
  the URL and an `image/png` or `image/jpeg` response.

## Cold first read

Fresh browser contexts at 390 × 844 and 1440 × 900 opened `/` with no prior
storage. Before scrolling, both screens answered all three mandatory questions:

| Question | Exact answer visible |
| --- | --- |
| What does it do? | “Track medication handoffs between family caregivers.” |
| For whom? | “For adult children and home caregivers who need a clear record when care changes hands.” |
| What should I click first? | **Try it with sample data** — “Open a filled sample handoff in one click.” |

The three local/offline/free facts and the real-data alternative are also
visible at 390 px. No first-screen blocking finding was confirmed.

## Copy audit

Counts are whitespace-delimited. The landing table covers the clean empty
state, including repeated footer text and the meaningful illustration alt.

### Landing-page sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| Track medication handoffs between family caregivers. | 6 | — |
| For adult children and home caregivers who need a clear record when care changes hands. | 15 | — |
| Open a filled sample handoff in one click. | 8 | — |
| Medication records stay in this browser. | 6 | — |
| The board works offline after your first visit. | 8 | — |
| Printing, QR handoffs, and exports are free. | 7 | — |
| Dithered illustration of a pill organizer, blank handoff card, and pencil. | 11 | — |
| Add the current medication list. | 5 | — |
| Enter each medication, amount, and scheduled time. | 7 | — |
| Mark each dose. | 3 | — |
| Choose Taken, Held, or Unknown and add a note. | 9 | — |
| Print, share, or back up the handoff. | 7 | — |
| Print for the next caregiver, show the QR code in person, or save a backup for yourself. | 16 | — |
| Print the shift card, show its QR code to another caregiver, or save your own backup. | 16 | — |
| A QR handoff contains the selected date, current medication list, and dose states. | 12 | — |
| Anyone who scans it can read it, so share it only with someone you trust. | 14 | — |
| Track medication handoffs between family caregivers. | 6 | — |
| The app loads no analytics or code from other sites. | 10 | — |

### README sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| Track scheduled doses and leave a clear medication handoff for the next family caregiver. | 14 | — |
| The app records each dose as Taken, Held, or Unknown. | 10 | — |
| It is a caregiver record, not medical advice. | 8 | — |
| Try it with sample data. | 5 | — |
| The demo is isolated from your real record. | 8 | — |
| Keeps a current medication list with amounts, directions, and times. | 10 | — |
| Records a dose state and optional caregiver note. | 8 | — |
| Records medication list changes and keeps prior dose history visible. | 10 | — |
| Prints the included eight-medication test fixture on one A4 or Letter page. | 12 | — |
| Creates a local QR handoff until you hide it or close the page. | 13 | — |
| Includes the selected date, current medication list, and dose states in readable QR data. | 14 | — |
| Works offline after the first visit. | 6 | — |
| Stores your real record in this browser’s local database. | 9 | — |
| Exports JSON and CSV backups. | 5 | — |
| Encrypts an optional backup in this browser. | 7 | — |
| Its passphrase is required to open it. | 7 | — |
| Deletes your real record from the Privacy page. | 8 | — |
| The app loads no analytics or code from other sites. | 10 | — |
| The production output is `dist/`, with `index.html` at its root. | 10 | — |
| Run `npm test` to run the browser suite. | 8 | — |
| See the claim tests and quality tests for exact assertions. | 10 | — |
| Run one claim with its ID. | 6 | — |
| Medication records stay in this browser unless you print, export, import, or show a QR code. | 15 | — |
| Anyone who scans a QR handoff can read it. | 9 | — |
| Encrypted backups cannot be recovered without their passphrase. | 8 | — |
| Use Delete this record on the Privacy page to erase the local medication record. | 14 | — |
| See Privacy and Terms for the full policy. | 8 | — |
| Confirm unclear medication instructions with the prescriber or pharmacist. | 9 | — |
| This is a static progressive web app. | 7 | — |
| The factory deploys `dist/` to Azure Static Web Apps with `public/staticwebapp.config.json`. | 11 | — |
| MIT. | 1 | — |
| See LICENSE. | 2 | — |

No landing or README sentence exceeds 22 words or uses banned marketing words.
The headings name sections and the buttons name results. Terminology is
consistent for medication, current medication list, dose, handoff, backup,
care recipient, and demo. F-4-1 is a separate in-product demo-copy issue.

## Demo, claims, and sandbox

One tap on **Try it with sample data** opened `/?demo=1`, immediately showing
Nora Ellis, a realistic shift note, three medications, Taken/Held states, and
the actual board. The persistent banner says “Demo — sample data, nothing is
saved to your real record,” with **Reset demo** and **Start for real**.

Reset restored the sample. A fresh demo followed by Start for real showed the
blank real board, removed the banner, and did not retain Nora Ellis. The
declared isolation test also created a real medication, changed/reset demo
data, and confirmed that only the real medication remained after exit. Demo
data is in memory; its only local preference key is `demo:mhc_theme`.

Live Playwright request logging across demo, reset, and exit observed only the
product origin and no console error. The offline claim test establishes
service-worker control, goes offline, reloads `/demo`, and passes with sample
data present.

I made a clean clone at `/tmp/mhc-review-4.BCEr0J`, ran `npm ci` (128 packages,
zero reported vulnerabilities), every exact command declared in
`.factory/claims.json`, `npm test`, and `npm run build`. All 17 declared tests
passed and the build produced `dist/` (19.98 KB gzipped JavaScript; 170.45 KB
WebP asset).

| Claim ID | Result |
| --- | --- |
| `demo-entry`, `demo-isolation`, `offline-reload`, `local-only` | PASS |
| `json-csv-export`, `encrypted-backup`, `qr-handoff`, `qr-contents` | PASS |
| `print-handoff`, `free-tools`, `current-medication-list` | PASS |
| `dose-state-notes`, `real-record-retention`, `regimen-history` | PASS |
| `stopped-history`, `no-future-doses`, `delete-record` | PASS |

All behavioral landing/README claims map to this registry. No unlisted claim
was found.

## Structure, privacy, accessibility, and visual identity

- `/`, `/demo`, `/privacy`, and `/terms` return 200. A missing route returns
  designed `Page not found.` content with HTTP 404.
- Checked pages have `lang="en"`, one `h1`, `main`, route-specific titles,
  descriptions, canonicals, icons, and Open Graph/Twitter text fields. Route
  changes focus and announce the destination heading; Back/Forward restores it.
- Shared header/footer, Privacy/Terms links, internal links, CSP response
  header, same-origin-only requests, no analytics, no provider key, and no
  console errors were confirmed.
- The quality suite covers desktop/390 px, light/night axe checks, 44 px
  targets, keyboard dialogs/import, and 200% text without overflow.
- The paper grid, cobalt/marigold risograph palette, Georgia/sans pairing,
  square-rule controls, and pill-tray art match `.factory/design.md` and are
  distinct from a generic SaaS template.

Print, QR, JSON/CSV export, and import cover the obvious portable-handoff
needs. AI would add avoidable health-data sharing to this local manual record;
no implied AI feature is missing.

## Earlier-history regression check

Every earlier review, polish report, verification report, and handoff was
read. Each prior finding was checked against current source and live behavior:

| IDs | Current verification |
| --- | --- |
| F-1-1 | Fixed: History routing focuses/announces heading; Back/Forward restore focus. |
| F-1-2 | Fixed: route-specific metadata and icons are present. |
| F-1-3 | Fixed: shared masthead/footer, Tools link, and view control remain on all routes. |
| F-1-4 | Fixed: 180 px Apple touch icon is linked. |
| F-1-5 | Fixed: cold one-click demo claim passes. |
| F-1-6 | Fixed: banner limits promise to tested dose isolation. |
| F-1-7 | Fixed: QR test decodes complete selected-date data. |
| F-1-8 | Fixed: README links exact tests instead of broad coverage assurance. |
| F-1-9 | Fixed: print wording names the tested fixture. |
| F-1-10 | Fixed: Privacy deletion action and test pass. |
| F-1-11 | Fixed: public copy consistently says medication. |
| F-1-12 | Fixed: saved set consistently says current medication list. |
| F-1-13 | Fixed: tools heading names the actions. |
| F-1-14 | Fixed: theme button names the resulting view. |
| F-1-15 | Fixed: privacy copy uses plain no-analytics/external-code wording. |
| F-1-16 | Fixed: reader-facing storage copy says local database. |
| F-1-17 | Fixed: backup copy explains the passphrase outcome. |
| F-1-18 | Fixed: README removed jargon-heavy test-suite assurance. |
| F-1-19 | Fixed: README expands progressive web app. |
| F-1-20 | Fixed: Privacy heading is direct. |
| F-1-21 | Fixed: Terms heading is “Terms of use.” |
| F-1-22 | Fixed: designed 404 says “Page not found.” |
| F-1-23 | Fixed: undefined “ordinary medications” wording is absent. |
| F-2-1 | Fixed: third how-to step names print/share/backup work. |
| F-2-2 | Fixed: how-to heading names the three-step task. |
| F-2-3 | Fixed: no reader-facing IndexedDB/AES-GCM/key-derivation jargon remains. |
| F-3-1 | Fixed: artwork provenance stays in design records, not public claim copy. |

## What would make this perfect

Replace the contradictory Bedtime sentence, ship a self-hosted raster social
card, add their targeted tests, and repeat this cold-read audit. No other
finding was confirmed.
