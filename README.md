# Med Handoff Card

Med Handoff Card is a private, offline-first shift record for an adult child or
home caregiver coordinating an older relative’s medication schedule. It makes
the current regimen and every scheduled dose legible at handoff: **Taken**,
**Held**, or **Unknown**.

It is deliberately not a reminder app, interaction checker, refill service, or
source of medical advice. Confirm unclear instructions with the prescriber or
pharmacist.

## What it does

- Keeps a current medication list with dose, directions, and time of day.
- Gives each scheduled dose an unambiguous state and optional caregiver note.
- Prints a concise one-page handoff and makes a local QR handoff for a trusted
  recipient.
- Stores data in IndexedDB on the device; works after the first visit without a
  connection.
- Exports JSON and CSV; an optional JSON export is encrypted locally with a
  passphrase using AES-GCM.
- Includes a $9 one-time Plus unlock for separate named profiles on a shared
  device. Core records, printing, QR handoff, and exports remain free.

## Run locally

Requires Node 20+.

```sh
npm install
npm run dev
```

Open the local URL Vite reports. To make a deployable build:

```sh
npm run build
```

The static deploy output is `dist/` and contains `index.html` at its root.

## Verify

```sh
npm test
npm run build
npm run preview
```

The app has no analytics or third-party runtime scripts. See `/privacy` and
`/terms` in the app for local-data and safety details.

## Data ownership and safety

Medication records are sensitive. They stay in the browser unless you print,
export, import, or deliberately show a QR code. QR data is not encrypted.
Encrypted exports cannot be recovered without their passphrase.

## License

MIT. See [LICENSE](LICENSE).
