# Med Handoff Card — polish round 3 handoff

## Status

**PASS.** All 27 cumulative findings from reviews 1–3 are resolved. The released repair is live at <https://med-handoff-card.sociobot.in>.

## What changed

- Removed the untestable public artwork-provenance sentence identified by F-3-1 while retaining exact asset provenance in `.factory/design.md`.
- Added a five-route browser regression test that prevents the removed footer claim from returning.
- Advanced the visible build ID to `2026.08.28-polish.3`, the service-worker cache to `med-handoff-v7`, and the installed-app start version to `v=7` so existing installs receive the repair.
- Updated `.factory/copy-audit.md` and the verb-first, 73-character `.factory/catalog-description.txt`.
- Rechecked every earlier copy, claim, demo, route, title, metadata, focus, 404, legal, deletion, mobile, accessibility, privacy, and offline repair. The complete finding map is in `.factory/polish-3.md`.

Implementation commit: `695ffb86a56c6decfe82e4f96df5d672a9e54927`.

## Verification evidence

- Clean clone: `npm ci` reported 0 vulnerabilities. Each of the 17 exact commands in `.factory/claims.json` ran separately and passed.
- Full clean-clone suite: 3 unit tests and 30 Chromium tests passed.
- `npm run test:type`, `npm run lint`, and `npm run build` passed. `dist/` contains root `index.html`.
- Output sizes: JavaScript 54.13 KB raw / 19.98 KB gzip; CSS 14.63 KB raw / 4.13 KB gzip; hero WebP 170.45 KB.
- Browser coverage passed desktop and 390 px mobile, keyboard dialogs/import, route focus, 200% text, 44 px targets, update activation, offline reload, privacy request logging, demo isolation, and all empty/error/destructive states in scope.
- Axe through Playwright found 0 serious or critical issues in light and night views.
- `/opt/fleet/lib/verify-url.sh` passed locally and live: HTTP 200, no console errors, `lang=en`, one `h1`, `main`, alt text, and named buttons.
- Local Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; FCP 1.1 s, LCP 2.1 s, TBT 0 ms, CLS 0.
- Live Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; FCP 0.9 s, LCP 1.8 s, TBT 0 ms, CLS 0.
- Cold live audit confirmed the exact first-screen copy and all three facts fit at 390 × 844; one click opens `?demo=1`; the direct demo creates no real database; reset restores Nora Ellis; exit opens an empty real record; offline reload retains the sample.
- Cold live routing confirmed route-specific titles and metadata, common chrome, focused and announced headings, Back/Forward focus, working links, Privacy deletion, and a designed HTTP 404.
- Live request logs contain no external request and no console/page errors. Local/live hashes match for `index.html`, `sw.js`, `manifest.webmanifest`, hashed JavaScript, and CSS.

Evidence paths:

- `.factory/qa-evidence/polish-3/clean-clone/`
- `.factory/qa-evidence/polish-3/local/`
- `.factory/qa-evidence/polish-3/live/live-check.json`
- `.factory/qa-evidence/polish-3/live/home-mobile.png`
- `.factory/qa-evidence/polish-3/live/demo-mobile.png`
- `.factory/qa-evidence/polish-3/live/privacy-desktop.png`
- `.factory/qa-evidence/polish-3/live/not-found-desktop.png`
- `.factory/qa-evidence/polish-3/live/lighthouse-summary.json`
- `.factory/qa-evidence/polish-3/live/http-identity.txt`

## Deploy

Static work-order deployment `8ba87eb6-4691-478e-9b9d-dec860d31a40` succeeded. The custom HTTPS URL returned 200 immediately after deployment. Re-run with:

```sh
npm ci
npm test
npm run build
/opt/fleet/lib/deploy-static.sh med-handoff-card dist
```

## Known gaps and next steps

None within the brief, product contract, or cumulative review scope. No further product repair is required; the factory may retain the current production deployment.
