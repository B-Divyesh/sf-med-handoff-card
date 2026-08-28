# Adversarial first-read review 2 — Med Handoff Card

**Verdict: FAIL**

Reviewed 2026-08-28 UTC against the deployed site at
<https://med-handoff-card.sociobot.in> and repository commit
`4a3a60a7319a926125825b419a0fec9358b9c4ab`.

The product is clear and usable on first read, its sample demo is genuinely
isolated, and all declared claims passed. This review still fails because the
acceptance rule requires zero findings. Three minor copy findings remain.
No product code was changed.

## Findings

### F-2-1 — MINOR — The third handoff step is a vague instruction

- **Location / quote:** Landing page, How it works, step 3: “Hand it over.”
- **Why this matters:** This does not tell a first-time caregiver what action
  to take. The useful options only appear in the following sentence. The
  standalone instruction therefore fails the plain-words requirement that
  every sentence carry usable information.
- **Concrete fix:** Replace it with **“Print, share, or back up the handoff.”**
  Then remove the duplicated following sentence or replace it with a concise
  explanation of when to use each option.

### F-2-2 — MINOR — The semantic How it works heading does not name its section

- **Location / quote:** Landing page `h2`: “Leave the next caregiver a clear
  record.” The visible “How it works” text is a non-heading eyebrow.
- **Why this matters:** A screen-reader heading list exposes the `h2`, not the
  eyebrow. The quoted benefit does not identify the three-step instructions as
  a how-to section when heard without surrounding text.
- **Concrete fix:** Change the `h2` to **“Create a medication handoff in three
  steps”**. Keep the eyebrow only if it is useful as a visual label.

### F-2-3 — MINOR — README technical notes use unexplained implementation jargon

- **Location / quote:** README, Technical notes: “The app stores real records
  in IndexedDB.” and “Optional encrypted backups use AES-GCM with a key
  derived from the supplied passphrase.”
- **Why this matters:** The README is part of the first-read copy audit.
  `IndexedDB`, `AES-GCM`, and “key derived” explain implementation rather than
  an outcome a caregiver can use. The earlier review correctly removed this
  jargon from reader-facing product copy; retaining it in a public README
  leaves the same obstacle for a reader who reaches the documentation.
- **Concrete fix:** Delete the Technical notes section; its useful facts are
  already stated plainly above. If implementation detail must remain, use
  **“The app uses this browser’s local database. Encrypted backups require the
  passphrase that created them.”**

## Cold first read

Fresh Chromium contexts were opened at 390 × 844 and 1440 × 900, with no prior
storage. Before scrolling, both showed the same clear answer:

| Question | Answer from the first screen |
| --- | --- |
| What does it do? | It tracks medication handoffs and scheduled dose states. |
| For whom? | Adult children and home caregivers handing care between family members. |
| What should I click first? | **Try it with sample data** to open a filled handoff. |

The exact first-screen text was:

> Track medication handoffs between family caregivers.
>
> For adult children and home caregivers who need a clear record when care
> changes hands.
>
> Try it with sample data — Open a filled sample handoff in one click.

This is a clear headline (six words), audience sentence (15 words), and
result-naming first action. This check is not blocking.

## Copy audit

Counts use whitespace-delimited words. The landing audit is the initial empty
board at `/`; repeated footer copy is included. No audited sentence exceeds 22
words. F-2-1 and F-2-3 are the copy flags above.

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
| Hand it over. | 3 | F-2-1 |
| Print the card, show a QR handoff, or export a backup. | 11 | — |
| Print the shift card, show its QR code to another caregiver, or save your own backup. | 16 | — |
| A QR handoff contains the selected date, current medication list, and dose states. | 13 | — |
| Anyone who scans it can read it, so share it only with someone you trust. | 15 | — |
| Track medication handoffs between family caregivers. | 6 | — |
| Original artwork was generated for Med Handoff Card. | 8 | — |
| The app loads no analytics or code from other sites. | 10 | — |

### Landing headings and actions

| Copy | Kind | Result |
| --- | --- | --- |
| Private caregiver record | section label | Clear |
| Track medication handoffs between family caregivers. | `h1` | Clear job headline |
| Try it with sample data | primary action | Result-naming verb phrase |
| Add your first medication | real-data action | Result-naming verb phrase |
| Leave the next caregiver a clear record | `h2` | F-2-2 |
| Print, share, or back up the handoff | `h2` | Clear section name |
| Print handoff / Show QR handoff / Export backup / Import backup | buttons | Result-naming verbs |

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
| Use Node 20 or newer and Playwright 1.58.2. | 8 | — |
| The production output is `dist/`, with `index.html` at its root. | 10 | — |
| Run `npm test` to run the browser suite. | 8 | — |
| See the claim tests and quality tests for exact assertions. | 10 | — |
| Run one claim with its ID. | 6 | — |
| Medication records stay in this browser unless you print, export, import, or show a QR code. | 16 | — |
| Anyone who scans a QR handoff can read it. | 9 | — |
| Encrypted backups cannot be recovered without their passphrase. | 8 | — |
| Use Delete this record on the Privacy page to erase the local medication record. | 14 | — |
| See Privacy and Terms for the full policy. | 8 | — |
| Confirm unclear medication instructions with the prescriber or pharmacist. | 9 | — |
| The app stores real records in IndexedDB. | 7 | F-2-3 |
| Optional encrypted backups use AES-GCM with a key derived from the supplied passphrase. | 13 | F-2-3 |
| This is a static progressive web app. | 7 | — |
| The factory deploys `dist/` to Azure Static Web Apps with `public/staticwebapp.config.json`. | 11 | — |
| MIT. | 1 | — |
| See LICENSE. | 2 | — |

