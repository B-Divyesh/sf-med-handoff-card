# Polish round 5 — complete finding map

Repair commit: `eea16ef98271edd5ea0bcea988bc038b60b7d702`.
Deployed work order: `med-handoff-card-polish-5`.

All review findings, including retained prior repairs, were checked again from a
clean clone and against the deployed site. `live-audit.json` below is the cold
production check at `https://med-handoff-card.sociobot.in`.

| Finding | Change made or retained repair | Evidence |
| --- | --- | --- |
| F-1-1 | Retained History API navigation, route announcement, and heading focus on forward/back. | `quality.spec.ts` “real routes update metadata…”; `qa-evidence/polish-5/live/live-audit.json` (`routingFocus`). |
| F-1-2 | Retained route-specific title, description, canonical, OG/Twitter image, favicon, and touch icon. | `quality.spec.ts` “every route declares…”; `qa-evidence/polish-5/live/verify-url/*/verify.json`. |
| F-1-3 | Retained shared masthead, four-link navigation, view control, and footer on all routes. | Route quality test; live `verify-url/{home,demo,privacy,terms}/screenshot-desktop.png`. |
| F-1-4 | Retained the linked self-hosted 180 px touch icon on every document. | `quality.spec.ts` “static response policy…”; live route verifier output. |
| F-1-5 | Retained the one-click root action to `?demo=1` with a filled Nora Ellis sample. | `@claim:demo-entry`; `qa-evidence/polish-5/live/demo-one-click-mobile.png`. |
| F-1-6 | Expanded the public claim to “Demo actions never change your real record.” The tagged test now changes recipient, note, list add/edit/remove, all states, import, view, reset, and exit; it compares UTF-8 bytes of the real IndexedDB record before/after and permits only `demo:` preferences. | `@claim:demo-isolation`; live `live-audit.json` (`oneClickDemo`, `offlineReload`). |
| F-1-7 | Retained readable QR completeness checking; the payload now calls its active set `medicationList`, not `regimen`. | `@claim:qr-contents`; `src/logic.test.ts`. |
| F-1-8 | Retained README instructions that point to named claim and quality tests instead of a broad coverage promise. | `README.md`; generated `copy-audit.md`. |
| F-1-9 | Retained the bounded eight-medication print fixture language and A4/Letter one-page assertion. | `@claim:print-handoff`. |
| F-1-10 | Retained the confirmed real-record deletion path while preserving the demo sample. | `@claim:delete-record`; live Privacy verifier. |
| F-1-11 | Replaced the shift-note placeholder’s “medicine” with “medication” and added a route-wide visible-copy/placeholder regression check. | `quality.spec.ts` “public copy uses one medication-list term…”; live `live-audit.json` first-screen copy. |
| F-1-12 | Replaced stopped-history wording with “Removed from current list” and “Previously listed”; changed readable QR output to `medicationList`. | `@claim:stopped-history`; `@claim:qr-contents`; live `live-audit.json` (`removalSafety`). |
| F-1-13 | Retained the outcome-naming tools heading “Print, share, or back up the handoff.” | `quality.spec.ts` “how-to heading and third step…”; `home-cold-desktop.png`. |
| F-1-14 | Retained “Use night view” / “Use light view” controls. | Both-theme axe checks in `quality.spec.ts`; live `live-audit.json` (`axe`). |
| F-1-15 | Retained plain privacy wording and same-origin runtime behavior. | `@claim:local-only`; live `live-audit.json` (`sameOriginRequests`). |
| F-1-16 | Retained reader-facing “this browser’s local database” wording. | `README.md`; generated `copy-audit.md`; `@claim:real-record-retention`. |
| F-1-17 | Retained passphrase-first backup wording. | `README.md`; `@claim:encrypted-backup`. |
| F-1-18 | Retained plain test and update language in README. | `README.md`; generated `copy-audit.md`. |
| F-1-19 | Retained “static progressive web app” wording. | `README.md`; clean-clone build. |
| F-1-20 | Retained the direct Privacy heading. | Route quality test; live `verify-url/privacy/verify.json`. |
| F-1-21 | Retained the direct Terms of use heading. | Route quality test; live `verify-url/terms/verify.json`. |
| F-1-22 | Retained a styled HTTP 404 with “Page not found.” and a return route. | `quality.spec.ts` route test; live `live-audit.json` (`missingRoute404`). |
| F-1-23 | Retained exact fixture-bound print wording; removed vague “ordinary.” | `README.md`; `@claim:print-handoff`. |
| F-2-1 | Retained direct third-step copy naming print, share, and backup outcomes. | `quality.spec.ts` “how-to heading and third step…”; `home-cold-mobile.png`. |
| F-2-2 | Retained the semantic heading “Create a medication handoff in three steps.” | Same quality test; `home-cold-desktop.png`. |
| F-2-3 | Retained outcome language in README and removed reader-facing storage/algorithm jargon. | `README.md`; generated `copy-audit.md`. |
| F-3-1 | Retained provenance only in `design.md`, not public footer claims. | `quality.spec.ts` “public footer omits…”; `design.md`. |
| F-4-1 | Retained the truthful Bedtime empty state. | `quality.spec.ts` “demo Bedtime…”; `demo-one-click-mobile.png`. |
| F-4-2 | Retained the self-hosted PNG 1200 × 630 social card for all route metadata. | `quality.spec.ts` “every route declares…”; live `social-card.png` header check. |
| F-5-1 | Replaced the clinically ambiguous “Stop” action with “Remove from current list,” with matching confirmation, toast, and history language. | `@claim:stopped-history`; live `live-audit.json` (`removalSafety`). |
| F-5-2 | Replaced “care changes hands” with “when another caregiver takes over.” | `quality.spec.ts` public-copy regression; `home-cold-mobile.png`. |
| F-5-3 | Replaced the undefined “shift card” with “handoff.” | `quality.spec.ts` public-copy regression; `home-cold-desktop.png`. |
| F-5-4 | Expanded the exact claim and test to save/reload Taken, Held, then Unknown, checking notes and the empty optional note. | `@claim:dose-state-notes`; `.factory/claims.json`. |
| F-5-5 | Replaced the hand-maintained audit with `scripts/generate-copy-audit.mjs`; `test:copy-audit` checks source inclusion, word counts, banned terms, and generated-file drift. | `npm run test:copy-audit`; generated `copy-audit.md`. |

## Production evidence

- Cold route verifier: home, direct `?demo=1`, Privacy, and Terms all returned
  HTTP 200, one `h1`, `lang=en`, a `main`, image alt text, labeled buttons,
  and no console errors. Evidence: `qa-evidence/polish-5/live/verify-url/`.
- The live action audit passed first-screen wording, one-click sample, reset and
  exit, safe list removal, focus restoration, HTTP 404, same-origin requests,
  both-theme axe, and offline demo reload. Evidence:
  `qa-evidence/polish-5/live/live-audit.json` and its four PNG screenshots.
- Mobile Lighthouse against production: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.8 s, TBT 0 ms, CLS 0.
  Evidence: `qa-evidence/polish-5/live/lighthouse-mobile.json`.
- Live `index.html`, main JS, and `sw.js` SHA-256 hashes match `dist/`; live
  route matrix was `/` 200, `/demo` 200, `/privacy` 200, `/terms` 200, and an
  unknown route 404.
