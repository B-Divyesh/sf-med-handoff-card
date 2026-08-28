# Adversarial first-read review 1 — Med Handoff Card

**Verdict: FAIL**

Reviewed 2026-08-28 UTC against live production at
`https://med-handoff-card.sociobot.in` and repository base
`6f01afb0deb5485fe3863e79065b281801a26211`.

There are no failed declared claim tests and no blocking first-screen or demo
failure. The verdict is still FAIL because the acceptance rule requires zero
findings and this review found 23 minor findings. No product code was changed.

## Findings

### Route, metadata, and product-contract findings

#### F-1-1 — MINOR — Route changes do not move focus to the new page heading

- **Location / evidence:** Follow the live `/` header link `Privacy`, then use
  Back. On both navigations `document.activeElement` is `<body>`, not the new
  `<h1>`. `src/main.ts` has no `pushState`, `popstate`, or link-routing handler;
  the legal pages are separate documents.
- **Why this matters:** A keyboard or screen-reader user receives no deliberate
  route-change focus or announcement. This misses the required history and
  focus behavior even though the URLs and browser Back button otherwise work.
- **Concrete fix:** Route internal links through the History API, render the
  destination, focus its `h1` with `tabindex="-1"`, update the polite live
  region, and add a browser test for forward/back focus restoration.

#### F-1-2 — MINOR — Privacy, Terms, and 404 omit shared metadata

- **Location / quote:** Live `/privacy` and `/terms` have no Open Graph,
  Twitter, favicon, or apple-touch metadata. The live 404 additionally has no
  meta description or canonical URL. `/demo` retains the home Open Graph title
  instead of a demo-specific one.
- **Why this matters:** Shared or bookmarked non-home routes lose the product
  identity and can present the wrong route description.
- **Concrete fix:** Give every route its own description, canonical, OG/Twitter
  title and description, social image, favicon, and apple-touch link. Use
  `Demo — Med Handoff Card` metadata on `/demo` and noindex-appropriate 404
  metadata on the missing-page response.

#### F-1-3 — MINOR — The header and footer are not consistent across routes

- **Location / quote:** `/` and `/demo` show `Board · Demo · Tools · Privacy`
  and the appearance control. `/privacy`, `/terms`, and the 404 show only
  `Board · Demo · Privacy` and omit the appearance control. Their footer also
  omits the artwork provenance and no-analytics sentence shown by the app.
- **Why this matters:** Controls and navigation disappear when a visitor moves
  to a legal or error page, so the pages do not feel like one product.
- **Concrete fix:** Render one shared header and footer on every route, with the
  same links, appearance control, one-line description, Privacy, Terms,
  factory credit, build ID, and provenance copy.

#### F-1-4 — MINOR — The apple-touch icon is not the required 180 px asset

- **Location / quote:** Home metadata uses
  `<link rel="apple-touch-icon" href="/icons/icon-192.svg">`; legal and 404
  routes have no apple-touch icon.
- **Why this matters:** The site contract calls for a dedicated 180 px touch
  icon, and saved iOS shortcuts cannot rely on the specified asset.
- **Concrete fix:** Ship a 180×180 apple-touch image and link it from every
  route while retaining the SVG favicon.

#### F-1-5 — MINOR — The one-click demo sentence is an unlisted claim

- **Location / quote:** Live `/`: “See a filled handoff board in one click.”
- **Why this matters:** The statement is true in this review, but no
  `.factory/claims.json` entry names it. The demo-isolation test opens `/demo`
  directly instead of exercising the advertised one-click path.
- **Concrete fix:** Add a `demo-entry` claim whose test starts at a clean `/`,
  clicks `Try it with sample data` once, and asserts the banner, Nora Ellis,
  shift note, medications, and dose states are already rendered.

#### F-1-6 — MINOR — “Every control” is broader than the demo-isolation test

- **Location / quote:** Live `/demo` banner: “Try every control without
  changing your real record.”
- **Why this matters:** `@claim:demo-isolation` changes one dose and resets the
  demo; it does not exercise every data-changing control named by this claim.
- **Concrete fix:** Either change the copy to “Dose changes in this demo do not
  change your real record,” or extend the claim test through person, shift
  note, add/edit/stop, import, theme, and reset while comparing the real
  IndexedDB record before and after.

#### F-1-7 — MINOR — QR content and encryption warnings are unlisted claims

- **Location / quote:** Live `/` tools: “A QR handoff contains the selected
  date’s active regimen and dose states. It is not encrypted; use it only with
  someone you trust.” README and `/privacy`: “QR handoffs are not encrypted.”
