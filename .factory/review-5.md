# Adversarial first-read review 5 — Med Handoff Card

**Verdict: FAIL**

Reviewed 2026-08-29 UTC against live production at
<https://med-handoff-card.sociobot.in> and repository commit
`564a2f02edc410ee9b46132403eccb551cab93ad`. No product code was changed.

Four blocking findings and four minor findings remain. All 17 declared claim
tests pass, but the broad demo-isolation promise is still narrower in the
claim manifest and test than in public copy. Two earlier terminology findings
are also only partly fixed, so they return as blocking findings under their
original IDs.

## Findings

### F-1-6 — BLOCKING — The broad demo-isolation promise is still tested only for one dose change

- **Exact quote / location:** Live demo banner: “Demo — sample data, nothing
  is saved to your real record.” README: “The demo is isolated from your real
  record.” `.factory/claims.json` instead limits `demo-isolation` to “Dose
  changes in the sample demo do not change your real record,” and
  `tests/claims.spec.ts` changes one dose only.
- **Why a visitor is misled:** The banner and README promise isolation for
  every demo action. The regression test would still pass if editing the care
  recipient, shift note, medication list, or importing a backup later wrote
  to the real record. This is the same coverage gap raised in review 1, only
  narrowed in the secondary banner sentence.
- **Concrete fix:** Change the `demo-isolation` claim to the full public
  promise. In its one tagged test, snapshot the real IndexedDB record, then
  change the demo recipient, shift note, medication list, dose states, import,
  and theme; reset and exit; finally compare the real record byte-for-byte and
  assert only `demo:` preferences were written.

### F-1-11 — BLOCKING — “Medicine” still replaces “medication” in user-facing copy

- **Exact quote / location:** Live real-record shift-note placeholder and
  `src/main.ts`: “Example: New blood pressure **medicine** started today; hold
  only if prescriber said so.” The rest of the interface uses “medication.”
- **Why a visitor is lost:** Review 1 required one word for this concept and
  the repair record says “medication” is used throughout. The live form still
  switches terms at the point where a caregiver writes a safety-relevant
  note.
- **Concrete fix:** Rewrite it as “Example: New blood pressure medication
  started today; hold only if the prescriber said so.” Add a copy regression
  assertion that user-facing app text and placeholders contain no standalone
  “medicine.”

### F-1-12 — BLOCKING — “Regimen” still replaces “current medication list” in history

- **Exact quote / location:** After stopping the last medication, live history
  and `src/main.ts` show “Last **regimen**: 5 mg · Morning.” Elsewhere the same
  saved set is “current medication list.”
- **Why a visitor is lost:** This reintroduces the clinical synonym that
  review 1 explicitly removed. A family caregiver should not have to decide
  whether a regimen is different from the medication list.
- **Concrete fix:** Use “Last medication-list entry:” or, more naturally,
  “Previously listed: 5 mg · Morning.” Add the stopped-history test assertion
  that public text contains neither “regimen” nor another name for the current
  medication list.

### F-5-1 — BLOCKING — “Stop” can read as an instruction to stop taking a medication

- **Exact quote / location:** Live current-medication-list rows expose the
  buttons “Edit” and “Stop”; the resulting history event is “Medication
  stopped.”
- **Why a visitor is misled:** In a medication product, “Stop” beside a drug
  can be read as clinical advice or as changing the prescription. The actual
  result is only to remove the item from this app’s current list. The button
  does not name that result.
- **Concrete fix:** Label the action “Remove from current list.” Use the same
  wording in the confirmation and history, such as “Removed from current
  list.” Keep the existing warning that prior dose history remains, and test
  the accessible button name and confirmation text.

### F-5-2 — MINOR — The audience sentence uses a metaphor

- **Exact quote / location:** First screen: “For adult children and home
  caregivers who need a clear record when care **changes hands**.”
- **Why a visitor is slowed down:** “Changes hands” is an idiom instead of
  naming the actual handoff situation. The attached plain-words standard bans
  metaphorical copy.
