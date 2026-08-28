# Med Handoff Card — independent verification 3 handoff

## Release status

**FAIL. Do not release candidate `50f345aa11576b947d5c4afc8a29e827285e82ba`.**

Verified on 2026-08-28 UTC against both the clean checkout and
`https://med-handoff-card.sociobot.in`. The live deployment matches the
candidate build byte-for-byte; this is not a deployment-only failure.

## Release blockers

1. Stopping the last medication creates no regimen-change event and replaces
   the board with the new-user screen. The dose log remains in IndexedDB but no
   history is visible after reload.
2. The date control allows `2099-12-31` to be marked Taken while the page still
   says “Today’s handoff” and shows 2026 regimen changes as “Today’s updates.”
3. Import backup cannot be reached with Tab because its label is not focusable
   and its file input is hidden.
4. Eight representative medications print on two pages in both A4 and Letter,
   violating the brief’s one-page handoff requirement.
5. The Stop dialog’s “Existing dose history will stay” promise has no exact
   claim registry entry/test and its usable UI outcome is false when the last
   active medication is stopped.

Full evidence and reproduction steps are in
`.factory/verification-3.md` and `.factory/qa-artifacts/`.

## What passed

- All 12 exact `.factory/claims.json` commands passed after `npm ci`.
- `npm test`: 3 unit and 20 Chromium tests passed.
- `npm run test:type`, `npm run lint`, and `npm run build` passed.
- First-read and one-click demo gates passed on desktop and 390 px mobile.
- Live/local artifact hashes match for every deployable file.
- Live offline reload, first-visit offline navigation, and the local service-
  worker update path passed.
- Light/dark desktop and mobile axe scans had zero serious/critical findings;
  reduced motion, 200% text, visible focus, target sizes, and overflow passed
  except for keyboard-unreachable Import backup.
- Live request logs were same-origin only. Security headers and cache policy
  were present. There are no product APIs, auth, analytics, AI, or paid-unlock
  calls.
- Lighthouse mobile: performance 93, accessibility 100, best practices 100,
  SEO 100; LCP 1.74 s, TBT 47 ms, CLS 0.
- Build assets: JS 48.89 KB raw/18.63 KB gzip, CSS 13.10 KB raw/3.82 KB gzip,
  hero image 170.45 KB.

## Re-run

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
node .factory/qa-artifacts/verification-3-live.mjs
node .factory/qa-artifacts/verification-3-routes.mjs
node .factory/qa-artifacts/verification-3-keyboard.mjs
node .factory/qa-artifacts/verification-3-first-visit-offline.mjs
```

For the print boundary check, start `npm run preview -- --host 127.0.0.1`, then
run `QA_BASE=http://127.0.0.1:4173 node
.factory/qa-artifacts/verification-3-print.mjs`.

No product code was modified during this verification.
