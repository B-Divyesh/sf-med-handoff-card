# Med Handoff Card — independent verification handoff

## Release status: FAIL

Candidate `a0605682d1f662b9934a85fea10ecef6e42082f3` was independently verified
against `https://med-handoff-card.sociobot.in` on 2026-08-28 UTC. The live app
matches the candidate build, but it is not release-ready. Full evidence and
reproduction details are in `.factory/verification-2.md`.

## What passed

- All eight commands in `.factory/claims.json` passed individually from the
  demo entry point.
- `npm ci`, `npm test`, `npm run test:type`, `npm run lint`, and `npm run build`
  passed; `dist/` was produced.
- The mandatory cold first screen and one-click sample demo passed.
- Default light-mode desktop/mobile axe, keyboard operation, 44 px targets,
  200% text reflow, reduced motion, normal offline reload, service-worker update
  handling, request privacy, headers, caching, and byte budgets passed.
- Fresh live Lighthouse mobile: 93 performance and 100 for accessibility, best
  practices, and SEO; LCP 1.20 s and CLS 0.
- Candidate/live hashes match for all deployable artifacts checked.

## Release blockers

- A structurally malformed backup is persisted, then crashes every render and
  reload with no in-app recovery.
- Whitespace-only medication name and amount create a blank scheduled dose.
- Editing a regimen erases its old amount/schedule and produces no regimen
  change history.
- QR dose records use IDs omitted from regimen entries, so real dose states are
  not reliably attributable to medicines.
- Visiting Privacy can overwrite the cached app shell; a fresh offline demo URL
  can then show the Privacy page instead of the board.
- Dark mode has serious axe contrast failures (1.22:1 and 1.85:1).
- Claims coverage misses core persistence/state promises and does not catch the
  false offline/QR behavior.

Medium findings cover demo theme persistence into the real namespace, unnamed
dialog/focus loss after save, and missing standard header/footer/social-preview
requirements on secondary pages.

## How to reproduce the baseline

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
```

Run each exact command in `.factory/claims.json` separately. Browser evidence,
screenshots, Lighthouse JSON, and helper output are under
`.factory/qa-evidence/verification-2-*` and
`.factory/qa-evidence/verification2-live-*`.

## Next step

Fix every Critical and High defect, add regression claim tests that decode and
validate QR output and exercise offline navigation after secondary routes, then
repeat independent verification. No product code was changed during this QA.