- **Concrete fix:** Use “For adult children and home caregivers who need a
  clear record when another caregiver takes over.”

### F-5-3 — MINOR — The landing page gives the printed handoff a second name

- **Exact quote / location:** Handoff tools: “Print the **shift card**, show
  its QR code to another caregiver, or save your own backup.” The heading and
  button call it a “handoff” (“Print handoff”), and “shift card” is not defined
  elsewhere.
- **Why a visitor is lost:** A first-time visitor can reasonably wonder
  whether a shift card is different from the handoff they are about to print.
- **Concrete fix:** Use “Print the handoff, show its QR code to another
  caregiver, or save your own backup.” Keep “handoff” as the only artifact
  term.

### F-5-4 — MINOR — The three advertised dose states are not covered by one exact claim test

- **Exact quote / location:** Landing page: “Choose Taken, Held, or Unknown
  and add a note.” README: “The app records each dose as Taken, Held, or
  Unknown.” The `dose-state-notes` claim says only “Records a dose state and
  optional caregiver note,” and its test records only Held. `demo-entry`
  observes Taken and Held but does not exercise Unknown as a saved choice.
- **Why a visitor is misled:** The public copy promises three usable saved
  states, while the manifest and observable test cover only part of that
  enumeration. This is an unlisted/under-specified claim even though the
  current implementation appears to support it.
- **Concrete fix:** Change `dose-state-notes` to “Records Taken, Held, or
  Unknown with an optional caregiver note.” In its single tagged test, select
  and reload each state, including a transition back to Unknown, and verify
  the note behavior.

### F-5-5 — MINOR — The repository’s copy-audit word counts are inaccurate

- **Exact quote / location:** `.factory/copy-audit.md` says it uses
  whitespace-delimited counts but records 14 words for “For adult children …
  changes hands” (15), 16 for “Print for the next caregiver … yourself” (17),
  and 14 for “Anyone who scans it … trust” (15).
- **Why this matters:** The proof artifact cannot reliably demonstrate the
  22-word cap or average if its stated counting method is not applied.
- **Concrete fix:** Generate the table from the source copy with one checked
  counting script and commit the corrected 15, 17, and 15 counts. Add the
  script or a test so the audit cannot drift from rendered copy.

## Cold first screen, before scrolling

Fresh Chromium contexts were used at 390 × 844 and 1280 × 900. No stored
record, cookies, or local storage were present.

| Question | My answer from the first screen | Result |
| --- | --- | --- |
| What does this do? | It tracks scheduled medication doses and leaves a handoff record for another family caregiver. | Clear from “Track medication handoffs between family caregivers” and the three short facts. |
| For whom? | Adult children and home caregivers who share care. | Clear from the audience sentence, though “care changes hands” is flagged in F-5-2. |
| What should I click first? | “Try it with sample data” to see a filled handoff; “Add your first medication” is the real-data alternative. | Clear, adjacent, and visible without scrolling in both viewports. |

The first-screen gate itself passes. The mobile screen contains the headline,
audience, sample action and result, real-data action, and all three facts before
the first viewport ends. The desktop screen exposes the same information.

## Copy audit

Counts are whitespace-delimited. Landing average: **9.4 words** across 18
sentences/alt-text sentences. README average: **8.8 words** across 33
sentences or instruction fragments. No item exceeds 22 words and no banned
marketing word appears.

### Landing-page sentences