- **Why this matters:** The listed `qr-handoff` claim promises creation and
  lifetime, not selected-date completeness or readable plaintext. Its test
  checks payload shape but does not compare every active medication and dose
  state with the source sample.
- **Concrete fix:** Add a `qr-contents` claim and test that decodes the QR,
  compares its date, complete active regimen, and dose states with the sample,
  and confirms the payload is readable without a decryption key.

#### F-1-8 — MINOR — The README makes an unlisted test-coverage claim

- **Location / quote:** README, Run and verify: “The browser suite covers
  desktop, 390 px mobile, keyboard use, axe, privacy, claims, offline reload,
  and service-worker updates.”
- **Why this matters:** This is a broad assurance not represented in the claim
  manifest, and “covers” does not state what outcomes are asserted.
- **Concrete fix:** Replace it with the instruction “Run `npm test` to run the
  browser suite,” then link to named test files or list exact assertions in a
  separate verification document.

#### F-1-9 — MINOR — The eight-medication print boundary is undefined

- **Location / quote:** README and claim `print-handoff`: “Prints up to eight
  ordinary medications on one A4 or Letter page.”
- **Why this matters:** “Ordinary” has no measurable meaning. The passing test
  uses short generated names and one short direction, while the form accepts
  much longer values; it does not prove the stated boundary for allowed data.
- **Concrete fix:** State the tested fixture boundary exactly, or define and
  enforce maximum printable character lengths and test eight records at those
  limits on both page sizes.

#### F-1-10 — MINOR — The privacy deletion sentence is unlisted and exposes a
missing control

- **Location / quote:** Live `/privacy`: “Clear your browser data to remove
  local records.” There is no in-product erase action in the live UI or code.
- **Why this matters:** A person storing sensitive medication data should not
  have to find browser-specific site-data settings, and the removal claim is
  not covered by `claims.json`.
- **Concrete fix:** Add a clearly separated `Delete this record` action with a
  confirmation that names what will be erased. Delete the real IndexedDB data,
  leave demo storage isolated, and add a claim test that reloads to an empty
  real record. Update Privacy with that direct path.

### Plain-language findings

#### F-1-11 — MINOR — “Medicine” and “medication” name the same concept

- **Location / quote:** Home headline: “Track **medicine** handoffs between
  family caregivers.” The primary action and all following copy use
  “**medication**,” including “Add your first medication.”
- **Why this matters:** The terminology changes within the first screen.
- **Concrete fix:** Use “medication” throughout: “Track medication handoffs
  between family caregivers.”

#### F-1-12 — MINOR — The medication list has three names

- **Location / quote:** Home: “Add the current **list**.” Tools: “active
  **regimen**.” README: “current **medication list**.” The existing copy-audit
  table says the one term is “current regimen,” but the live copy does not
  follow it.
- **Why this matters:** “List” and clinical “regimen” appear to name different
  objects when they mean the same saved set of medications.
- **Concrete fix:** Use “current medication list” everywhere, including “Add
  the current medication list” and “the selected date’s current medication
  list.” Update the terminology table.

#### F-1-13 — MINOR — The tools heading does not name the section

- **Location / quote:** Home `h2`: “Leave a clear record.”
- **Why this matters:** In a screen-reader heading list it does not identify
  printing, QR sharing, import, or export, and it repeats the preceding section
  heading’s idea.
- **Concrete fix:** Change it to “Print, share, or back up the handoff.”

#### F-1-14 — MINOR — The appearance button is not a result-naming action

- **Location / quote:** Visible button label: “Night” in light mode and “Light”
  in dark mode. The accessible names are clearer, but the visible words are
  nouns/adjectives rather than actions.
- **Why this matters:** A sighted visitor must infer whether the word describes
  the current state or the result of pressing it.
- **Concrete fix:** Use “Use night view” and “Use light view” as the visible
  labels and accessible names.

#### F-1-15 — MINOR — “Third-party runtime scripts” is implementation jargon

- **Location / quote:** Home footer and README: “The app uses no analytics or
  third-party runtime scripts.”
- **Why this matters:** A non-developer cannot readily tell what “runtime
  scripts” means or what privacy protection it provides.
- **Concrete fix:** Use “The app loads no analytics or code from other sites.”

#### F-1-16 — MINOR — “IndexedDB” is unexplained storage jargon

- **Location / quote:** README: “Stores the real record in IndexedDB in your
  browser.”
- **Why this matters:** The database implementation does not help a caregiver
  understand where the record lives.
