# Med Handoff Card — polish round 5 handoff

## Status

**PASS.** All findings in reviews 1–5 are repaired or reverified with current
evidence. Repair commit `eea16ef98271edd5ea0bcea988bc038b60b7d702` is pushed
to `main` and deployed to <https://med-handoff-card.sociobot.in>.

The release now proves the whole public demo-isolation promise, uses only
“medication,” “current medication list,” and “handoff” in public copy, uses a
non-clinical removal action, covers all three dose states, and generates the
copy audit from checked source strings.

## Run and verify

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
node scripts/live-audit.mjs https://med-handoff-card.sociobot.in .factory/qa-evidence/polish-5/live
```

Open the isolated sample at
<https://med-handoff-card.sociobot.in/?demo=1>. It is a one-click, in-memory
sample with a persistent banner, **Reset demo**, and **Start for real**.

## Exact verification evidence

- Fresh no-local clone of `eea16ef98271edd5ea0bcea988bc038b60b7d702`:
  `npm ci`, all 17 exact commands in `.factory/claims.json` individually,
  `npm test`, `npm run test:type`, `npm run lint`, and `npm run build` passed.
  The full suite passed 3 unit tests and 33 Chromium tests.
- The expanded `@claim:demo-isolation` changes recipient, shift note,
  medication list add/edit/remove, Taken/Held/Unknown states, import, and
  theme; reset/exit then compare the real IndexedDB record as UTF-8 bytes and
  assert that only `demo:` preferences exist.
- Production route verification passed home, direct demo, Privacy, and Terms
  with HTTP 200, a title, `lang=en`, one `h1`, `main`, image alt text, and no
  console errors. See `qa-evidence/polish-5/live/verify-url/`.
- Production live audit passed cold first-screen copy, 390 px layout, one-click
  demo, safe removal wording/history, route focus, 404, same-origin requests,
  both-theme axe, and offline demo reload. See
  `qa-evidence/polish-5/live/live-audit.json` and its screenshots.
- Production Lighthouse mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.8 s, TBT 0 ms, CLS 0. See
  `qa-evidence/polish-5/live/lighthouse-mobile.json`.
- `dist/index.html`, `dist/assets/main-DueSphsR.js`, and `dist/sw.js` match the
  live SHA-256 bytes. The live route matrix was `/` 200, `/demo` 200,
  `/privacy` 200, `/terms` 200, and an unknown URL 404.

The complete finding-to-change-to-evidence matrix is in
`.factory/polish-5.md`.

## Known gaps and next steps

None. The product remains a local-first static PWA; no account, analytics,
third-party runtime code, or new service dependency was introduced.