| # | Exact sentence | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Track medication handoffs between family caregivers. | 6 | None. |
| 2 | For adult children and home caregivers who need a clear record when care changes hands. | 15 | F-5-2: metaphor. |
| 3 | Open a filled sample handoff in one click. | 8 | Covered by `demo-entry`. |
| 4 | Medication records stay in this browser. | 6 | Covered by `local-only` and `real-record-retention`. |
| 5 | The board works offline after your first visit. | 8 | Covered by `offline-reload`. |
| 6 | Printing, QR handoffs, and exports are free. | 7 | Covered by `free-tools`. |
| 7 | Dithered illustration of a pill organizer, blank handoff card, and pencil. | 11 | Informative image alt; no flag. |
| 8 | Add the current medication list. | 5 | Covered by `current-medication-list`. |
| 9 | Enter each medication, amount, and scheduled time. | 7 | Covered by `current-medication-list`. |
| 10 | Mark each dose. | 3 | Covered in part by `dose-state-notes`. |
| 11 | Choose Taken, Held, or Unknown and add a note. | 9 | F-5-4: exact enumeration is under-tested. |
| 12 | Print, share, or back up the handoff. | 7 | Covered by print, QR, and export claims. |
| 13 | Print for the next caregiver, show the QR code in person, or save a backup for yourself. | 17 | None. |
| 14 | Print the shift card, show its QR code to another caregiver, or save your own backup. | 16 | F-5-3: “shift card” is inconsistent. |
| 15 | A QR handoff contains the selected date, current medication list, and dose states. | 13 | Covered by `qr-contents`. |
| 16 | Anyone who scans it can read it, so share it only with someone you trust. | 15 | Covered by `qr-contents`. |
| 17 | Track medication handoffs between family caregivers. | 6 | None; footer repetition. |
| 18 | The app loads no analytics or code from other sites. | 10 | Covered by `local-only`. |

### Landing headings, labels, links, and buttons

| Exact copy | Role | Result |
| --- | --- | --- |
| Private caregiver record | First-screen label | Useful category/privacy context. |
| Track medication handoffs between family caregivers. | `h1` | Direct six-word job headline. |
| How it works | Section label | Direct. |
| Create a medication handoff in three steps | `h2` | Names the section. |
| Handoff tools | Section label | Direct. |
| Print, share, or back up the handoff | `h2` | Names the section and outcomes. |
| Board / Demo / Tools / Privacy | Navigation links | Destination names; no flag. |
| Use night view | Button | Names the result. |
| Try it with sample data | Primary link | Names the result. |
| Add your first medication | Button | Names the result. |
| Print handoff | Button | Names the result. |
| Show QR handoff | Button | Names the result. |
| Export backup | Button | Names the result. |
| Import backup | Button | Names the result. |

No heading is a mood line or slogan. The landing actions pass the result-naming
test. The app’s separate “Stop” control fails that test in F-5-1.

### README sentences and instruction fragments

