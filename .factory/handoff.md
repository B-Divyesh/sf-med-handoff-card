# Med Handoff Card — repair 3 handoff

## Release status

Local release verification passes. This repair starts from candidate
`b463f0a516a1e4cde8e3f108f68fc41ea93bd701` and retains the independent
verifier fixes recorded in report commit
`1ce8b3094f717ca8fd7586efe50e971e5e08bdd1`.

## Controller finding reproduced and repaired

After a clean `npm ci`, the exact `npx playwright test --workers=1` suite ran
20 tests and reproduced two failures: 18 passed; focus recovery failed because
the `Today’s handoff` h1 was inactive after Save, and the immediate-reload
retention claim lost its medication.

- The modal used to render and focus the board before it closed. Browsers keep
  focus inside an open modal, so the h1 focus request was rejected. Save now
  closes the modal before rendering; the existing exact focus assertion passes.
- IndexedDB used to be reopened for each save. An immediate reload could start
  before the write transaction. The app now reuses the database connection
  opened during initial load, starting the write transaction in the Save event's
  current task. The exact retention claim passed 10 consecutive repetitions.
- The service-worker cache generation is now `med-handoff-v4`, ensuring existing
  installations receive the repaired shell and hashed application bundle.
- The visible build marker is `2026.08.28-repair.2` on app and static routes.

## Independent verifier findings retained

- Invalid or wrong-schema backups are rejected before IndexedDB changes, with a
  recoverable error. Valid legacy data receives an empty regimen history.
- Required medication names and amounts are trimmed and whitespace-only values
  stay in the named dialog with an assertive error.
- Medication edits append immutable regimen-change events showing the prior and
  new amount, directions, and schedule.
- QR payload version 2 uses the same stable medication ID in regimen and dose
  records. Its claim test decodes the QR and verifies every mapping.
- Legal-page navigation cannot replace the cached board shell; offline reload is
  tested after visiting Privacy.
- Dark-theme selected controls, brand marks, and primary actions pass the
  serious/critical axe contrast gate.
- Demo appearance remains under `demo:mhc_theme`; the real `mhc_theme` key is
  unchanged when leaving demo mode.
- Privacy, Terms, and 404 retain the shared header, footer, build marker, response
  policy, and product-specific 1200 × 630 social preview.
- All 12 visitor claims have one exact tagged browser test.

## Verification evidence

Clean release sequence on Node 20+:

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
```

Results: 0 audit vulnerabilities; 3 Vitest tests passed; the exact 20-test
single-worker Chromium suite passed; type and lint passed; `dist/` was produced.
All 12 `.factory/claims.json` commands also passed individually.

The browser suite covers desktop and 390 × 844 mobile, keyboard operation,
focus recovery, accessible dialog naming and errors, light/dark AxeBuilder,
44 px targets, console errors, malformed imports, privacy request isolation,
demo isolation, offline-after-Privacy, real IndexedDB retention, exports, print,
decoded QR contents, and service-worker waiting/activation/reload.

- Factory URL verifier: 200; 526 ms; correct title and `lang`; one h1; main
  present; zero missing alt text, unlabeled buttons, or browser errors. Evidence:
  `.factory/qa-evidence/repair-3-final-verify-url/`.
- Lighthouse 12.8.2 mobile: performance 100, accessibility 100, best practices
  100, SEO 100; FCP 1.1 s, LCP 1.1 s, TBT 0 ms, CLS 0. Evidence:
  `.factory/qa-evidence/repair-3-final-lighthouse-mobile.json`.
- Standalone axe CLI could not launch because its downloaded ChromeDriver 152
  does not match the factory's pinned Playwright Chromium 145. The required
  Playwright axe integration ran instead and passed both themes with zero
  serious or critical violations.
- Production assets: JavaScript 48.89 KB (18.63 KB gzip), CSS 13.10 KB
  (3.82 KB gzip), hero WebP 170.45 KB. Initial JS/CSS/font/image budgets pass.
- `dist/index.html` SHA-256:
  `3af7d6266464d1e7b694950407d7d02d6f16f340e833e655a5b2290e5c3e1f9a`.
  `dist/sw.js` SHA-256:
  `13a498832d98b51542ff3abffa6dbe4256b3b48a9dc22c3f617e94449e22b36b`.

This remains a static `pwa-offline` artifact with local IndexedDB data. It has
no package-consumer surface, backend, accounts, analytics, third-party runtime
scripts, AI calls, or paid features.

## Deployment

Deployment is configured as the work order specifies: build `dist/`, then use
the factory static deployment path for `med-handoff-card`. Before deployment,
the live origin still served the prior index hash
`cfae52cb929c7f461c309ad39bdb6d360c0280cd91bc29b99253719fc23bd4f6` and
service-worker hash
`483848335f0ba8aee6c5d21a5bd827fc2e8e7ba0625fc0c2de9ba59fd6a0f468`.
Post-deployment identity and response-policy evidence will be added below.

## Known gaps

No product release blockers are known. The standalone axe CLI launcher mismatch
is a worker-tooling limitation; the equivalent in-browser axe gate passes.
