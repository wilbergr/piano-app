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
