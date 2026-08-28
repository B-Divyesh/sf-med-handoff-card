# Med Handoff Card

Track scheduled doses and leave a clear medication handoff for the next family caregiver.

The app records each dose as **Taken**, **Held**, or **Unknown**. It is a caregiver record, not medical advice.

[Try it with sample data](https://med-handoff-card.sociobot.in/demo). The demo is isolated from your real record.

## What it does

- Keeps a current medication list with amounts, directions, and times.
- Records a dose state and optional caregiver note.
- Records medication starts, changes, and stops without hiding prior dose history.
- Prints up to eight ordinary medications on one A4 or Letter page.
- Creates a local QR handoff until you hide it or close the page.
- Works offline after the first visit.
- Stores the real record in IndexedDB in your browser.
- Exports JSON and CSV backups.
- Encrypts an optional JSON backup locally with AES-GCM and your passphrase.

The app uses no analytics or third-party runtime scripts.

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

The production output is `dist/`, with `index.html` at its root. The browser suite covers desktop, 390 px mobile, keyboard use, axe, privacy, claims, offline reload, and service-worker updates.

Run one claim with its ID:

```sh
npm run test:claims -- --grep "@claim:offline-reload"
```

## Data and safety

Medication records stay in this browser unless you print, export, import, or show a QR code. QR handoffs are not encrypted. Encrypted exports cannot be recovered without their passphrase.

See `/privacy` and `/terms` for the full policy. Confirm unclear medication instructions with the prescriber or pharmacist.

## Deploy

This is a static PWA. The factory deploys `dist/` to Azure Static Web Apps with `public/staticwebapp.config.json`.

## License

MIT. See [LICENSE](LICENSE).