| # | Exact sentence or fragment | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Track scheduled doses and leave a clear medication handoff for the next family caregiver. | 14 | None. |
| 2 | The app records each dose as Taken, Held, or Unknown. | 10 | F-5-4: exact enumeration is under-tested. |
| 3 | It is a caregiver record, not medical advice. | 8 | Direct limitation. |
| 4 | Try it with sample data. | 5 | Result-naming link. |
| 5 | The demo is isolated from your real record. | 8 | F-1-6: broader than its claim/test. |
| 6 | Keeps a current medication list with amounts, directions, and times. | 10 | Covered by `current-medication-list`. |
| 7 | Records a dose state and optional caregiver note. | 8 | Covered by `dose-state-notes`. |
| 8 | Records medication list changes and keeps prior dose history visible. | 10 | Covered by `regimen-history` and `stopped-history`. |
| 9 | Prints the included eight-medication test fixture on one A4 or Letter page. | 12 | Covered by `print-handoff`. |
| 10 | Creates a local QR handoff until you hide it or close the page. | 13 | Covered by `qr-handoff`. |
| 11 | Includes the selected date, current medication list, and dose states in readable QR data. | 14 | Covered by `qr-contents`. |
| 12 | Works offline after the first visit. | 6 | Covered by `offline-reload`. |
| 13 | Stores your real record in this browser’s local database. | 9 | Covered by `real-record-retention`. |
| 14 | Exports JSON and CSV backups. | 5 | Covered by `json-csv-export`. |
| 15 | Encrypts an optional backup in this browser. | 7 | Covered by `encrypted-backup`. |
| 16 | Its passphrase is required to open it. | 7 | Covered by `encrypted-backup`. |
| 17 | Deletes your real record from the Privacy page. | 8 | Covered by `delete-record`. |
| 18 | The app loads no analytics or code from other sites. | 10 | Covered by `local-only`. |
| 19 | Use Node 20 or newer and Playwright 1.58.2. | 8 | Appropriate run prerequisite. |
| 20 | The production output is dist/, with index.html at its root. | 10 | Confirmed by build. |
| 21 | Run npm test to run the browser suite. | 8 | Direct instruction. |
| 22 | See the claim tests and quality tests for exact assertions. | 10 | Direct documentation pointer. |
| 23 | Run one claim with its ID: | 6 | Direct instruction. |
| 24 | Medication records stay in this browser unless you print, export, import, or show a QR code. | 16 | Covered by `local-only`; user-triggered disclosures are named. |
| 25 | Anyone who scans a QR handoff can read it. | 9 | Covered by `qr-contents`. |
| 26 | Encrypted backups cannot be recovered without their passphrase. | 8 | Covered by `encrypted-backup`. |
| 27 | Use Delete this record on the Privacy page to erase the local medication record. | 14 | Covered by `delete-record`. |
| 28 | See Privacy and Terms for the full policy. | 8 | Direct links. |
| 29 | Confirm unclear medication instructions with the prescriber or pharmacist. | 9 | Safety instruction, not a product claim. |
| 30 | This is a static progressive web app. | 7 | Appropriate deployment description. |
| 31 | The factory deploys dist/ to Azure Static Web Apps with public/staticwebapp.config.json. | 11 | Appropriate deployment instruction; confirmed configuration exists. |
| 32 | MIT. | 1 | License identifier. |
| 33 | See LICENSE. | 2 | Direct documentation pointer. |

README headings “What it does,” “Run and verify,” “Data and safety,” “Deploy,”
and “License” make sense out of context. The README contains no banned
marketing adjective or unexplained reader-facing implementation jargon.

### Terminology check

| Concept | Expected term | Terms found | Result |
| --- | --- | --- | --- |
| Drug entry | medication | medication, medicine | F-1-11 reopened. |
| Saved active set | current medication list | current medication list, regimen | F-1-12 reopened. |
| Transfer artifact | handoff | handoff, shift card | F-5-3. |
| Example environment | demo | demo | Consistent. |
| Portable saved copy | backup | backup | Consistent. |
| Scheduled event | dose | dose | Consistent. |

## Demo and sandbox verification

The one-click path passes from a cold root page. Clicking “Try it with sample
data” opens `/?demo=1` immediately with:

- persistent “Demo — sample data, nothing is saved to your real record” banner;
- Nora Ellis, the breakfast/evening shift note, and three realistic medications;
- Taken states for Metformin and Vitamin D3, and Held for Lisinopril;
- visible Reset demo and Start for real actions.

Reset restored the original person, three medications, note, and dose states.
In a fresh direct `/demo` context, `indexedDB.databases()` remained empty and
local storage remained empty. In a separate context with a real medication,
I changed a demo dose, shift note, medication list, and appearance, then reset
and exited. The real IndexedDB record compared byte-for-byte equal before and
after; the only demo preference was `demo:mhc_theme`. No demo or Nora data
appeared in the real record. This confirms current behavior, but does not close
the automated coverage gap in F-1-6.

The complete live demo flow made only same-origin requests. After one online
visit and service-worker control, `/demo` reloaded offline with Nora and the
filled board. No runtime provider key, external AI call, analytics request, or
third-party script was present.

## Declared claims

Every exact command in `.factory/claims.json` ran separately from a clean
local clone at the reviewed commit.

