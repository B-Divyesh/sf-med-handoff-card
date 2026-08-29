# Adversarial first-read review 6 — Med Handoff Card

**Verdict: PASS**

Reviewed 2026-08-29 UTC against <https://med-handoff-card.sociobot.in> and a
fresh clone of commit 5a3ad768b1f0bfc618a8e0cd18b23a4aa13cc7a4. No finding
remains. This review did not modify product code.

## Cold first read

Fresh no-storage Chromium contexts at 390 × 844 and 1280 × 900 opened the home
page before scrolling. Both answered the mandatory questions:

| Question | Exact answer visible |
| --- | --- |
| What does this do? | “Track medication handoffs between family caregivers.” |
| For whom? | “For adult children and home caregivers who need a clear record when another caregiver takes over.” |
| What should I click first? | **Try it with sample data** — “Open a filled sample handoff in one click.” |

The first screen names the job and audience and gives a result-naming sample
action. This is not a blocking finding.

## Copy audit

Counts are whitespace-delimited. The landing list is the empty real-board state
and includes meaningful image alt text and the repeated footer. Every sentence
is no more than 22 words. No jargon, marketing adjective, inconsistent term,
context-free/mood heading, or non-result-naming action was found. The generated
.factory/copy-audit.md independently checks the source inventory and drift.

### Landing-page sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| Track medication handoffs between family caregivers. | 6 | — |
| For adult children and home caregivers who need a clear record when another caregiver takes over. | 16 | — |
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
| Print for the next caregiver, show the QR code in person, or save a backup for yourself. | 17 | — |
| Print the handoff, show its QR code to another caregiver, or save your own backup. | 15 | — |
| A QR handoff contains the selected date, current medication list, and dose states. | 13 | — |
| Anyone who scans it can read it, so share it only with someone you trust. | 15 | — |
| Track medication handoffs between family caregivers. | 6 | — |
| The app loads no analytics or code from other sites. | 10 | — |

The h1 is the job headline. “Create a medication handoff in three steps” and
“Print, share, or back up the handoff” are self-contained section headings.
“Private caregiver record,” “How it works,” and “Handoff tools” are useful
section labels. **Try it with sample data**, **Add your first medication**,
**Print handoff**, **Show QR handoff**, **Export backup**, **Import backup**,
and **Use night view** name each action's result.

### README sentences

