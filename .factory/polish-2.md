# Polish round 2 — finding closure

Release candidate `4a3a60a7319a926125825b419a0fec9358b9c4ab` was repaired from review commit `7d980a4debf66ecb0f509c65cf1031a2483ed429`. The implementation commit is `159a86e9a3cf8a6e7aefb06cfaa7d8f4f686877e`.

Every finding in `.factory/review-1.md` and `.factory/review-2.md` was checked against the source, a clean clone, and the deployed site. The first review's 23 repairs remain intact. The three review-2 findings are now fixed. No finding remains open.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Internal History API routes focus and announce the new `h1`; Back and Forward restore heading focus. | `real routes update metadata, share chrome, announce navigation, and restore heading focus`; `live/live-check.json` → `routes.privacy.focused`, `backFocused`, `forwardFocused`; live `/privacy`. |
| F-1-2 | Every route has its own title, description, canonical, OG/Twitter data, icons, and robots policy. | `static response policy declares CSP, immutable assets, manifest MIME, and a 404`; route test above; `live/live-check.json` route matrix; live `/demo`, `/privacy`, `/terms`, and a missing URL. |
| F-1-3 | Home, Demo, Privacy, Terms, and 404 use the same masthead, navigation, view control, footer, legal links, provenance, and build ID. | Route test; `live/live-check.json` route `nav`, `footer`, and `theme`; `live/not-found-desktop.png`. |
| F-1-4 | Every page links the dedicated 180 px PNG touch icon. | Static response test; `live/live-check.json` route `apple` values; live `/icons/apple-touch-icon.png`. |
| F-1-5 | The first-screen action opens the filled `?demo=1` sample in one click. | `@claim:demo-entry`; `live/live-check.json` → `cold.action` and `demo.entry`; `live/home-mobile.png`, `live/demo-mobile.png`; live `/?demo=1`. |
| F-1-6 | The banner makes the tested boundary specific: demo dose changes do not change the real record. | `@claim:demo-isolation`; `live/live-check.json` → `demo.realRecordAfterEdit=null` and blank `realAfterExit`; live `/?demo=1`. |
| F-1-7 | QR copy promises the selected date, full current medication list, and dose states in readable data, and the QR test decodes all of them. | `@claim:qr-contents`; `@claim:qr-handoff`; `live/live-check.json` → `demo.qr`. |
| F-1-8 | README points to the exact claim and quality test files instead of making a broad coverage assurance. | README source review; clean-clone `full-suite.log` records all 29 named tests. |
| F-1-9 | The print boundary names the included eight-medication fixture. | `@claim:print-handoff` passes for one-page A4 and Letter output; individual clean-clone claim log. |
| F-1-10 | Privacy includes a confirmed **Delete this record** action that erases the real record and leaves demo data separate. | `@claim:delete-record`; `live/live-check.json` → `privacy.deletion`; `live/privacy-desktop.png`; live `/privacy`. |
| F-1-11 | The headline consistently uses “medication.” | `@claim:demo-entry`; `live/live-check.json` → `cold.headline`; `live/home-mobile.png`. |
| F-1-12 | User-facing copy consistently calls the saved set the “current medication list.” | `@claim:current-medication-list`; `@claim:regimen-history`; `.factory/copy-audit.md`. |
| F-1-13 | The tools heading names its actions: “Print, share, or back up the handoff.” | New how-to copy test also confirms the matching action language; `live/home-mobile.png`. |
| F-1-14 | The appearance control names the result: **Use night view** or **Use light view**. | `dark mode has no serious axe findings`; route test; `live/live-check.json` → route `theme` and accessibility results. |
| F-1-15 | Privacy copy says the app loads no analytics or code from other sites. | `@claim:local-only`; `live/live-check.json` → empty `externalRequests`. |
| F-1-16 | Reader-facing storage copy says “this browser’s local database.” | `@claim:real-record-retention`; README and `.factory/copy-audit.md` source review. |
| F-1-17 | Reader-facing backup copy explains that its passphrase is required to open it. | `@claim:encrypted-backup`; README and `.factory/copy-audit.md` source review. |
| F-1-18 | README no longer uses test-tool or service-worker jargon in a coverage claim. | README source review; clean-clone `full-suite.log` supplies exact assertions instead. |
| F-1-19 | README spells out “static progressive web app.” | README source review; clean-clone `build.log`. |
| F-1-20 | Privacy uses the direct `h1` “Privacy.” | Route test; `live/live-check.json` → `routes.privacy`; `live/privacy-desktop.png`; live `/privacy`. |
| F-1-21 | Terms uses the direct `h1` “Terms of use.” | Route test; `live/live-check.json` → `routes.terms`; live `/terms`. |
| F-1-22 | The missing-page heading is “Page not found.” and the server returns HTTP 404. | Route and static response tests; `live/live-check.json` → `routes.notFound`; `live/not-found-desktop.png`; live missing URL. |
| F-1-23 | “Ordinary medications” was removed; the exact eight-item fixture defines the print promise. | `@claim:print-handoff`; `.factory/claims.json`; README source review. |
| F-2-1 | Replaced “Hand it over.” with “Print, share, or back up the handoff.” and added a concrete use for print, QR, and backup. | `how-to heading and third step name the caregiver actions`; `live/live-check.json` → `cold.thirdStep`; `live/home-mobile.png`; live home. |
| F-2-2 | The semantic `h2` now says “Create a medication handoff in three steps.” | Same copy regression test; `live/live-check.json` → `cold.howHeading`; `live/home-mobile.png`; live home. |
| F-2-3 | Deleted the README Technical notes section and its reader-facing IndexedDB/AES-GCM/key-derivation jargon. | README source search; `.factory/copy-audit.md` README check; exact encryption behavior remains covered by `@claim:encrypted-backup`. |

## Verification

- Clean clone of implementation commit: `npm ci`, all 17 `.factory/claims.json` commands individually, `npm run test:type`, `npm run lint`, `npm run build`, and `npm test` passed. Evidence is under `.factory/qa-evidence/polish-2/clean-clone/`.
- Full suite: 3 unit tests and 29 Chromium tests passed. This includes all 17 claim tests and the new F-2-1/F-2-2 regression test.
- Build: 54.18 KB JavaScript raw / 20.00 KB gzip; 14.63 KB CSS raw / 4.13 KB gzip; 170.45 KB hero image.
- Local URL verifier: HTTP 200, no console errors, one `h1`, `lang=en`, `main`, complete alt text, and named buttons. Local Lighthouse: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.1 s, TBT 0 ms, CLS 0.
- Deployment `033035e8-e751-4936-a751-cc6a6369303e` succeeded at <https://med-handoff-card.sociobot.in>.
- Cold live audit: no console errors, no external requests, zero serious/critical axe findings in both themes, 390 px layout at 200% text with no overflow, 44 px minimum target, complete isolated demo/reset/exit, QR decode, record deletion, offline reload, route metadata/focus, and real 404 all passed. Evidence: `live/live-check.json` and `live/*.png`.
- Live link crawl: all 11 internal links and hash destinations returned HTTP 200. Evidence: `live/link-check.json`.
- Live URL verifier passed. Live Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.8 s, TBT 0 ms, CLS 0.
- The live index, hashed JavaScript, CSS, service worker, and manifest SHA-256 values match `dist/`. Evidence: `live/http-identity.json`.

No functional, copy, visual, accessibility, privacy, offline, metadata, routing, demo, or claim finding remains.
