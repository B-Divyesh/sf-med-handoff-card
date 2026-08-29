# Med Handoff Card — adversarial review 5 handoff

## Status

**FAIL.** Review 5 found four blocking and four minor findings. No product code
was changed. The complete report is `.factory/review-5.md`.

The blocking items are: the public demo-isolation promise is broader than its
claim test (F-1-6); user-facing “medicine” remains after the earlier
terminology repair (F-1-11); stopped-item history still says “regimen”
(F-1-12); and the medication-row “Stop” action can read as clinical advice
rather than removal from the app’s current list (F-5-1).

## Run and verify

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
```

For the isolated sample, open
<https://med-handoff-card.sociobot.in/?demo=1>. Review 5 confirmed current
demo behavior is isolated, reset works, and offline reload works, while also
finding that the automated claim test does not cover the full public promise.

## Evidence

- Clean clone at `564a2f02edc410ee9b46132403eccb551cab93ad`:
  all 17 `claims.json` commands passed individually.
- Full suite: 3 unit tests and 32 Chromium tests passed. Typecheck, lint, and
  build passed; JavaScript is 19.98 KB gzip.
- Cold live checks covered 390 px and desktop first screens, one-click sample,
  reset/exit, extended demo isolation, offline reload, same-origin requests,
  route metadata/focus/404, link crawl, both-theme axe, touch targets, and 200%
  text.
- Live route documents and compiled assets match the clean build by SHA-256.
- The exact copy inventory, claim matrix, prior-finding matrix, and concrete
  repair text are in `.factory/review-5.md`.

## Known gaps and next steps

Repair F-1-6, F-1-11, F-1-12, and F-5-1 through F-5-5, add the specified
regression coverage, deploy, and repeat the full review. The current build is
functional and its declared tests pass, but review acceptance requires zero
findings and no untested public claim.
