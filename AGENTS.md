# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Icons & inline-icon utility (PR3)

UI icons are [`lucide-react`](https://lucide.dev) components — no decorative emoji
in the UI (this includes strings that reach the UI indirectly, e.g.
`performanceTracker.getRatingMessage()`, which feeds the on-key feedback bubbles).
Size/color icons via CSS, not `size=`/`color=` props: `.inline-icon` (in
`src/index.css`) sizes an icon to the surrounding font (`em`) and icons inherit
`currentColor`; per-component `svg` rules (`.control-btn svg`, `.segment svg`,
`.stat-mini svg` in `SongPlayer.css`) do the same inside buttons/chips. Status
tints come from `.icon-success` / `.icon-danger` (App.css). Icons paired with
text get `aria-hidden="true"`; icon-only controls get an `aria-label`. The
header title icon is `Piano` aliased to `PianoIcon` (the name collides with the
`Piano` keyboard component).

## Mode segmented control (SongPlayer.jsx)

Demo/Practice/Challenge is an ARIA **radiogroup** segmented control mirroring
guitar-app's Edit/Play pattern: `MODE_SEGMENTS` at module scope, each segment
`role="radio"` + `aria-checked`, roving `tabIndex` (checked=0, others=-1), and
Arrow keys move selection via `handleSegmentKeyDown`. Changing mode resets the
song and snaps speed back to 1x for practice/challenge (same behavior the old
`<select>` had). Styles are self-contained `.segmented-control`/`.segment` in
`SongPlayer.css` (piano-app has no shared `.btn` system yet — don't compose with
the results-modal `.btn-primary`, which is a different, padded button class).

## Toast instead of alert()

`components/Toast/Toast.jsx` is the in-app replacement for browser `alert()`.
Toast state lives in App (`showToast(message, tone)` where tone is
`default|success|danger`); SongPlayer receives it as the `onNotify` prop for
load/upload errors. The toast is `role="status"`, auto-dismisses after 5s
(timer keyed on the toast object's `id: Date.now()`), and has an explicit
dismiss button. `.toast-stack` is z-index 10000 so it stays visible above the
results modal (z 9999).

## Status-chip color idiom

Difficulty badges and the practice/challenge `.stat-mini` counters are tinted
chips: `color-mix(in srgb, var(--status) 15%, transparent)` background with the
status token as the text/icon color (plus a 45% border on badges). This is
theme-safe in both themes — do not go back to white-on-status solid fills
(white on dark-theme `--success` fails contrast). The "good" state stays
literal blue `#2196f3` by convention (no token maps to it). Uploaded MIDI songs
get `difficulty: 'custom'` → the accent-tinted `.difficulty-badge.custom`.

## Intrinsic-surface exception (MusicStaff)

The "No music notation available" message is injected via `innerHTML` inside
`.music-staff`, the literal-white sheet-music paper, so its color stays literal
ink (`#666`), not a theme token — `var(--text-muted)` would go light-on-white in
dark theme. The sibling loading message renders on a theme surface and does use
`var(--text-muted)`.

## Accessibility conventions (PR4)

- **Piano keys are keyboard-operable buttons** (`PianoKey.jsx`): `role="button"`,
  `aria-label` from the note name (`#` spelled out: "C sharp 4"), Enter/Space
  press/release mirrors mouse down/up (guard `e.repeat`), blur releases a held
  note. Roving tabindex lives in `Piano.jsx`: one key is tabbable
  (`focusedNote`, falls back to the first visible key when the mobile octave
  window shifts), Arrow/Home/End move focus via `handleKeyNavigate` + a
  note→element ref map — same pattern as guitar-app's fret cells and the mode
  segmented control.
- **Focus styling is tokenized**: global `:focus-visible { outline: 2px solid
  var(--accent); outline-offset: 2px }` in `index.css` (never plain `:focus`,
  never browser-default rings). Piano keys use an inset ring
  (`outline-offset: -2px` + `z-index: 3`) so adjacent/overlapping keys don't
  clip it. The MIDI upload input is `.sr-only` (not `display:none`) so it stays
  focusable; the ring shows on the label via `.upload-btn:focus-within`.
- **Live region** (`App.jsx`): one visually-hidden `role="status"
  aria-live="polite"` div announces practice/challenge feedback and results
  (`announcement` state). The on-key feedback bubbles are `aria-hidden` — the
  live region is the single announcement path; include the note name so
  consecutive messages differ and re-fire.
- **Results modal is a real dialog** (`App.jsx`): `role="dialog"`,
  `aria-modal`, `aria-labelledby="results-title"`, a `useEffect` focus trap
  (Tab cycles the dialog's buttons, Escape closes, focus returns to the
  previously focused element on close).
- **Reduced motion**: decorative `animation`s are switched off in a
  `@media (prefers-reduced-motion: reduce) { ... animation: none }` block at
  the end of `Piano.css`/`SongPlayer.css` (Toast.css instead wraps with
  `no-preference` — either idiom is fine; new animations must honor one).
- **On-key feedback bubble** (`.key-feedback`): dark chip
  (`rgba(0,0,0,0.78)`) behind light literal status colors so contrast is
  AA-safe over both white and black key faces (bare status colors on the white
  face failed); a per-rating Lucide icon is the non-color cue.

## Theme system: light theme + persisted toggle (PR5)

Dark is the default (`:root` in `src/styles/tokens.css`); light overrides live
in `[data-theme="light"]` plus a duplicate `@media (prefers-color-scheme:
light)` block scoped to `:root:not([data-theme])` that covers pre-JS paint.
`src/hooks/useTheme.js` (ported from guitar-app, storage key **`piano-theme`**)
sets `data-theme` on `<html>`: a persisted localStorage choice wins, otherwise
the OS preference is followed live. The Sun/Moon toggle is `.theme-toggle-btn`
in the App.jsx header — absolutely positioned top-right (header text is
centered), self-contained styles in App.css since piano has no shared `.btn`
system; same aria-labels as guitar's/chess's toggle.

Intrinsic non-token surfaces stay literal in both themes: piano key faces and
their gradients/labels/feedback colors (Piano.css), sheet-music paper
(MusicStaff.css), the literal-blue "good" chips, and the results-modal /
metronome-pill dark scrims (their contents are a tokenized surface card /
light-toned dots). The count-in overlay is the exception — its token-colored
text sits directly on the scrim, so it uses the themed `--scrim` token (dark:
black veil; light: paper veil).

## Per-song challenge-completion UI (results.songId gate)

The performance-results object now carries **`songId`** (added in
`SongPlayer.jsx`'s `finishSong` alongside `mode`, sourced from
`currentSong.id`). App.jsx's results modal uses it to gate per-song
completion extras: the "Happy Birthday to You" passing challenge shows a
riddle panel gated on
`mode === 'challenge' && passed && songId === 'happy-birthday'`. The riddle's
answer (234) is intentionally NOT surfaced in the UI — there is no reveal
toggle/button/answer render; players solve it themselves. Add other per-song
completion easter eggs the same way — key off `songId`, don't make
the completion dialog branch globally. Passing/threshold logic is unchanged
(`performanceTracker.hasPassed()`, ≥90%).

The riddle panel also shows a **`.padlock-chip`** (SongPlayer.css) — a small
`Lock`-icon pill labelling the physical colored padlock this riddle's answer
opens (a real-world birthday-challenge prop; Happy Birthday = **blue**). It
reuses the status-chip tint idiom but keys off a dedicated **`--padlock-blue`**
token (tokens.css), not a semantic status token, because "padlock blue" isn't
`--success`/`--danger`/etc.; like the status colors it darkens in light theme
(dark `#64b5f6` → light `#0d47a1`) to hold AA on the tint. The color NAME is
real text (icon is `aria-hidden`) so padlock colors are distinguishable without
relying on color alone. Other apps' riddles get their own padlock color the
same way.

=======
## Song note data & verifying melodies

Most built-in songs are **not** MIDI files: each is a hand-coded
`createXxxSong()` function in `src/services/midiParser.js` returning a
`{ note, midi, time, duration, velocity }` array. `src/data/songs.json` only
holds metadata; `SongPlayer.jsx`'s if/else maps `song.midiFile` (a string key,
not a path) to the matching builder. So melody-accuracy bugs in those are fixed
by editing pitches in the `create…` function.

**Exception — Clair de Lune** loads a real public-domain MIDI (Debussy) from
`public/clair-de-lune.mid` through `parseMidiFile()` — the same async path
user-uploaded MIDIs use — because its opening is written in parallel thirds
that can't be safely reduced to one hand-typed melody line. Its `clair-de-lune`
branch in `SongPlayer.jsx` calls `await parseMidiFile('clair-de-lune.mid')`
(relative fetch, mirroring `public/challenge-config.json`); there is no
`createClairDeLuneSong()`. Add real-MIDI songs by dropping the file in
`public/` and pointing a branch at it, not by hand-coding notes.

To dump/verify a song's notes headlessly, stub the top-level
`import { Midi } from '@tonejs/midi'` (the builders don't use it) via a Node
resolve hook, then import the builder and read `.notes`. Example loader/stub in
this branch's history (commit fixing Amazing Grace + Turkish March).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
