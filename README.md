# Med Handoff Card

Track scheduled doses and leave a clear medication handoff for the next family caregiver.

The app records each dose as **Taken**, **Held**, or **Unknown**. It is a caregiver record, not medical advice.

[Try it with sample data](https://med-handoff-card.sociobot.in/?demo=1). The demo is isolated from your real record.

## What it does

- Keeps a current medication list with amounts, directions, and times.
- Records a dose state and optional caregiver note.
- Records medication list changes and keeps prior dose history visible.
- Prints the included eight-medication test fixture on one A4 or Letter page.
- Creates a local QR handoff until you hide it or close the page.
- Includes the selected date, current medication list, and dose states in readable QR data.
- Works offline after the first visit.
- Stores your real record in this browser’s local database.
- Exports JSON and CSV backups.
- Encrypts an optional backup in this browser. Its passphrase is required to open it.
- Deletes your real record from the Privacy page.

The app loads no analytics or code from other sites.

## Run and verify

Use Node 20 or newer and Playwright 1.58.2.

```sh
npm ci
npm test
npm run test:type
npm run lint
npm run build
npm run preview
```

The production output is `dist/`, with `index.html` at its root. Run `npm test` to run the browser suite. See [the claim tests](tests/claims.spec.ts) and [quality tests](tests/quality.spec.ts) for exact assertions.

Run one claim with its ID:

```sh
npm run test:claims -- --grep "@claim:offline-reload"
```

## Data and safety

Medication records stay in this browser unless you print, export, import, or show a QR code. Anyone who scans a QR handoff can read it. Encrypted backups cannot be recovered without their passphrase.

Use **Delete this record** on the Privacy page to erase the local medication record. See [Privacy](https://med-handoff-card.sociobot.in/privacy) and [Terms](https://med-handoff-card.sociobot.in/terms) for the full policy.

Confirm unclear medication instructions with the prescriber or pharmacist.

## Technical notes

The app stores real records in IndexedDB. Optional encrypted backups use AES-GCM with a key derived from the supplied passphrase.

## Deploy

This is a static progressive web app. The factory deploys `dist/` to Azure Static Web Apps with `public/staticwebapp.config.json`.

## License

MIT. See [LICENSE](LICENSE).