| Claim ID | Result | Observed assertion |
| --- | --- | --- |
| `demo-entry` | PASS | Root action opened the filled Nora sample in one click. |
| `demo-isolation` | PASS | One demo dose/reset did not alter the seeded real medication; scope gap is F-1-6. |
| `offline-reload` | PASS | Controlled demo reloaded after the context went offline. |
| `local-only` | PASS | Demo dose and QR flow made no off-origin request. |
| `json-csv-export` | PASS | JSON and populated CSV downloaded. |
| `encrypted-backup` | PASS | Encrypted parcel was produced and rejected a wrong passphrase. |
| `qr-handoff` | PASS | Data-URL QR appeared, hid, and disappeared after reload. |
| `qr-contents` | PASS | Decoded date, person, note, all medications, and dose states matched. |
| `print-handoff` | PASS | Included eight-item fixture produced one A4 and one Letter page. |
| `free-tools` | PASS | Print, QR, and export were enabled with no checkout. |
| `current-medication-list` | PASS | Amount, direction, and schedule survived reload. |
| `dose-state-notes` | PASS | Held state and note survived reload; enumeration gap is F-5-4. |
| `real-record-retention` | PASS | Saved medication survived reload. |
| `regimen-history` | PASS | Prior and new amount/time appeared in history. |
| `stopped-history` | PASS | Dose, note, change, and stop history remained after the last item was removed. |
| `no-future-doses` | PASS | Future date was rejected and absent from IndexedDB. |
| `delete-record` | PASS | Confirmed deletion cleared the real record and left the demo available. |

There is no failing declared test. F-1-6 and F-5-4 are public-claim coverage
findings discovered by cross-checking the exact copy against the manifest and
tagged assertions.

## Earlier-finding audit

Each earlier item was checked in current source and on the byte-identical live
deployment, not accepted from the polish notes alone.

| Earlier ID | Current result | Live and code confirmation |
| --- | --- | --- |
| F-1-1 | Fixed | Privacy navigation focuses “Privacy”; Back focuses the board `h1`; `pushState`/`popstate` and polite route status remain in `src/main.ts`. |
| F-1-2 | Fixed | Home, Demo, Privacy, Terms, and 404 have route-specific title, description, canonical, OG/Twitter data, and icons. |
| F-1-3 | Fixed | Header, four-link navigation, appearance control, footer, legal links, factory credit, and build ID render on every route. |
| F-1-4 | Fixed | Every entry links the self-hosted 180 × 180 PNG touch icon. |
| F-1-5 | Fixed | The root sample action opens the complete demo in one click; `@claim:demo-entry` passes. |
| F-1-6 | **Reopened — BLOCKING** | Broad banner/README isolation remains narrower in the claim and tagged test. |
| F-1-7 | Fixed | QR is decoded without a key and checked against the full selected-date sample. |
| F-1-8 | Fixed | README now points to named test files instead of claiming broad suite coverage. |
| F-1-9 | Fixed | Print copy and test both name the included eight-medication fixture. |
| F-1-10 | Fixed | Privacy exposes confirmed “Delete this record”; the tagged test passes live-equivalent behavior. |
| F-1-11 | **Reopened — BLOCKING** | Live placeholder still says “medicine”; see finding. |
| F-1-12 | **Reopened — BLOCKING** | Live stopped-item history still says “Last regimen”; see finding. |
| F-1-13 | Fixed | Tools heading is “Print, share, or back up the handoff.” |
| F-1-14 | Fixed | Appearance button says “Use night view” or “Use light view.” |
| F-1-15 | Fixed | Public copy says no analytics/code from other sites; live request log is same-origin only. |
| F-1-16 | Fixed | README says “this browser’s local database”; IndexedDB remains implementation-only. |
| F-1-17 | Fixed | Reader copy describes the required passphrase; algorithm jargon remains in tests/source only. |
| F-1-18 | Fixed | README’s product assurances avoid axe/service-worker jargon; tool names remain only in run instructions. |
| F-1-19 | Fixed | README spells out “static progressive web app.” |
| F-1-20 | Fixed | Privacy `h1` is “Privacy.” |
| F-1-21 | Fixed | Terms `h1` is “Terms of use.” |
| F-1-22 | Fixed | An unknown live URL returns HTTP 404 with designed “Page not found.” UI and route home. |
| F-1-23 | Fixed | “Ordinary medications” is absent; the tested fixture defines the print boundary. |
| F-2-1 | Fixed | Step three directly says “Print, share, or back up the handoff.” |
| F-2-2 | Fixed | The semantic `h2` is “Create a medication handoff in three steps.” |
| F-2-3 | Fixed | README has no reader-facing IndexedDB/AES-GCM/key-derivation explanation. |
| F-3-1 | Fixed | Public footers omit the artwork-generation assertion; provenance remains in design records. |
| F-4-1 | Fixed | Bedtime says “No doses are scheduled at this time.” |
| F-4-2 | Fixed | Every route uses the self-hosted 1200 × 630 PNG social card. |

