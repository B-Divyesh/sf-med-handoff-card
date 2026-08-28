# Adversarial first-read review 3 — Med Handoff Card

**Verdict: FAIL**

Reviewed 2026-08-28 UTC against the live site at
<https://med-handoff-card.sociobot.in> and repository commit
`15a96674c0cbe6ad6f137ba124a54fa252b3913c`.

The core first-read, demo, claim-test, privacy, accessibility, route, and
visual checks pass. This review still fails because the acceptance rule is zero
findings: one visitor-facing provenance assertion is an unlisted claim. No
product code was modified.

## Findings

### F-3-1 — MINOR — Public artwork-provenance assertion has no claim entry

- **Location / quote:** Landing-page footer: “Original artwork was generated
  for Med Handoff Card.”
- **Why this matters:** This is a factual assertion a visitor can rely on, but
  `.factory/claims.json` has no entry or observable test for it. The claims
  contract requires every claim-like public sentence to be declared and tested,
  or removed when it cannot be tested in the sandbox.
- **Concrete fix:** Remove this sentence from visitor-facing footer copy and
  retain provenance in `.factory/design.md`, where the asset, prompt sidecar,
  generation date, and source are already recorded. Do not replace it with
  another untestable provenance claim.

## Cold first read

Fresh Chromium contexts, with no prior storage, opened the live home page at
390 × 844 and 1440 × 900 before scrolling. Both screens answered all three
questions:

| Question | Answer from the first screen |
| --- | --- |
| What does this do? | It tracks medication handoffs between family caregivers. |
| For whom? | Adult children and home caregivers when care changes hands. |
| What should I click first? | **Try it with sample data** to open a filled handoff in one click. |

Exact first-screen copy:

> Track medication handoffs between family caregivers.
>
> For adult children and home caregivers who need a clear record when care
> changes hands.
>
> Try it with sample data — Open a filled sample handoff in one click.

This is clear on the phone and desktop. There is no first-screen blocking
finding.

## Copy audit

Counts use whitespace-delimited words. The landing audit is the empty `/`
state and includes its repeated footer text and the meaningful image alt text.
No sentence exceeds 22 words, uses a banned marketing adjective, or uses an
inconsistent term. F-3-1 is the one claim-registry flag.

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
| Original artwork was generated for Med Handoff Card. | 8 | F-3-1 |
| The app loads no analytics or code from other sites. | 10 | — |

### Landing headings and actions

The `h1`, “Track medication handoffs between family caregivers.”, names the
job in six words. The remaining section headings name their sections:
“Create a medication handoff in three steps” and “Print, share, or back up the
handoff.” The visible buttons name outcomes: “Try it with sample data,” “Add
your first medication,” “Print handoff,” “Show QR handoff,” “Export backup,”
“Import backup,” and “Use night view.” “Private caregiver record,” “How it
works,” and “Handoff tools” are direct section labels, not mood slogans.

Terminology is consistent: **medication**, **current medication list**,
**dose**, **handoff**, **backup**, **care recipient**, and **demo** each retain
one meaning.

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

README claims map to the declared behaviors below. The reader-facing README
does not use unexplained storage or encryption jargon.

## Demo and sandbox verification

- One tap on **Try it with sample data** opened `/?demo=1`.
- The first demo screen already showed Nora Ellis, her realistic shift note,
  Metformin, Lisinopril, Vitamin D3, Taken and Held states, and the real
  product board.
- The persistent banner reads “Demo — sample data, nothing is saved to your
  real record,” includes **Reset demo** and **Start for real**, and narrows its
  tested promise to dose changes.
- A demo dose edit followed by **Reset demo** restored the original Taken
  sample state. Starting for real from a fresh context showed the blank real
  board; code confirms demo data remains in memory and does not call the real
  IndexedDB save path.
- Live request logging through demo, dose change, reset, and exit observed only
  `https://med-handoff-card.sociobot.in`. The offline claim test reloads the
  seeded demo after service-worker control with the browser offline.

The demo is a real, one-click, isolated sample rather than an empty shell.

## Claim verification

I cloned the repository into `/tmp/med-handoff-card-review-3`, ran `npm ci`,
then ran every exact `test` command listed in `.factory/claims.json`
individually. Each command selected one tagged test and passed. The subsequent
full suite also passed all 3 unit tests and 29 browser tests; type-check, lint,
and production build passed, with `dist/` produced.