- **Concrete fix:** Use “Stores your real record in this browser’s local
  database.” Put “IndexedDB” in developer notes only if needed.

#### F-1-17 — MINOR — The encryption sentence leads with algorithm jargon

- **Location / quote:** README: “Encrypts an optional JSON backup locally with
  AES-GCM and your passphrase.”
- **Why this matters:** “AES-GCM” is unexplained, while the useful outcome is
  that the passphrase is required to open the backup.
- **Concrete fix:** Use “Encrypts an optional backup in this browser; your
  passphrase is required to open it.” Record AES-GCM in technical notes.

#### F-1-18 — MINOR — The test-suite sentence uses unexplained tool jargon

- **Location / quote:** README: “…keyboard use, **axe**, privacy, claims,
  offline reload, and **service-worker** updates.”
- **Why this matters:** “axe” is a tool name and “service worker” is an
  implementation term; neither tells a reader what was verified.
- **Concrete fix:** Use “…keyboard use, automated accessibility checks,
  privacy, offline reloads, and app updates.”

#### F-1-19 — MINOR — “Static PWA” is unexplained product jargon

- **Location / quote:** README, Deploy: “This is a static PWA.”
- **Why this matters:** The acronym is not expanded and is unnecessary for the
  deployment instruction.
- **Concrete fix:** Use “This is a static progressive web app.”

#### F-1-20 — MINOR — The Privacy heading adds mood instead of information

- **Location / quote:** Live `/privacy` `h1`: “Privacy, plainly.”
- **Why this matters:** “Plainly” does not identify any additional content and
  is not useful in a heading list.
- **Concrete fix:** Change the heading to “Privacy.”

#### F-1-21 — MINOR — The Terms heading uses a vague adjective

- **Location / quote:** Live `/terms` `h1`: “Terms for a practical handoff.”
- **Why this matters:** “Practical” does not say what kind of terms these are.
- **Concrete fix:** Change the heading to “Terms of use.”

#### F-1-22 — MINOR — The 404 heading is a metaphor

- **Location / quote:** Live 404 `h1`: “This page is not on the handoff card.”
- **Why this matters:** The visitor has to translate product lore before
  learning what happened.
- **Concrete fix:** Change it to “Page not found.” Keep “The address may be
  wrong” as the explanation.

#### F-1-23 — MINOR — “Ordinary medications” is vague user-facing copy

- **Location / quote:** README: “Prints up to eight ordinary medications on
  one A4 or Letter page.”
- **Why this matters:** A caregiver cannot determine whether a long medicine
  name or detailed direction is “ordinary.” This is also the wording problem
  behind the unbounded claim in F-1-9.
- **Concrete fix:** Replace the adjective with the exact tested input limit,
  for example: “Prints eight medications when each name, amount, and direction
  stays within the stated print limits.”

## First screen: cold read before scrolling

Tested in fresh Chromium contexts with service workers blocked at 390×844 and
1440×900. Both loaded with HTTP 200 and no console error.

- **What it does:** It records medication handoffs and scheduled dose states.
- **For whom:** Adult children, home caregivers, and other family caregivers.
- **What to click first:** `Try it with sample data` to see a filled handoff
  board. `Add your first medication` is the clear real-data alternative.

The exact copy that answered those questions was:

> Track medicine handoffs between family caregivers.
>
> For adult children and home caregivers who need a clear record when care
> changes hands.
>
> Try it with sample data
>
> See a filled handoff board in one click.

The three first-screen facts were also visible without scrolling at both
sizes. This check produced no blocking finding.

## Copy audit

Counts use whitespace-delimited words; hyphenated terms and version strings
count as one word. The landing audit is the clean, empty `/` state. Repeated
sentences are listed when they appear twice. No sentence exceeds 22 words and
no banned marketing word appears.

### Landing-page sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| Track medicine handoffs between family caregivers. | 6 | F-1-11 |
| For adult children and home caregivers who need a clear record when care changes hands. | 15 | — |
| See a filled handoff board in one click. | 8 | F-1-5 |
| Medication records stay in this browser. | 6 | — |
| The board works offline after your first visit. | 8 | — |
| Printing, QR handoffs, and exports are free. | 7 | — |
| Dithered illustration of a pill organizer, blank handoff card, and pencil. | 11 | — |
| Add the current list. | 4 | F-1-12 |
| Enter each medication, amount, and scheduled time. | 7 | — |
| Mark each dose. | 3 | — |
| Choose Taken, Held, or Unknown and add a note. | 9 | — |
| Hand it over. | 3 | — |
| Print the card, show a QR handoff, or export a backup. | 11 | — |
| Print the shift card, show its QR code to another caregiver, or save your own backup. | 16 | — |
| A QR handoff contains the selected date’s active regimen and dose states. | 12 | F-1-7, F-1-12 |
| It is not encrypted; use it only with someone you trust. | 11 | F-1-7 |
| Medication records stay in this browser. | 6 | — |
| Built by Param Factory · version 2026.08.28-repair.4 · Original artwork was generated for Med Handoff Card. | 14 | — |
| The app uses no analytics or third-party runtime scripts. | 9 | F-1-15 |

