# Polish round 4 — cumulative finding closure

Release candidate `6f23f3639da58feee13aa04ba6f64def53bca8b3` was reviewed at
`5d5616764f85727376df15408b7ba440419543f5`. The repair is
`23e888e0be60606401aa7cdff87bb391071fd612`, deployed as
`095c3bcb-a2f5-477d-93b8-233f587c8267`.

Every finding in reviews 1–4 was checked again. The pre-existing repairs remain
covered by the clean-clone claims and quality suite; F-4-1 and F-4-2 are fixed
in this repair. No finding remains open.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | History navigation still focuses and announces each destination heading; Back restores focus. | `real routes update metadata, share chrome, announce navigation, and restore heading focus`; `live/live-check.json` (`privacyFocus`, `backFocus`). |
| F-1-2 | Each page retains its route-specific title, description, canonical, social metadata, icon, and robots rule. | `static response policy declares CSP, immutable assets, manifest MIME, and a 404`; live route matrix in `live/live-check.json`. |
| F-1-3 | Shared masthead, four navigation links, view control, footer, and legal links remain on app, legal, demo, and 404 pages. | Route quality test; `live/verify-url/{home,demo,privacy,terms}/verify.json`. |
| F-1-4 | The dedicated 180 px PNG touch icon remains linked by all static page entries. | `static response policy declares CSP, immutable assets, manifest MIME, and a 404`; clean-clone `full-suite.log`. |
| F-1-5 | The first-screen action still opens the filled `?demo=1` sample in one click. | `claim-demo-entry.log`; live `home-cold-desktop.png` and `live-check.json` (`oneClickDemo`). |
| F-1-6 | The persistent banner still limits the isolation promise to demo dose changes and offers reset/exit. | `claim-demo-isolation.log`; live `live-check.json` (`banner`, `reset`, `startForReal`). |
| F-1-7 | QR data remains readable and contains the selected date, full current medication list, and dose states. | `claim-qr-handoff.log`, `claim-qr-contents.log`. |
| F-1-8 | README continues to point readers to the named claim and quality tests rather than make an unbounded coverage assertion. | `README.md`; clean-clone `full-suite.log`. |
| F-1-9 | The print promise remains limited to the included eight-medication fixture. | `claim-print-handoff.log`; clean-clone suite verifies A4 and Letter one-page output. |
| F-1-10 | Privacy still has confirmed real-record deletion without affecting demo data. | `claim-delete-record.log`; live demo reset/exit result in `live-check.json`. |
| F-1-11 | The public job statement consistently says “medication.” | `copy-audit.md`; live `home-cold-desktop.png`. |
| F-1-12 | The saved set continues to be named “current medication list.” | `claim-current-medication-list.log`, `claim-regimen-history.log`; `copy-audit.md`. |
| F-1-13 | The tools heading continues to name print, share, and backup actions. | `how-to heading and third step name the caregiver actions`; live `home-cold-desktop.png`. |
| F-1-14 | The appearance button continues to name its resulting view. | `dark mode has no serious axe findings`; live both-theme axe result in `live-check.json`. |
| F-1-15 | Privacy copy continues to state that no analytics or code load from other sites. | `claim-local-only.log`; live `externalRequests: []`. |
| F-1-16 | Reader-facing storage wording remains “this browser’s local database.” | `README.md`; `claim-real-record-retention.log`. |
| F-1-17 | Backup copy remains passphrase-first rather than algorithm-first. | `README.md`; `claim-encrypted-backup.log`. |
| F-1-18 | README retains plain language for testing and updates. | `README.md`; clean-clone `full-suite.log`. |
| F-1-19 | README retains “static progressive web app.” | `README.md`; clean-clone `build.log`. |
| F-1-20 | Privacy keeps the direct `h1` “Privacy.” | Route quality test; live `verify-url/privacy/verify.json`. |
| F-1-21 | Terms keeps the direct `h1` “Terms of use.” | Route quality test; live `verify-url/terms/verify.json`. |
| F-1-22 | Missing routes still serve the designed “Page not found.” page with HTTP 404. | Live `live-check.json` route matrix; `live/404.html` records HTTP 404. |
| F-1-23 | The vague “ordinary medications” wording remains absent. | `README.md`; `claim-print-handoff.log`. |
| F-2-1 | Step three still says “Print, share, or back up the handoff.” and explains the options. | `how-to heading and third step name the caregiver actions`; live `home-cold-desktop.png`. |
| F-2-2 | The how-to `h2` still names the three-step task. | Same quality test; `copy-audit.md`. |
| F-2-3 | README contains no reader-facing IndexedDB, AES-GCM, or key-derivation jargon. | `README.md`; `copy-audit.md`. |
| F-3-1 | Artwork provenance remains in the factory design record, not public claim copy. | `public footer omits the untestable artwork provenance claim`; `design.md`. |
| F-4-1 | Replaced the false Bedtime empty state with “No doses are scheduled at this time.” | `demo Bedtime states that no doses are scheduled, not that medications are absent`; live `demo-bedtime-desktop.png`; live `live-check.json` (`bedtimeCopy`, `oldBedtimeCopyAbsent`). |
| F-4-2 | Added a reviewed self-hosted 1200 × 630 PNG derived from the hand-authored social card; all static route metadata now uses it. | `every route declares a self-hosted PNG social card`; live `socialType: image/png`, `socialSize: 1200 × 630`, `http-identity.txt`. |

## Verification

- Fresh clone at `23e888e0be60606401aa7cdff87bb391071fd612`: `npm ci`, every one of the 17 exact commands from `claims.json`, `npm test`, `npm run test:type`, `npm run lint`, and `npm run build` passed. Logs: `qa-evidence/polish-4/clean-clone/`.
- Full clean-clone suite: 3 unit tests and 32 Chromium tests passed. It includes all 17 claims, offline reload, service-worker update, privacy requests, keyboard dialogs, 390 px/200% layout, both-theme axe, metadata, focus routing, and the two new regressions.
- Build: 54.13 KB JavaScript raw / 19.98 KB gzip, 14.63 KB CSS raw / 4.13 KB gzip, 170.45 KB app art, and a 56.11 KB PNG social card.
- Local verifier passed home, demo, privacy, terms, and 404 with one `h1`, `lang=en`, `main`, alt text, button names, and no console errors. Evidence: `qa-evidence/polish-4/local/verify-url/`.
- Local Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 2.0 s, TBT 0 ms, CLS 0. Evidence: `qa-evidence/polish-4/local/lighthouse-mobile.json`.
- The deployment succeeded at <https://med-handoff-card.sociobot.in>. Cold live audit passed first-screen copy, one-click demo, banner/reset/exit, Bedtime wording, PNG metadata and response, route titles/focus/404, offline reload, no external requests, both-theme axe, and mobile 200% text. Evidence: `qa-evidence/polish-4/live/live-check.json` and its screenshots.
- Live verifier passed home, demo, privacy, and terms. Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.8 s, TBT 0 ms, CLS 0.
- Live and `dist/` SHA-256 values match for home, demo, privacy, terms, 404, social card, service worker, and manifest. Evidence: `qa-evidence/polish-4/live/http-identity.txt`.

The catalog description is verb-first and 64 characters: “Track medication handoffs and dose states for family caregivers.”
