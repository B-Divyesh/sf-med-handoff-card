# Polish round 3 — cumulative finding closure

Release candidate `15a96674c0cbe6ad6f137ba124a54fa252b3913c` was repaired from review commit `ce87d83d40be6d83a1914c64efa5507d73f0aff0`. The implementation commit is `695ffb86a56c6decfe82e4f96df5d672a9e54927`.

Every finding in `.factory/review-1.md`, `.factory/review-2.md`, and `.factory/review-3.md` was checked in source, in a clean clone, and on the deployed site. F-3-1 was the only finding still present: the public footer assertion was removed, its provenance remains in `.factory/design.md`, and a regression test now checks every route. No finding remains open.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | History API navigation focuses and announces each destination `h1`; Back and Forward restore heading focus. | `real routes update metadata, share chrome, announce navigation, and restore heading focus`; `live/live-check.json` route focus fields; live `/privacy`; `live/privacy-desktop.png`. |
| F-1-2 | Home, Demo, Privacy, Terms, and 404 retain route-specific titles, descriptions, canonicals, OG/Twitter data, icons, and robots rules. | `static response policy declares CSP, immutable assets, manifest MIME, and a 404`; route test; `live/live-check.json`; live `/demo`, `/privacy`, `/terms`, and the checked missing URL. |
| F-1-3 | One shared masthead, navigation, view control, footer, legal links, and build ID render on all routes. | Route test; `live/live-check.json` route metadata; `live/privacy-desktop.png`; `live/not-found-desktop.png`. |
| F-1-4 | Every HTML route links the dedicated 180 px PNG touch icon. | Static policy and route tests; `live/live-check.json` `apple` fields; live `/icons/apple-touch-icon.png`. |
| F-1-5 | The first-screen action opens the complete `?demo=1` sample with one click. | `@claim:demo-entry`; `live/live-check.json` first-screen and demo entry; `live/home-mobile.png`; `live/demo-mobile.png`; live `/?demo=1`. |
| F-1-6 | The banner limits its promise to tested dose isolation; direct demo mode never opens the real record database. | `@claim:demo-isolation`; `live/live-check.json` `directIsolation` and `exit`; live `/?demo=1`. |
| F-1-7 | QR wording names the selected date, full current medication list, and readable dose states. | `@claim:qr-handoff`; `@claim:qr-contents`; individual clean-clone claim logs; decoded live payload in `live/live-check.json`; live `/demo`. |
| F-1-8 | README points to exact claim and quality test files without a broad coverage assertion. | Source review; clean-clone `full-suite.log` names all 30 browser tests. |
| F-1-9 | The print promise names the exact included eight-medication fixture. | `@claim:print-handoff`; clean-clone `claim-print-handoff.log`. |
| F-1-10 | Privacy provides confirmed record deletion while demo data stays separate. | `@claim:delete-record`; `live/live-check.json` deletion result; `live/privacy-desktop.png`; live `/privacy`. |
| F-1-11 | The headline consistently uses “medication.” | `@claim:demo-entry`; `live/live-check.json` headline; `live/home-mobile.png`. |
| F-1-12 | User-facing copy consistently uses “current medication list.” | `@claim:current-medication-list`; `@claim:regimen-history`; `.factory/copy-audit.md`; live `/demo`. |
| F-1-13 | The tools heading names printing, sharing, and backup. | `how-to heading and third step name the caregiver actions`; `live/home-mobile.png`; live `/#tools`. |
| F-1-14 | The appearance control names its result: “Use night view” or “Use light view.” | `dark mode has no serious axe findings`; route test; `live/live-check.json`; live `/demo`. |
| F-1-15 | Privacy copy says the app loads no analytics or code from other sites. | `@claim:local-only`; `live/live-check.json` has no external requests; live footer on all checked routes. |
| F-1-16 | Reader-facing storage copy says “this browser’s local database.” | `@claim:real-record-retention`; README and `.factory/copy-audit.md`. |
| F-1-17 | Reader-facing backup copy explains that its passphrase is required. | `@claim:encrypted-backup`; README and `.factory/copy-audit.md`. |
| F-1-18 | README avoids test-tool and service-worker jargon in public assurances. | README source review; clean-clone `full-suite.log` supplies the exact test evidence. |
| F-1-19 | README spells out “static progressive web app.” | README source review; clean-clone `build.log`. |
| F-1-20 | Privacy uses the direct heading “Privacy.” | Route test; `live/live-check.json`; `live/privacy-desktop.png`; live `/privacy`. |
| F-1-21 | Terms uses the direct heading “Terms of use.” | Route test; `live/live-check.json`; live `/terms`. |
| F-1-22 | Missing routes return HTTP 404 with “Page not found.” and a route home. | Static policy and route tests; `live/live-check.json`; `live/not-found-desktop.png`; live missing URL. |
| F-1-23 | The vague phrase “ordinary medications” remains absent. | `@claim:print-handoff`; `.factory/claims.json`; README source review. |
| F-2-1 | Step three says “Print, share, or back up the handoff.” and explains each option. | `how-to heading and third step name the caregiver actions`; `live/live-check.json`; `live/home-mobile.png`. |
| F-2-2 | The semantic section heading says “Create a medication handoff in three steps.” | Same named quality test; `live/live-check.json`; `live/home-mobile.png`. |
| F-2-3 | README contains no reader-facing IndexedDB, AES-GCM, or key-derivation jargon. | README and `.factory/copy-audit.md` source review; `@claim:encrypted-backup` verifies the behavior. |
| F-3-1 | Removed “Original artwork was generated for Med Handoff Card.” from every public footer. Provenance remains only in `.factory/design.md`. | `public footer omits the untestable artwork provenance claim`; route test; `live/live-check.json` footer assertions; all four live screenshots; live home. |

## Verification

- Fresh clone at implementation commit: `npm ci`, all 17 exact `.factory/claims.json` commands individually, `npm run test:type`, `npm run lint`, `npm run build`, and `npm test` passed. Evidence: `.factory/qa-evidence/polish-3/clean-clone/`.
- Full suite: 3 unit tests and 30 Chromium tests passed, including 17 claim tests and the new F-3-1 regression test.
- Build: 54.13 KB JavaScript raw / 19.98 KB gzip, 14.63 KB CSS raw / 4.13 KB gzip, and 170.45 KB hero WebP.
- Local verifier passed with no console errors, one `h1`, `lang=en`, `main`, complete alt text, and named buttons. Local Lighthouse: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.1 s, TBT 0 ms, CLS 0.
- Deployment `8ba87eb6-4691-478e-9b9d-dec860d31a40` succeeded at <https://med-handoff-card.sociobot.in>.
- Cold live audit passed first-screen wording, one-click demo, direct demo isolation, reset/exit, route focus and metadata, 404, legal links, deletion, 390 px layout, 200% text, 44 px targets, offline reload, both-theme axe, same-origin privacy, and console checks. Evidence: `.factory/qa-evidence/polish-3/live/live-check.json`.
- Live Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.8 s, TBT 0 ms, CLS 0.
- Live `index.html`, service worker, manifest, JavaScript, and CSS SHA-256 values match `dist/` exactly. Evidence: `.factory/qa-evidence/polish-3/live/http-identity.txt`.

The 73-character catalog line is verb-first: “Record medication handoffs and dose states for the next family caregiver.” No finding remains open.