### Landing headings, labels, and actions

| Copy | Words | Kind | Flag |
| --- | ---: | --- | --- |
| Skip to handoff board | 4 | Skip link | — |
| Med Handoff Card | 3 | Wordmark | — |
| Board | 1 | Navigation | — |
| Demo | 1 | Navigation | — |
| Tools | 1 | Navigation | — |
| Privacy | 1 | Navigation | — |
| Night / Light | 1 | Button | F-1-14 |
| Private caregiver record | 3 | Section label | — |
| Try it with sample data | 5 | Primary link | — |
| Add your first medication | 4 | Button | — |
| How it works | 3 | Section label | — |
| Leave the next caregiver a clear record | 7 | `h2` | — |
| Handoff tools | 2 | Section label | — |
| Leave a clear record | 4 | `h2` | F-1-13 |
| Print handoff | 2 | Button | — |
| Show QR handoff | 3 | Button | — |
| Export backup | 2 | Button | — |
| Import backup | 2 | Button | — |
| Privacy | 1 | Footer link | — |
| Terms | 1 | Footer link | — |

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
| Records medication starts, changes, and stops without hiding prior dose history. | 11 | — |
| Prints up to eight ordinary medications on one A4 or Letter page. | 12 | F-1-9, F-1-23 |
| Creates a local QR handoff until you hide it or close the page. | 13 | — |
| Works offline after the first visit. | 6 | — |
| Stores the real record in IndexedDB in your browser. | 9 | F-1-16 |
| Exports JSON and CSV backups. | 5 | — |
| Encrypts an optional JSON backup locally with AES-GCM and your passphrase. | 11 | F-1-17 |
| The app uses no analytics or third-party runtime scripts. | 9 | F-1-15 |
| Use Node 20 or newer and Playwright 1.58.2. | 8 | — |
| The production output is `dist/`, with `index.html` at its root. | 10 | — |
| The browser suite covers desktop, 390 px mobile, keyboard use, axe, privacy, claims, offline reload, and service-worker updates. | 18 | F-1-8, F-1-18 |
| Run one claim with its ID. | 6 | — |
| Medication records stay in this browser unless you print, export, import, or show a QR code. | 16 | — |
| QR handoffs are not encrypted. | 5 | F-1-7 |
| Encrypted exports cannot be recovered without their passphrase. | 8 | — |
| See `/privacy` and `/terms` for the full policy. | 8 | — |
| Confirm unclear medication instructions with the prescriber or pharmacist. | 9 | — |
| This is a static PWA. | 5 | F-1-19 |
| The factory deploys `dist/` to Azure Static Web Apps with `public/staticwebapp.config.json`. | 11 | — |
| MIT. | 1 | — |
| See LICENSE. | 2 | — |

### README headings

| Heading | Words | Flag |
| --- | ---: | --- |
| Med Handoff Card | 3 | — |
| What it does | 3 | — |
| Run and verify | 3 | — |
| Data and safety | 3 | — |
| Deploy | 1 | — |
| License | 1 | — |

## Demo and sandbox

`Try it with sample data` opened `/demo` in one click. At 390×844 before any
scroll, the screen showed the persistent demo banner, `Today’s handoff`, Nora
Ellis, the filled shift note, the selected date, and the start of the actual
handoff interface. The sample contains Metformin, Lisinopril, Vitamin D3,
Taken and Held states, and realistic caregiver notes.

`Reset demo` restored the original Taken state. A real record created before
entering the demo was byte-for-byte unchanged after a demo dose edit, reset,
and `Start for real`. The live request log contained only
`https://med-handoff-card.sociobot.in` URLs. Demo localStorage was initially
empty; the code uses only `demo:mhc_theme` for an optional demo appearance
preference and never opens the real IndexedDB database in demo mode.

Result: the demo itself passes; F-1-5 and F-1-6 concern claim registration and
coverage, not observed sandbox leakage.

## Claims verification

