# Demo sandbox

- URL: `https://med-handoff-card.sociobot.in/?demo=1` (local: `http://127.0.0.1:4173/?demo=1`). `/demo` is also supported.
- One click: choose **Try it with sample data** on the empty first screen. The link opens `/?demo=1` directly.
- Sample: Nora Ellis has Metformin, Lisinopril, and Vitamin D3. Today includes Taken and Held dose records, a shift note, and no bedtime dose.
- Isolation: demo data is created in memory. Changing the recipient, note, medication list, dose states, backup import, or view never writes the real record. Its appearance preference uses the separate `demo:mhc_theme` localStorage key; real mode uses `mhc_theme`.
- Reset: **Reset demo** rebuilds the original sample. Reloading does the same.
- Exit: **Start for real** opens the real record. The demo is discarded instead of copied.
- Offline: after one online demo visit establishes service-worker control, `/demo` reloads with the full sample while offline.
