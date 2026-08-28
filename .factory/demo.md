# Demo sandbox

- URL: `https://med-handoff-card.sociobot.in/demo` (local: `http://127.0.0.1:4173/demo`). `/?demo=1` is also supported.
- One click: choose **Try it with sample data** on the empty first screen.
- Sample: Nora Ellis has Metformin, Lisinopril, and Vitamin D3. Today includes Taken and Held dose records plus a shift note.
- Isolation: demo data is created in memory. Demo actions never open or write the real `med-handoff-card` IndexedDB database.
- Reset: **Reset demo** rebuilds the original sample. Reloading does the same.
- Exit: **Start for real** opens the real record. The demo is discarded instead of copied.
- Offline: after one online demo visit establishes service-worker control, `/demo` reloads with the full sample while offline.
