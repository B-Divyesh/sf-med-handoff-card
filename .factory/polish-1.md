# Polish round 1 — finding closure

Release candidate `26d89d1eba832e6e59035f55652aa98c2c241f73` was repaired from review commit `e1cad5c3c8b1c35e9b3dfa88012528cf3c50b0d8`. The implementation commit is `a40ab948062ccf676eea3366ceea191d5978b6d4`.

All 23 findings in `.factory/review-1.md` are closed. No earlier `.factory/polish-*.md` existed. The prior verification reports were also read; their previously repaired stop-history, future-date, keyboard-import, print, demo, privacy, and offline cases remain in the passing suite.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Internal route links now use History API navigation. Each route focuses its `h1`, updates a polite announcement, and restores saved scroll on Back/Forward. | `real routes update metadata, share chrome, announce navigation, and restore heading focus`; live `routes.privacy.focus`, `backFocus`, and `forwardFocus` in `.factory/qa-evidence/polish-1/live/live-check.json`. |
| F-1-2 | Home, Demo, Privacy, Terms, and 404 now have route-specific titles, descriptions, canonicals, OG/Twitter fields, social art, favicons, and robots policy. Separate Vite HTML entries preserve metadata on direct loads. | Same route test; live metadata matrix in `live/live-check.json`; direct live URLs: `/demo`, `/privacy`, `/terms`, and a missing route. |
| F-1-3 | Every route is rendered through one shared masthead/footer with Board, Demo, Tools, Privacy, appearance control, one-line description, legal links, factory credit, build ID, and art provenance. | Same route test; live route `nav`, `footer`, and `theme` fields; `live/screenshots/not-found-desktop.png`. |
| F-1-4 | Added a dedicated 180×180 PNG apple-touch icon and linked it on every HTML entry. | Browser route test; live natural size `180 × 180` in `live/live-check.json`; live `/icons/apple-touch-icon.png`. |
| F-1-5 | Registered `demo-entry`. The home action opens `/?demo=1` and immediately renders the banner, Nora Ellis, shift note, three medications, and dose states. | `@claim:demo-entry`; `live/screenshots/home-mobile.png`; `live/screenshots/demo-mobile.png`; live demo fields. |
| F-1-6 | Narrowed the banner to the tested promise: “Dose changes in this demo do not change your real record.” | `@claim:demo-isolation`; clean-clone claim log; live banner text. |
| F-1-7 | Registered `qr-contents`; rewrote the warning in plain words; the test decodes without a key and compares date, full medication list, and every sample dose state. | `@claim:qr-contents`; live decoded `demo.qr` evidence. |
| F-1-8 | Removed the broad README coverage assertion. README now says to run the suite and links the exact claim and quality test files. | README review; clean-clone `npm test` log. |
| F-1-9 | Replaced the undefined “ordinary” boundary with the exact included eight-medication fixture. | `@claim:print-handoff` generates one-page A4 and Letter PDFs. |
| F-1-10 | Added a rose-stamped Privacy danger area and confirmed **Delete this record** action that deletes the real IndexedDB key while leaving demo data separate. | `@claim:delete-record`; live `deletion.empty=true` and `removed=true`; `live/screenshots/privacy-desktop.png`; live `/privacy`. |
| F-1-11 | Changed the headline to “Track medication handoffs between family caregivers.” | Home screenshot; `.factory/copy-audit.md`. |
| F-1-12 | Standardized user-facing language on “current medication list,” including instructions, board count, dialog, stop messages, history, QR copy, README, and terminology audit. | `@claim:current-medication-list`, `@claim:regimen-history`, copy audit; source search returns no user-facing “current regimen.” |
| F-1-13 | Renamed the tools heading to “Print, share, or back up the handoff.” | Home and demo screenshots; heading rendered in browser suite. |
| F-1-14 | Appearance labels now name the result: “Use night view” and “Use light view.” | Dark-theme axe test; route/shared-chrome test; live theme field. |
| F-1-15 | Replaced implementation jargon with “The app loads no analytics or code from other sites.” | `@claim:local-only`; live request log contains no external requests. |
| F-1-16 | README now says the record is stored in this browser’s local database; IndexedDB appears only under Technical notes. | `@claim:real-record-retention`; README review. |
| F-1-17 | README leads with the passphrase outcome; AES-GCM appears only in Technical notes. | `@claim:encrypted-backup`. |
| F-1-18 | Removed axe and service-worker jargon from the README assurance. Exact assertions are linked instead. | README review; clean-clone full-suite log. |
| F-1-19 | Expanded “PWA” to “static progressive web app.” | README Deploy section. |
| F-1-20 | Changed the Privacy `h1` to “Privacy.” | Route test; live metadata/focus result; privacy screenshot. |
| F-1-21 | Changed the Terms `h1` to “Terms of use.” | Route test; live `routes.terms`. |
| F-1-22 | Changed the 404 `h1` to “Page not found.” while retaining the direct explanation and return action. | Route test; live HTTP 404 and `routes.notFound`; missing-page screenshots. |
| F-1-23 | Removed “ordinary medications” and used the exact included eight-item fixture boundary. | `@claim:print-handoff`; claims registry and README. |

## Verification evidence

- Clean clone: all 17 claim commands ran separately and passed. Log: `.factory/qa-evidence/polish-1/clean-clone-claims.log`.
- Clean clone full suite: 3 unit tests and 28 Chromium tests passed. Log: `.factory/qa-evidence/polish-1/clean-clone-full-suite.log`.
- Type-check, lint, and production build passed. Output: 54.12 KB JavaScript raw / 19.99 KB gzip; 14.63 KB CSS raw / 4.13 KB gzip; 170.45 KB hero WebP.
- Local URL verifier: no console errors, one h1, `lang=en`, main, alt text, and button names. Evidence: `.factory/qa-evidence/polish-1/local/verify-url/`.
- Local Lighthouse home: 99 performance, 100 accessibility, 100 best practices, 100 SEO; FCP 1.1 s, LCP 2.1 s, TBT 30 ms, CLS 0.
- Live URL verifier: same structural checks passed. Evidence: `.factory/qa-evidence/polish-1/live/verify-url/`.
- Live Lighthouse home: 100 performance, 100 accessibility, 100 best practices, 100 SEO; FCP 0.9 s, LCP 1.8 s, TBT 0 ms, CLS 0.
- Live functional audit: zero serious/critical axe findings in both themes, zero external requests, no unexpected console errors, 390 px/200% text without overflow, 44 px minimum target, complete QR decode, persistent deletion, offline reload, and correct routing. Evidence: `.factory/qa-evidence/polish-1/live/live-check.json`.
- Deployment `d2be1cc2-1380-4de1-837a-42b0a15e24ea` succeeded at <https://med-handoff-card.sociobot.in>.
- Live `index.html`, service worker, JavaScript, and CSS SHA-256 values match `dist/` exactly. Evidence: `.factory/qa-evidence/polish-1/live/http-and-identity.txt`.

No finding remains open.
