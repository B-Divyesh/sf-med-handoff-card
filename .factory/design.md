# Med Handoff Card — visual thesis

## Direction: a dithered bedside print system

Medication handoffs are still commonly made with a pen, a printer, and a phone
passed across a kitchen table. The interface borrows the dependable physical
language of a large-print care chart rather than the soft, glossy language of a
wellness app. Coarse halftone dots, slightly imperfect ink edges, short rules,
and a torn-ticket style date label make the screen feel like a durable shift
sheet. Decoration always explains context: the small illustrated tray is a
quiet signal that this is a record to leave for the next person.

## Palette and tokens

- **Paper** `#f7f0df`: warm uncoated chart paper; app background.
- **Ink** `#142a36`: blue-black text, high contrast on paper (13:1).
- **Faded ink** `#49606a`: secondary information (5.8:1).
- **Cobalt** `#075a9b`: primary action, taken mark, focus (6.9:1 on paper).
- **Marigold** `#f2b84b`: held/attention field with ink text (9.7:1).
- **Rose ink** `#a8334c`: needs-attention/unknown state (5.7:1).
- **Mint stamp** `#d9e9dd`: quiet confirmation surface.
- **Night paper** `#13232c`, **night ink** `#f8f1e1`: intentionally inverted
  low-light view; cobalt becomes `#79c6ff` and marigold becomes `#ffd77b`.

State is communicated by a written label and a distinct symbol in addition to
color: check for taken, pause bars for held, question mark for unknown.

## Type, rhythm, and interaction grammar

`Georgia` supplies the printed-card character for titles and medicine names;
the self-host-free system sans stack (`ui-sans-serif`, Arial) keeps amounts and
instructions crisp. The scale is 14 / 16 / 20 / 25 / 34 / 46px, with tabular
numbers for times and doses. Spacing follows a 4px rhythm; cards use a square
top rule and a 2px offset shadow rather than floating glass.

Large state stamps are direct actions: a press changes one scheduled dose and
immediately exposes an editable note. Records are grouped by time of day,
not by decorative card grids. The current-regimen strip and shift note remain
visible before historical detail. On a phone the schedule becomes one
time-of-day column, and print-oriented controls drop away.

Motion is limited to a 180ms stamp settle (opacity/transform); reduced motion
uses an instant change. Focus is a 3px cobalt offset ring. Both themes are
supported; the app honours system theme and offers a saved manual choice.

The demo uses a flat marigold proof strip above the masthead. It reads like a
temporary chart tab and keeps the sample boundary visible without changing the
board's hierarchy. Its square controls follow the same stamped-paper grammar.

Privacy, Terms, and the missing-page route now use this same masthead, footer,
theme control, paper texture, and stamped actions. On phones, the four-link
navigation becomes a ruled second masthead row instead of disappearing. The
record-deletion area uses a rose offset stamp so the destructive boundary is
clear without introducing a different visual language.

## Original imagery

Art direction: a flat, editorial risograph-like illustration of an unbranded
weekly pill tray, a paper handoff card, and a pencil on warm cream paper;
visible cobalt and marigold halftone overprint, top-down, soft window shadow,
slightly imperfect ink registration. It must contain **no people, text,
watermarks, logos, brands, medical symbols, or prescription labels**.

Asset: `src/assets/handoff-tray.webp`, generated with the factory image model
on 2026-08-28 using `/opt/fleet/lib/gen-image.sh`. Prompt and a JSON sidecar
are stored next to the asset. The source image is original product artwork,
used decoratively with disclosure in the footer. It is optimized to WebP and
must remain under 300 KB.

Social preview: `public/social-card.svg` is a hand-authored 1200 × 630 vector
composition using the same paper, cobalt, marigold, and pill-tray motifs. It is
original product artwork and contains no third-party material.
