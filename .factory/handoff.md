# Med Handoff Card — review 4 handoff

## Status

**FAIL.** This was a read-only adversarial review; product code was not
modified. Two minor findings remain in `.factory/review-4.md`:

- F-4-1: demo Bedtime says “No current medications at this time” despite three
  current medications.
- F-4-2: Open Graph/Twitter previews use an SVG instead of a reliably
  shareable PNG/JPEG.

## Verification

- Cold live checks at 390 × 844 and 1440 × 900 clearly showed the job, user,
  and one-click first action.
- The filled Nora Ellis demo, reset, exit, privacy boundary, same-origin
  requests, and offline behavior passed.
- A clean clone at `/tmp/mhc-review-4.BCEr0J` completed `npm ci`, all 17
  declared claim commands, `npm test`, and `npm run build`; `dist/` exists.
- Live routes, 404, metadata text, focus/Back behavior, shared chrome, links,
  CSP, no console errors, no off-origin requests, accessibility coverage, and
  all findings from reviews 1–3 were rechecked.

## How to verify

```sh
npm ci
npm run test:claims
npm test
npm run build
```

Open `https://med-handoff-card.sociobot.in/?demo=1` and inspect Bedtime. Check
the live `og:image` and `twitter:image` tags.

## Next steps

Replace the Bedtime copy and add its regression test. Generate a self-hosted
1200 × 630 PNG/JPEG social card, update the metadata tags, test its response
type, then repeat review 4.
