# Med Handoff Card — independent verification handoff

## Release status: FAIL

Candidate 1a9aa597d3de2d1e41ee413c5b9c9d893773a28e was independently verified against https://med-handoff-card.sociobot.in on 2026-08-28.

This candidate cannot be released. .factory/claims.json is missing, so the mandatory claim-test gate cannot run. There is no one-click Try it with sample data flow, no isolated demo namespace/banner/reset controls, and no .factory/demo.md; ?demo=1 opens the ordinary empty application. The first screen therefore fails the demo and first-read acceptance check.

The core free workflow passed local production-preview exercise: medication validation, Taken/Held/Unknown states with notes, date boundaries, persistence, local QR, JSON/CSV and AES-GCM export, valid/invalid import, print styling, and offline reload. npm test (2 tests) and npm run build pass. Live HTML, JS, and service-worker bytes match the candidate; live offline reload works. License verification rate limiting began after 30 successful requests and returns 429 with Retry-After: 1.

Do not accept payment for Plus as currently presented. It advertises separate named profiles, but the code has only one fixed IndexedDB record and no profile UI. Other defects are no CSP, missing robots/sitemap/real 404, short-lived rather than immutable hashed-asset caching, and undersized mobile touch targets.

See .factory/verification.md for exact evidence, defects by severity, and remediation. No product code was modified by this verification.