| Sentence | Words | Flag |
| --- | ---: | --- |
| Track scheduled doses and leave a clear medication handoff for the next family caregiver. | 14 | — |
| The app records each dose as Taken, Held, or Unknown. | 10 | — |
| It is a caregiver record, not medical advice. | 8 | — |
| Try it with sample data. | 5 | — |
| Demo actions never change your real record. | 7 | — |
| Keeps a current medication list with amounts, directions, and times. | 10 | — |
| Records Taken, Held, or Unknown with an optional caregiver note. | 10 | — |
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
| The production output is \`dist/\`, with \`index.html\` at its root. | 10 | — |
| Run \`npm test\` to run the browser suite. | 8 | — |
| See the claim tests and quality tests for exact assertions. | 10 | — |
| Run one claim with its ID. | 6 | — |
| Medication records stay in this browser unless you print, export, import, or show a QR code. | 16 | — |
| Anyone who scans a QR handoff can read it. | 9 | — |
| Encrypted backups cannot be recovered without their passphrase. | 8 | — |
| Use Delete this record on the Privacy page to erase the local medication record. | 14 | — |
| See Privacy and Terms for the full policy. | 8 | — |
| Confirm unclear medication instructions with the prescriber or pharmacist. | 9 | — |
| This is a static progressive web app. | 7 | — |
| The factory deploys \`dist/\` to Azure Static Web Apps with \`public/staticwebapp.config.json\`. | 11 | — |
| MIT. | 1 | — |
| See LICENSE. | 2 | — |

The terminology table is consistent: **medication**, **current medication
list**, **dose**, **handoff**, **backup**, and **demo** each retain one meaning.

## Demo and sandbox

One click on **Try it with sample data** opened ?demo=1. Its first screen already
showed Nora Ellis, a realistic handoff note, three medications, and Taken and
Held states. The persistent banner says “Demo — sample data, nothing is saved
to your real record,” adds “Demo actions never change your real record,” and
includes **Reset demo** and **Start for real**. The direct /demo route showed
the same populated sample.

The demo-isolation claim changes the recipient, note, medication list, all
three states, import, theme, reset, and exit; it compares real IndexedDB bytes
before and after and permits only a demo: preference. The offline claim reloads
the populated demo after service-worker control while offline. Request logging
over the demo flow contained only the product origin.

## Claims verification

From fresh clone /tmp/mhc-review6-clone-8kKXTw, I ran npm ci and every exact
command in .factory/claims.json separately. All passed. No landing or README
behavior claim is unlisted: demo, privacy/local-only, offline, export,
encryption, QR, print, retention/history, state, date, and deletion copy each
maps to a declared test.

| Claim ID | Result |
| --- | --- |
| demo-entry | PASS |
| demo-isolation | PASS |
| offline-reload | PASS |
| local-only | PASS |
| json-csv-export | PASS |
| encrypted-backup | PASS |
| qr-handoff | PASS |
| qr-contents | PASS |
| print-handoff | PASS |
| free-tools | PASS |
| current-medication-list | PASS |
| dose-state-notes | PASS |
| real-record-retention | PASS |
| regimen-history | PASS |
| stopped-history | PASS |
| no-future-doses | PASS |
| delete-record | PASS |

The clone also passed npm test (3 unit tests and 33 Chromium tests), npm run
test:type, npm run lint, and npm run build. dist/ was produced; application
JavaScript was 54.17 kB raw / 19.99 kB gzip and CSS was 14.63 kB raw / 4.13 kB
gzip.

## History and regression audit

Every earlier finding was checked on the live site and in current source/tests,
not merely accepted from its closure note.

| Earlier finding | Current confirmation |
| --- | --- |
| F-1-1 | Navigation, Back, and Forward focus and announce the destination h1. |
| F-1-2 | All routes have their own title, description, canonical, OG/Twitter data, favicon, and touch icon. |
| F-1-3 | Shared header, navigation, appearance control, and footer render on every route. |
| F-1-4 | Every route links the self-hosted 180 px touch PNG. |
| F-1-5 | demo-entry begins at home, clicks once, and verifies the filled sample. |
| F-1-6 | demo-isolation covers all listed data-changing actions and real-record bytes. |
| F-1-7 | qr-contents decodes and compares date, full current list, and states. |
| F-1-8 | README gives exact test-file links rather than a coverage assurance. |
| F-1-9 | Print wording is limited to its included eight-medication fixture. |
| F-1-10 | Privacy has confirmed in-product deletion; the demo remains separate. |
| F-1-11 | Public copy and placeholders use “medication,” not “medicine.” |
| F-1-12 | The active set is “current medication list”; history and QR avoid “regimen.” |
| F-1-13 | The tools heading names print, share, and backup. |
| F-1-14 | Appearance controls say “Use night view” or “Use light view.” |
| F-1-15 | Plain no-analytics wording and same-origin request behavior remain. |
| F-1-16 | Reader-facing storage wording is “this browser’s local database.” |
| F-1-17 | Backup copy leads with its required passphrase outcome. |
| F-1-18 | README has no test-tool or service-worker jargon in public assurances. |
| F-1-19 | README spells out “static progressive web app.” |
| F-1-20 | Privacy has the direct h1 “Privacy.” |
| F-1-21 | Terms has the direct h1 “Terms of use.” |
| F-1-22 | Missing routes return the designed HTTP 404 with “Page not found.” |
| F-1-23 | The undefined “ordinary medications” wording is absent. |
| F-2-1 | Step three says “Print, share, or back up the handoff.” |
| F-2-2 | The semantic how-to heading names the three-step task. |
| F-2-3 | README has no reader-facing IndexedDB, AES-GCM, or key-derivation jargon. |
| F-3-1 | Artwork provenance is retained in design.md, not public claim copy. |
| F-4-1 | Demo Bedtime says “No doses are scheduled at this time.” |
| F-4-2 | Every route uses the self-hosted 1200 × 630 PNG social card. |
| F-5-1 | “Stop” is now the non-clinical “Remove from current list.” |
| F-5-2 | The audience says “when another caregiver takes over,” not “care changes hands.” |
| F-5-3 | The transfer artifact is consistently a “handoff,” not a “shift card.” |
| F-5-4 | One claim saves/reloads Taken, Held, and Unknown with optional notes. |
| F-5-5 | The generated audit checks source inventory, counts, banned words, and drift. |

## Structure, privacy, accessibility, and visual identity

The live crawl returned 200 for home, demo, privacy, and terms; an unknown
route returned designed HTTP 404. Every internal link and anchor resolved.
Checked routes have one h1, lang=en, main, a title matching the required
pattern, description, canonical, OG/Twitter metadata, self-hosted PNG social
card, favicon, and touch icon. robots.txt, sitemap.xml, social card, and touch
icon return 200. Live CSP is an HTTP header with connect-src 'self' and
frame-ancestors 'none'.

The fresh live audit found no console errors, no off-origin requests, no 390 px
horizontal overflow, zero serious/critical axe violations in light and night
view, and an offline demo reload. The browser suite also passed keyboard focus,
validation announcement, import activation, touch targets, 200% text, and
service-worker update checks. The dithered paper, cobalt/marigold ink palette,
Georgia/system-sans pairing, square-rule controls, and pill-tray illustration
match .factory/design.md and do not resemble a generic SaaS template.

## Missed leverage

No AI feature is missing: this privacy-sensitive offline caregiver record is
better served by manual, visible entries. Brief-implied portability is already
present through print, readable QR, import, export, encrypted backup, and
offline use. There is no embedded provider key or decorative AI claim.

## What would make this perfect

Nothing actionable was found. Preserve the current isolated sample, exact
claim tests, local-first behavior, and plain-language copy in future changes.
