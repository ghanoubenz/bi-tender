# DESIGN.md — The design system

The rules the product's interface follows. Distilled from the design skills
(see SKILLS.md) plus decisions made and verified on this codebase, so the
knowledge survives whether or not the skills are installed.

**Mode: Operate.** The user is doing a job. Familiarity is a feature; the tool
should disappear into the task. Scanability, consistency and native
expectations outrank expression. Brand lives in precise details.

## Tokens — the single source

All colour, type and depth live in `apps/platform/src/app/(frontend)/styles.css`.
**Never hardcode a hex value in a component.**

| Group | Tokens |
|---|---|
| Surfaces | `--color-page` (tinted ground behind the app window), `--color-surface`, `--color-canvas`, `--color-raised`, `--color-chrome` (sidebar), `--color-border`, `--color-border-strong` |
| Ink | `--color-ink`, `--color-ink-soft`, `--color-ink-faint` |
| Accent | `--color-accent`, `--color-accent-hover`, `--color-accent-soft`, `--color-accent-ink` |
| Status | `--color-positive`, `--color-caution`, `--color-critical`, each with a `-soft` background |
| Depth | `--shadow-card`, `--shadow-raised`, `--shadow-window` |

**Contrast is computed, not judged.** Every ink and status colour measures at
least 4.5:1 on both `--color-surface` and `--color-canvas`. `--color-ink-faint`
was once 3.0:1 and failed; it is now 4.97:1. If you change a colour, measure it.

## Rules

**Colour is restrained.** The accent marks primary actions, current selection
and state — never decoration. Status colours are reserved for good / caution /
critical and are never reused as a series colour. **Colour never carries
meaning alone**: a status dot always sits beside its label.

**One committed surface per view.** Exactly one filled accent element anchors a
screen — the hero deadline card on the dashboard, the first stat card in a row.
A second one competes rather than anchors.

**Type.** One family (Inter). Fixed rem scale, tight ratio. Body 13–14px,
headings 15–22px. `.tnum` on any column of digits.

**Depth.** Shadows carry a real offset *and* a soft blur. A zero-offset
coloured halo is decoration, not depth.

**Icons are drawn.** `src/components/icons.tsx` — 16px grid, 1.5 stroke, round
caps, `currentColor`. Never emoji, never a mixed icon set.

**Browser surfaces are ours too.** Text selection, focus rings, scrollbars and
tabular numerals are themed from the palette. This is the cheapest signal that
a page was built rather than assembled, and the one most often skipped.

**Motion conveys state, never decoration.** 150–250ms (`.transition-ui`).
No page-load choreography — users load into a task.

**Every component ships its states**: default, hover, focus, disabled, loading,
error, empty. Empty states teach the interface; they never say "nothing here".

## Charts

Follow the procedure: pick the form from the data's job, and *ask whether it
should be a chart at all*.

- **Pipeline by stage** is one series → one hue, no legend, ordered by pipeline
  stage and never re-sorted by size, values direct-labelled instead of an axis.
- **Win rate is deliberately not a chart.** Over a handful of decided tenders a
  donut dramatises noise. It ships as a stat tile.
- Never a dual-axis chart. Categorical hues are assigned in fixed order, never
  cycled. Any categorical palette must be validated for colour-blind separation
  before shipping — currently none exists, because nothing needs one.

## Honesty in the interface

This is a product rule, not a style rule, and it outranks appearance.

- **A readiness bar is drawn only where requirements were actually assessed.**
  An empty track reads as a broken progress bar and implies zero readiness —
  a different claim from "nobody has checked". Those rows say so in words.
- No trend chips (+4.9% style) until real historical data exists to make them
  true. Context lines state what is known: "$20.0M in play", "1 won of 2 decided".
- Unbuilt features are shown, labelled `soon`, never hidden and never faked.

## Layout

The application sits in a **rounded window floating on a tinted page**
(`(app)/layout.tsx`), which frames it as a product rather than a web page.
Left sidebar rather than top navigation — the destination count grows past what
a top bar holds.

## Shared primitives — use them, don't re-write markup

`src/components/ui.tsx`: `Card`, `CardHeader`, `Badge`, `StatusDot`,
`StatCard`, `EmptyState`, `ComingSoon`, `DataTable`, `Row`, `Cell`,
`PageHeading`. Every list screen is built from these, so consistency holds by
construction. `tenders/page.tsx` is the reference implementation.

## Refuse

Gradient text · glass and blur as decoration · coloured left-borders above 1px ·
zero-blur block shadows · emoji as icons · sparklines standing in for content ·
purple "AI" styling · nested cards · a modal where inline would do.
