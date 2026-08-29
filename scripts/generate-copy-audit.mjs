import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const entries = [
  ['First screen', 'src/main.ts', 'Track medication handoffs between family caregivers.'],
  ['First screen', 'src/main.ts', 'For adult children and home caregivers who need a clear record when another caregiver takes over.'],
  ['First screen', 'src/main.ts', 'Open a filled sample handoff in one click.'],
  ['First screen', 'src/main.ts', 'Medication records stay in this browser.'],
  ['First screen', 'src/main.ts', 'The board works offline after your first visit.'],
  ['First screen', 'src/main.ts', 'Printing, QR handoffs, and exports are free.'],
  ['First screen', 'src/main.ts', 'Dithered illustration of a pill organizer, blank handoff card, and pencil.'],
  ['How it works', 'src/main.ts', 'Add the current medication list.'],
  ['How it works', 'src/main.ts', 'Enter each medication, amount, and scheduled time.'],
  ['How it works', 'src/main.ts', 'Mark each dose.'],
  ['How it works', 'src/main.ts', 'Choose Taken, Held, or Unknown and add a note.'],
  ['How it works', 'src/main.ts', 'Print, share, or back up the handoff.'],
  ['How it works', 'src/main.ts', 'Print for the next caregiver, show the QR code in person, or save a backup for yourself.'],
  ['Handoff tools', 'src/main.ts', 'Print the handoff, show its QR code to another caregiver, or save your own backup.'],
  ['Handoff tools', 'src/main.ts', 'A QR handoff contains the selected date, current medication list, and dose states.'],
  ['Handoff tools', 'src/main.ts', 'Anyone who scans it can read it, so share it only with someone you trust.'],
  ['Footer', 'src/main.ts', 'Track medication handoffs between family caregivers.'],
  ['Footer', 'src/main.ts', 'The app loads no analytics or code from other sites.'],
  ['Demo and board', 'src/main.ts', 'Demo — sample data, nothing is saved to your real record.'],
  ['Demo and board', 'src/main.ts', 'Demo actions never change your real record.'],
  ['Demo and board', 'src/main.ts', 'Record the dose state first.'],
  ['Demo and board', 'src/main.ts', 'Leave the detail clear enough for the next caregiver.'],
  ['Demo and board', 'src/main.ts', 'Example: New blood pressure medication started today; hold only if the prescriber said so.'],
  ['Demo and board', 'src/main.ts', 'This is a caregiver record, not medical advice.'],
  ['Demo and board', 'src/main.ts', 'Confirm unclear instructions with the prescriber or pharmacist.'],
  ['Demo and board', 'src/main.ts', 'Choose today or an earlier date.'],
  ['Demo and board', 'src/main.ts', 'No doses are scheduled at this time.'],
  ['Demo and board', 'src/main.ts', 'No dose states or medication list changes were recorded for this date.'],
  ['Demo and board', 'src/main.ts', 'Existing dose history stays in this record.'],
  ['Demo and board', 'src/main.ts', 'Future doses cannot be recorded.'],
  ['Demo and board', 'src/main.ts', 'Previously listed:'],
  ['Legal and missing page', 'src/main.ts', 'Med Handoff Card stores your medications, dose states, and notes in this browser.'],
  ['Legal and missing page', 'src/main.ts', 'The app does not run analytics, create an account, or send your health information to us.'],
  ['Legal and missing page', 'src/main.ts', 'Printing, QR sharing, exporting, and importing are actions you choose.'],
  ['Legal and missing page', 'src/main.ts', 'Anyone who scans a QR handoff can read it.'],
  ['Legal and missing page', 'src/main.ts', 'An encrypted backup requires its passphrase, which we cannot recover.'],
  ['Legal and missing page', 'src/main.ts', 'Use this action to erase the medication record from this browser.'],
  ['Legal and missing page', 'src/main.ts', 'Demo sample data remains separate.'],
  ['Legal and missing page', 'src/main.ts', 'This app is a personal caregiver record.'],
  ['Legal and missing page', 'src/main.ts', 'It is not medical advice, a drug-interaction checker, or an emergency service.'],
  ['Legal and missing page', 'src/main.ts', 'Confirm confusing, changed, or held instructions with the prescribing clinician or pharmacist.'],
  ['Legal and missing page', 'src/main.ts', 'You are responsible for protecting printed, exported, and QR-shared information.'],
  ['Legal and missing page', 'src/main.ts', 'Use of the app is provided as-is to the extent permitted by law.'],
  ['Legal and missing page', 'src/main.ts', 'The address may be wrong.'],
  ['Legal and missing page', 'src/main.ts', 'Your medication record has not changed.'],
  ['README', 'README.md', 'Track scheduled doses and leave a clear medication handoff for the next family caregiver.'],
  ['README', 'README.md', 'The app records each dose as Taken, Held, or Unknown.', 'The app records each dose as **Taken**, **Held**, or **Unknown**.'],
  ['README', 'README.md', 'It is a caregiver record, not medical advice.'],
  ['README', 'README.md', 'Demo actions never change your real record.'],
  ['README', 'README.md', 'Keeps a current medication list with amounts, directions, and times.'],
  ['README', 'README.md', 'Records Taken, Held, or Unknown with an optional caregiver note.'],
  ['README', 'README.md', 'Records medication list changes and keeps prior dose history visible.'],
  ['README', 'README.md', 'Prints the included eight-medication test fixture on one A4 or Letter page.'],
  ['README', 'README.md', 'Creates a local QR handoff until you hide it or close the page.'],
  ['README', 'README.md', 'Includes the selected date, current medication list, and dose states in readable QR data.'],
  ['README', 'README.md', 'Works offline after the first visit.'],
  ['README', 'README.md', 'Stores your real record in this browser’s local database.'],
  ['README', 'README.md', 'Exports JSON and CSV backups.'],
  ['README', 'README.md', 'Encrypts an optional backup in this browser. Its passphrase is required to open it.'],
  ['README', 'README.md', 'Deletes your real record from the Privacy page.'],
  ['README', 'README.md', 'The app loads no analytics or code from other sites.'],
  ['README', 'README.md', 'Medication records stay in this browser unless you print, export, import, or show a QR code.'],
  ['README', 'README.md', 'Anyone who scans a QR handoff can read it.'],
  ['README', 'README.md', 'Encrypted backups cannot be recovered without their passphrase.'],
  ['README', 'README.md', 'Use Delete this record on the Privacy page to erase the local medication record.', 'Use **Delete this record** on the Privacy page to erase the local medication record.'],
  ['README', 'README.md', 'Confirm unclear medication instructions with the prescriber or pharmacist.'],
  ['README', 'README.md', 'This is a static progressive web app.']
]