| Claim ID | Result |
| --- | --- |
| `demo-entry` | PASS |
| `demo-isolation` | PASS |
| `offline-reload` | PASS |
| `local-only` | PASS |
| `json-csv-export` | PASS |
| `encrypted-backup` | PASS |
| `qr-handoff` | PASS |
| `qr-contents` | PASS |
| `print-handoff` | PASS |
| `free-tools` | PASS |
| `current-medication-list` | PASS |
| `dose-state-notes` | PASS |
| `real-record-retention` | PASS |
| `regimen-history` | PASS |
| `stopped-history` | PASS |
| `no-future-doses` | PASS |
| `delete-record` | PASS |

All behavioral landing and README promises map to these tests: demo entry and
isolation, offline reload, same-origin/local storage, free tools, backup,
encrypted backup, printable fixture, readable QR, record retention/history,
date validation, and deletion. F-3-1 is the remaining exception.

## Structure, routing, privacy, accessibility, and visual review

- `/`, `/demo`, `/privacy`, and `/terms` returned 200. An unknown route
  returned the designed `Page not found.` page with HTTP 404.
- Every checked route has one `h1`, `lang="en"`, `main`, a route-specific
  title, description, canonical URL, Open Graph/Twitter fields, SVG favicon,
  and 180 px apple-touch icon. Titles use the required product/route pattern.
- Internal navigation changes the title, moves focus to the new `h1`, updates
  the polite route announcement, and preserves this behavior on Back.
- Header and footer are identical across checked routes. The live internal-link
  crawl found only working links and in-page anchors.
- Live axe checks found zero serious or critical violations on demo at 390 px
  and desktop in light and night view. Initial live loads logged no console
  errors and no external requests.
- The live response CSP is a header and includes `frame-ancestors 'none'`;
  same-origin-only request logging matches `connect-src 'self'`.
- The dithered paper grid, cobalt/marigold print palette, Georgia/sans pairing,
  square-rule controls, and original pill-tray illustration match
  `.factory/design.md` and are visibly distinct from a generic SaaS template.

## Earlier-finding regression check

Every earlier review finding was checked against the current live site and
source rather than accepted from its closure note.

| Earlier finding | Current verification |
| --- | --- |
| F-1-1 | Fixed: History navigation focuses and announces the destination `h1`; Back restores focus. |
| F-1-2 | Fixed: all checked routes have route-specific metadata and icons. |
| F-1-3 | Fixed: shared header, footer, Tools link, and view control render on all checked routes. |
| F-1-4 | Fixed: every checked route links `/icons/apple-touch-icon.png`. |
| F-1-5 | Fixed: `demo-entry` starts at `/`, clicks once, and passes. |
| F-1-6 | Fixed: the banner makes the tested dose-change boundary explicit. |
| F-1-7 | Fixed: `qr-contents` decodes and compares the full readable handoff. |
| F-1-8 | Fixed: README points to named test files without a broad coverage assertion. |
| F-1-9 | Fixed: the print promise names the included eight-medication fixture. |
| F-1-10 | Fixed: Privacy has confirmed in-app deletion and `delete-record` passes. |
| F-1-11 | Fixed: landing copy consistently says “medication.” |
| F-1-12 | Fixed: saved medications are consistently the “current medication list.” |
| F-1-13 | Fixed: the tools heading names print, share, and backup actions. |
| F-1-14 | Fixed: the control visibly says “Use night view” or “Use light view.” |
| F-1-15 | Fixed: privacy copy says “no analytics or code from other sites.” |
| F-1-16 | Fixed: reader-facing storage copy says “this browser’s local database.” |
| F-1-17 | Fixed: reader-facing backup copy explains the passphrase outcome. |
| F-1-18 | Fixed: README no longer makes tool-jargon coverage claims. |
| F-1-19 | Fixed: README expands “progressive web app.” |
| F-1-20 | Fixed: Privacy uses the direct `h1` “Privacy.” |
| F-1-21 | Fixed: Terms uses the direct `h1` “Terms of use.” |
| F-1-22 | Fixed: the 404 uses the direct `h1` “Page not found.” |
| F-1-23 | Fixed: the vague “ordinary medications” boundary is absent. |
| F-2-1 | Fixed: step three states “Print, share, or back up the handoff.” |
| F-2-2 | Fixed: the semantic how-to heading names the three-step task. |
| F-2-3 | Fixed: README technical notes with IndexedDB/AES-GCM/key-derivation jargon are absent. |

## Missed leverage

No missing AI feature was found. This is a privacy-sensitive, offline manual
caregiver record; an AI step would not be an obvious or safe completion of its
core job. Import, export, QR handoff, and print already cover the expected
portable handoff paths. No provider key or decorative AI feature is present.

## What would make this perfect

Remove the untestable public artwork-provenance sentence identified in F-3-1,
then repeat this cold-read and clean-clone claim audit. No other functional,
demo, copy, privacy, offline, accessibility, routing, metadata, or visual
finding was confirmed in this round.
