# Med Handoff Card — polish round 1 handoff

## Release status

**PASS.** All 23 findings from adversarial review 1 are repaired, tested, pushed, and deployed at <https://med-handoff-card.sociobot.in>. The artifact remains a static, local-first offline PWA with `dist/index.html` at its root.

- Implementation commit: `a40ab948062ccf676eea3366ceea191d5978b6d4`
- Deployment: `d2be1cc2-1380-4de1-837a-42b0a15e24ea`

The complete finding-by-finding closure map is in `.factory/polish-1.md`.

## What changed

- Rewrote the first screen in one medication vocabulary and made **Try it with sample data** open the isolated `/?demo=1` sample in one click.
- Added complete route metadata and multi-page build entries for Demo, Privacy, Terms, and the designed HTTP 404.
- Added History API routing, route announcements, heading focus, Back/Forward focus, and scroll restoration.
- Unified the bedside-print masthead, footer, navigation, appearance control, provenance, legal links, and build ID on every route.
- Added a 180×180 apple-touch icon.
- Added a confirmed in-app record deletion action on Privacy.
- Replaced vague or technical copy, defined the print promise by its exact fixture, and expanded the claims registry to 17 independently tagged tests.
- Kept the original paper, cobalt, marigold, rose, Georgia, halftone, square-rule, and stamped-control identity. Mobile now retains the full navigation in a ruled second row.

## Exact verification

A fresh clone of implementation commit `a40ab948062ccf676eea3366ceea191d5978b6d4` ran:

```sh
npm ci
# Every command in .factory/claims.json, separately
npm test
npm run test:type
npm run lint
npm run build
```

Results:

- All 17 claim commands: PASS, exactly one tagged test per claim.
- `npm test`: PASS — 3 Vitest unit tests and 28 Chromium browser tests.
- Type-check and lint: PASS.
- Production build: PASS.
- JavaScript: 54.12 KB raw / 19.99 KB gzip.
- CSS: 14.63 KB raw / 4.13 KB gzip.
- Hero WebP: 170.45 KB.
- Local Lighthouse home: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.1 s, TBT 30 ms, CLS 0.
- Live Lighthouse home: 100 in all four categories; LCP 1.8 s, TBT 0 ms, CLS 0.
- Local and live factory URL verifier: PASS.
- Integrated axe: zero serious or critical findings in light and dark views.
- Live 390 px and simulated 200% text: no horizontal overflow; every visible interactive target at least 44 px.
- Live privacy trace: no analytics, accounts, third-party code, product APIs, or cross-origin requests.
- Live PWA: the full sample reloads offline under service-worker control.
- Live routing: root, Demo, Privacy, and Terms return 200; unknown URL returns the designed HTTP 404; Back/Forward restores heading focus.
- Live QR decode: selected date, Nora Ellis, all three medications, and all three recorded dose states present in readable data.
- Live deletion: confirmed deletion remains empty after reload; demo sample remains separate.
- Live artifact hashes match `dist/` exactly.

Evidence is under `.factory/qa-evidence/polish-1/`. Screenshots are in its `screenshots/` and `live/screenshots/` folders.

## Run and deploy

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
/opt/fleet/lib/deploy-static.sh med-handoff-card dist
```

## Known gaps and next steps

None. No review finding of any severity remains unresolved. No backend, account, payment, AI, or third-party runtime service is used.