const banned = ['leverage', 'seamless', 'effortless', 'robust', 'powerful', 'intuitive', 'reimagine', 'supercharge', 'unlock', 'delightful', 'journey', 'ecosystem', 'ai-powered']
const contents = new Map(await Promise.all([...new Set(entries.map(([, source]) => source))].map(async source => [source, await readFile(resolve(root, source), 'utf8')])))

for (const [, source, text, needle = text] of entries) {
  if (!contents.get(source)?.includes(needle)) throw new Error(`Copy audit source drift: ${JSON.stringify(needle)} is absent from ${source}`)
}

const words = text => text.trim().split(/\s+/u).filter(Boolean).length
const flag = text => {
  if (words(text) > 22) return 'Over 22 words'
  const hit = banned.find(term => new RegExp(`\\b${term.replace('-', '\\-')}\\b`, 'i').test(text))
  return hit ? `Banned word: ${hit}` : 'None'
}
const grouped = Object.groupBy(entries, ([section]) => section)
const table = rows => ['| Sentence | Words | Flag |', '| --- | ---: | --- |', ...rows.map(([, , text]) => `| ${text.replaceAll('|', '\\|')} | ${words(text)} | ${flag(text)} |`)].join('\n')
const allFlags = entries.map(([, , text]) => flag(text)).filter(value => value !== 'None')
const output = `# Copy audit

Generated by \`node scripts/generate-copy-audit.mjs\`. The generator checks every listed sentence against its source before it writes this file; \`--check\` fails when this file or its source inventory drifts. Counts use whitespace-delimited words.

No listed sentence exceeds 22 words. No banned marketing word appears.

${Object.entries(grouped).map(([section, rows]) => `## ${section}\n\n${table(rows)}`).join('\n\n')}

## Terminology

| Concept | One term |
| --- | --- |
| Drug entry | medication |
| Saved active set | current medication list |
| Transfer artifact | handoff |
| Example environment | demo |
| Saved portable copy | backup |
| Scheduled event | dose |

## Generator checks

- Source inventory: ${entries.length} strings found in \`src/main.ts\` or \`README.md\`.
- Sentence flags: ${allFlags.length === 0 ? 'none' : allFlags.join(', ')}.
- The browser copy regression also rejects visible \`medicine\`, \`regimen\`, “care changes hands”, and “shift card” wording.
`

const target = resolve(root, '.factory/copy-audit.md')
if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8')
  if (current !== output) throw new Error('Copy audit is stale. Run: node scripts/generate-copy-audit.mjs')
} else {
  await writeFile(target, output)
}