## Structure, accessibility, and visual identity

- Live titles are “Med Handoff Card — caregiver medication handoffs,” “Demo —
  Med Handoff Card,” “Privacy — Med Handoff Card,” “Terms of use — Med Handoff
  Card,” and “Page not found — Med Handoff Card.” Each route has one `h1`,
  `lang=en`, a `main`, description, canonical, OG/Twitter metadata, SVG favicon,
  and 180 px touch icon.
- Unknown routes return HTTP 404 with the designed page. All site navigation
  links and fragment targets resolve; no dead destination was found. The 404
  page’s own skip link correctly targets its local `#main` while retaining the
  expected 404 response.
- Route navigation, Back, and Forward restore heading focus and announce the
  route. Shared chrome remains consistent across home, demo, legal, and 404.
- Live light and dark demo views produced zero serious/critical axe findings.
  Visible interactive targets at 390 px were at least 44 × 44 CSS px. At 200%
  root text size, document width remained 390 px. Reduced-motion CSS gates the
  stamp animation.
- Cold home and demo loads produced no application console errors. The only
  captured resource error occurred when deliberately requesting the expected
  HTTP-404 route.
- The deployed HTML, JavaScript, CSS, service worker, manifest, social card,
  and route documents match the clean-clone `dist/` bytes by SHA-256. JavaScript
  is 54.13 KB raw / 19.98 KB gzip; CSS is 14.63 KB raw / 4.13 KB gzip.
- The dithered bedside-print identity is distinct: warm chart paper, blue ink,
  marigold stamps, square offset controls, halftone pill-tray artwork, and a
  separate night palette. It does not resemble a centered gradient SaaS hero
  or generic three-card feature template.

## Missed leverage

No additional feature finding is warranted. The brief file is absent, but the
documented job is covered by medication/dose recording, print, readable local
QR, JSON/CSV export, encrypted backup, import, deletion, and offline use. Cloud
sync would change the explicit local-only privacy model. An AI medication step
is not implied by the job and would add clinical/privacy risk; no decorative AI
feature or embedded provider key is present.

## Verification record

- Clean clone: every one of the 17 claim commands passed separately.
- Full suite: 3 unit tests and 32 Chromium tests passed.
- `npm run test:type`, `npm run lint`, and `npm run build` passed; `dist/` was
  produced.
- Live: cold 390 px and desktop first read, one-click demo, reset/exit, extended
  isolation check, offline reload, request log, QR/demo state, routes, Back
  focus, metadata, 404, crawl, both-theme axe, 44 px targets, and 200% text
  checks completed.

## What would make this perfect

Close all eight findings, then rerun the review from a fresh context. In
particular: make the demo-isolation test cover every mutating control; use only
“medication,” “current medication list,” and “handoff”; replace the ambiguous
“Stop” action with “Remove from current list”; remove the “changes hands”
metaphor; test all three advertised dose states; and regenerate the copy audit
with correct counts. PASS requires that rerun to find nothing else.