Terminology is otherwise consistent: **medication**, **current medication
list**, **dose**, **handoff**, and **backup** are used for their respective
concepts. No marketing adjectives or generic-SaaS language was found.

## Demo and sandbox verification

- Clicking **Try it with sample data** once opened `/?demo=1` and immediately
  showed Nora Ellis, the shift note, three medications, Taken and Held states,
  the sticky demo banner, **Reset demo**, and **Start for real**.
- In a fresh live browser context, I changed the care recipient, shift note,
  and medication list. `indexedDB.databases()` remained empty in demo mode.
  Reset restored Nora Ellis and the original note, and Start for real opened a
  blank real board without the demo medication.
- Live request logging throughout this flow observed only
  `https://med-handoff-card.sociobot.in`; no third-party request, analytics,
  account endpoint, or provider key was observed.
- The live demo reloaded with its sample after service-worker control while the
  browser was offline. No claim or demo failure was found.

## Claim verification

`.factory/claims.json` lists 17 claims. I cloned the current repository to a
new temporary directory, ran `npm ci`, and ran every listed `test` command
individually. All 17 passed. A subsequent `npm test` passed all 3 unit tests
and all 28 Chromium tests, including every `@claim:` test; `npm run build`
also completed successfully.

The claim-like public copy maps to declared claims: offline behavior,
local-only storage/no analytics, demo isolation, QR contents, backups,
printing, free tools, retention, history, date bounds, and deletion each have
a manifest entry. No unlisted product claim was found.

## Structure, routes, accessibility, and visual review

- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `robots.txt`, and
  `sitemap.xml` returned 200. A nonexistent route returned the designed 404
  with HTTP 404.
- Each checked route had route-specific title, description, canonical URL,
  Open Graph/Twitter fields, favicon, 180 px touch icon, one `h1`, and `main`.
  Internal navigation updated title, moved focus to the new `h1`, announced
  the route, and Back/Forward restored focus.
- Header and footer content was consistent across the checked routes. The
  crawler-visible internal links resolved, with hash links staying in-page.
- Live mobile and desktop `/demo` had no console errors and axe reported zero
  serious or critical violations. At 390 px there was no horizontal overflow.
- The paper, cobalt, marigold, halftone, square-rule, and printed shift-sheet
  system matches `.factory/design.md` and is visibly distinct from a generic
  SaaS template. The original tray illustration is decorative and has useful
  alt text.
- The live CSP is a response header, includes `frame-ancestors 'none'`, and
  matched the observed same-origin resource requests.

The missing `.factory/brief.json` was noted; the contract says to read it only
if present. The available design, demo, claim, prior-review, polish, and
handoff documents were read.

## Earlier-finding regression check

Every earlier review finding was checked against live behavior and source, not
only against its closure note.

| Earlier finding | Verification result |
| --- | --- |
| F-1-1 | Fixed: SPA routing focuses and announces the destination `h1`; Back/Forward restore it. |
| F-1-2 | Fixed: all checked routes have route-specific metadata and icons. |
| F-1-3 | Fixed: shared header, footer, tools link, and view control render on legal and 404 routes. |
| F-1-4 | Fixed: all checked routes reference `/icons/apple-touch-icon.png`. |
| F-1-5 | Fixed: `demo-entry` is declared and passes from a cold landing click. |
| F-1-6 | Fixed: banner now makes the tested dose-change boundary explicit. |
| F-1-7 | Fixed: `qr-contents` is declared and decodes the complete readable payload. |
| F-1-8 | Fixed: README now points to named claim and quality test files. |
| F-1-9 | Fixed: print wording names the included eight-medication fixture. |
| F-1-10 | Fixed: Privacy has confirmed in-app deletion and `delete-record` passes. |
| F-1-11 | Fixed: landing uses “medication,” not “medicine.” |
| F-1-12 | Fixed: “current medication list” is the consistent saved-list term. |
| F-1-13 | Fixed: tools `h2` names print/share/backup actions. |
| F-1-14 | Fixed: the view control says “Use night view” or “Use light view.” |
| F-1-15 | Fixed: privacy copy says “no analytics or code from other sites.” |
| F-1-16 | Fixed in reader-facing copy: it now says “local database”; the remaining technical-note wording is separately recorded as F-2-3. |
| F-1-17 | Fixed in reader-facing copy: the result is described in passphrase language; the remaining technical-note wording is separately recorded as F-2-3. |
| F-1-18 | Fixed: README no longer makes the broad jargon-heavy browser-suite assurance. |
| F-1-19 | Fixed: README expands progressive web app. |
| F-1-20 | Fixed: Privacy `h1` is “Privacy.” |
| F-1-21 | Fixed: Terms `h1` is “Terms of use.” |
| F-1-22 | Fixed: 404 `h1` is “Page not found.” |
| F-1-23 | Fixed: the bounded print promise names the exact fixture rather than “ordinary medications.” |

## Missed leverage

No missing AI feature was found. The product's main job is an offline,
private, manual medication handoff; an AI step would add data sharing and is
not implied by the available product brief material. Import, export, QR, and
print handoffs already cover the evident portability needs.

## What would make this perfect

Resolve F-2-1 through F-2-3, then repeat this complete cold-read and
clean-clone claim audit. No functional, demo, privacy, routing, accessibility,
or visual-system changes are otherwise indicated by this review.
