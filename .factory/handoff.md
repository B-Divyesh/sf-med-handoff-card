# Med Handoff Card — repair handoff

## Release status: repaired and ready to deploy

This repair starts from verifier failure `1ce8b3094f717ca8fd7586efe50e971e5e08bdd1`
for candidate `a0605682d1f662b9934a85fea10ecef6e42082f3`.
Implementation repair commit: `9f8d96325519f86a117937ced4dd13b37d5fac3c`.

## What changed

- Backup data is structurally validated before it can replace IndexedDB. Invalid
  files are rejected with a recoverable in-app error. Valid legacy exports are
  normalized to include an empty regimen-history list.
- Required medication name and amount are trimmed and rejected when blank.
- Medication edits now add immutable regimen-change events with the old and new
  amount, directions, and schedule. The event is shown in Today’s updates.
- QR payload version 2 includes a stable `medicationId` on every regimen item,
  matching each dose record. The browser regression decodes the generated QR
  image and validates that mapping.
- The service worker never writes navigation responses into `/index.html`.
  Only `/` and `/demo` use the precached app shell as an offline fallback.
- Dark selected-control and primary-brand colors meet the axe contrast gate.
- Demo appearance uses `demo:mhc_theme`, separate from the real `mhc_theme`
  preference. The banner now says exactly what is isolated.
- The medication dialog has an accessible name and successful save moves focus
  to a logical board heading.
- Privacy, Terms, and 404 now use the shared header, navigation, footer, and
  build marker. `public/social-card.svg` is an original 1200 × 630 social
  preview derived from the bedside-print visual system.
- Claims now cover current regimen details, state/note retention, IndexedDB
  retention, and regimen-change history in addition to strengthened offline and
  QR checks.

## Verification

Run from a clean checkout with Node 20+:

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
```

The final clean run passed 3 Vitest tests and 20 Chromium browser tests,
including 390 px/mobile, desktop, keyboard dialog flow, focus recovery,
light/dark axe checks, text/target checks, privacy requests, offline after
visiting Privacy, and service-worker update activation. All 12 declared claim
commands pass individually through `npm run test:claims -- --grep
"@claim:<id>"`.

Build output is `dist/`: 48.81 KB JavaScript (18.55 KB gzip), 13.10 KB CSS
(3.82 KB gzip), and 170.45 KB WebP hero art. No package-consumer test applies:
this is a static offline PWA, not a published library.

Local release checks also passed:

- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo
  .factory/qa-evidence/repair-3-verify-url` — title, `lang`, one `h1`, main,
  image alt text, labeled controls, and zero errors.
- `npx @axe-core/cli` against local `/demo` — 0 violations. Evidence:
  `.factory/qa-evidence/repair-3-axe.json`.
- Playwright AxeBuilder covers the same demo in light and dark themes with zero
  serious or critical violations.

## Deployment and known gaps

Artifact class remains `pwa-offline`; deployment remains static `dist/` via the
repository’s Azure Static Web Apps configuration. No infrastructure, DNS,
billing, accounts, analytics, third-party runtime services, AI calls, or paid
features were added. `main` was pushed to `origin` at
`8955a16ac52142e4d2f12dcb1a59011b4fe3c7d5`.

The direct authorized `swa deploy dist --app-name med-handoff-card --env
production --swa-config-location public` command authenticated successfully,
then stalled while resolving the Azure project settings and did not report a
deployment. Its CLI-created local `.env` credentials file was removed without
being read or committed. At handoff the live URL still serves the prior index
hash `cfae52cb929c7f461c309ad39bdb6d360c0280cd91bc29b99253719fc23bd4f6`,
not this build. This is an external deployment-configuration follow-up, not a
build or product-QA failure.

No product release blockers remain. After the factory deployment completes, use
the live `/demo` URL for the final byte-identity and response-header check.