Each exact command in `.factory/claims.json` was run separately from a clean
local clone checked out at the supplied base commit. Every command selected
exactly one tagged test and passed.

| Claim ID | Result |
| --- | --- |
| `demo-isolation` | PASS |
| `offline-reload` | PASS |
| `local-only` | PASS |
| `json-csv-export` | PASS |
| `encrypted-backup` | PASS |
| `qr-handoff` | PASS |
| `print-handoff` | PASS |
| `free-tools` | PASS |
| `current-medication-list` | PASS |
| `dose-state-notes` | PASS |
| `real-record-retention` | PASS |
| `regimen-history` | PASS |
| `stopped-history` | PASS |
| `no-future-doses` | PASS |

The full clean-clone verification also passed:

- `npm test`: 3 unit tests and 23 Chromium tests passed.
- `npm run test:type`: passed.
- `npm run lint`: passed.
- `npm run build`: passed and created `dist/`.
- Built JavaScript: 50.54 KB raw / 19.02 KB gzip.

The claim list still needs the additions or narrower wording in F-1-5 through
F-1-10. No declared claim test failed, so there is no blocking claim-test
finding.

## Live privacy, offline, accessibility, and structure checks

- Fresh live request logging across `/`, `/demo`, demo mutation, QR creation,
  reset, and return to real mode recorded only same-origin requests.
- After service-worker control was established, live `/demo` reloaded offline
  with Nora Ellis and the full sample present.
- Live Playwright axe scans on `/`, `/demo`, `/privacy`, `/terms`, and the
  designed 404 returned zero serious or critical violations at 390 px.
- The factory URL verifier passed the home route: title and language present,
  one `h1`, `main` present, no missing image alt text, no unlabeled buttons,
  and no console errors.
- The live normal routes produced no console errors and no horizontal overflow
  at 390 px. The expected HTTP 404 navigation reports a failed-resource console
  message while still rendering the designed 404 document.
- Every normal product link crawled to HTTP 200. A deliberately unknown URL
  returned HTTP 404 with the designed page and a working route home.
- `/`, `/demo`, `/privacy`, `/terms`, and 404 each have `lang="en"`, one `h1`,
  and a `main` landmark. Titles follow the requested route pattern and deep
  links load the correct content.
- Root metadata, manifest, robots, sitemap, social image, security headers,
  CSP, and favicon are present. Route metadata exceptions are F-1-2 and F-1-4.
- The dithered bedside-print palette, halftone field, serif/sans typography,
  square controls, original pill-tray image, and matching 404 are distinct and
  follow `.factory/design.md`; this is not a generic SaaS template.

## Earlier-history verification

No `.factory/review-*.md` or `.factory/polish-*.md` existed before this review.
The cumulative prior `.factory/handoff.md` listed five repair groups. Each was
checked on the live site and in code rather than accepted from its status text.

| Prior handoff item | Live and code result |
| --- | --- |
| Stop event and history after the last medication is stopped | FIXED — live add → Held note → edit → stop → reload retained the dose, note, edit, and stop event; code appends the immutable regimen change. |
| Reject future handoff dates | FIXED — live `2099-12-31` reset to today and announced “Future doses cannot be recorded”; IndexedDB guard test passed. |
| Keyboard-reachable import | FIXED — Tab from Export focused `Import backup`; Enter opened the chooser and invalid input produced the recovery message. |
| Eight-medication A4 and Letter print | FIXED for the exact fixture — live PDFs were one page for both sizes; the wording boundary remains F-1-9/F-1-23. |
| Claims for stopped history/future dates and stronger QR behavior | FIXED — all tagged tests passed; live Hide QR and reload each removed the QR. |

The handoff’s retained demo isolation, local storage, offline reload, update,
export, encryption, QR, theme, and accessibility assertions also passed the
clean full suite. No prior finding needs to be reopened under an earlier ID.

## Missed leverage

An AI feature is not justified here: medication handoff is safety-sensitive,
the local/offline workflow already performs the core job, and decorative model
output would add privacy and accuracy risk. Import/export and a local QR
handoff already exist; sync would contradict the current no-account,
browser-local contract unless the scope changes.

The obvious missing capability is direct deletion of the sensitive local
record. That concrete gap is F-1-10. It should be implemented without AI or a
backend.

## What would make this perfect

Resolve F-1-1 through F-1-23, add the missing/narrowed claim coverage, rerun
every claim from a clean checkout, and repeat the cold live mobile/desktop
review. Beyond those recorded findings, this review identified no additional
feature, accessibility, visual-identity, privacy, offline, or core-workflow
gap.
