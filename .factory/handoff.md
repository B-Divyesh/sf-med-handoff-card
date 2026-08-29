# Med Handoff Card — polish round 4 handoff

## Status

**PASS.** Repair commit: `23e888e0be60606401aa7cdff87bb391071fd612`.
It was pushed to `main` and deployed as
`095c3bcb-a2f5-477d-93b8-233f587c8267` at
<https://med-handoff-card.sociobot.in>.

This round closes every finding in reviews 1–4. The remaining review-4 fixes
are a precise Bedtime empty state (“No doses are scheduled at this time.”) and
a self-hosted 1200 × 630 PNG social preview used by every Open Graph/Twitter
tag. The source SVG was also corrected so its tagline no longer clips before
the reviewed PNG render.

## Run and verify

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
```

For the isolated sample, open
<https://med-handoff-card.sociobot.in/?demo=1>. The banner supplies **Reset
demo** and **Start for real**; demo data is in memory and uses only the
`demo:mhc_theme` preference key. The real record remains in the separate
browser-local database.

## Evidence

- Clean clone: all 17 `claims.json` commands passed individually, then 3 unit
  and 32 Chromium tests, typecheck, lint, and build passed. Logs are in
  `.factory/qa-evidence/polish-4/clean-clone/`.
- Local URL checks passed for home, demo, privacy, terms, and 404 without
  console errors or basic semantic/accessibility failures. Local Lighthouse:
  99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.0 s,
  TBT 0 ms, CLS 0.
- Cold live audit passed one-click demo isolation, reset/exit, Bedtime wording,
  PNG metadata and `image/png` response, route focus and 404, offline reload,
  same-origin-only requests, both-theme axe, and 390 px at 200% text. Live
  screenshots and JSON are in `.factory/qa-evidence/polish-4/live/`.
- Live Lighthouse: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.8 s, TBT 0 ms, CLS 0.
- `http-identity.txt` proves the deployed HTML, manifest, service worker, and
  social card bytes match `dist/`.

See `.factory/polish-4.md` for the one-to-one finding map and exact test or
live evidence for every prior and current finding.

## Known gaps and next steps

None. The product remains a static, local-first progressive web app; deployment
owns `dist/` and needs no backend, account, tracking, or payment service.
