# SKILLS.md — Design skills used on this project

Four external skills inform the interface work. They are **not vendored into
this repo** (~107MB combined) and are not dependencies — the rules actually
adopted are written down in DESIGN.md, so the project stands without them.
Install them when doing significant design work.

## Install (a Claude session can run this)

```bash
mkdir -p ~/design-skills && cd ~/design-skills
git clone --depth 1 https://github.com/Leonxlnx/taste-skill
git clone --depth 1 https://github.com/emilkowalski/skills
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
git clone --depth 1 https://github.com/pbakaus/impeccable
```

## What each is for

| Skill | Use for | Note |
|---|---|---|
| **impeccable** (pbakaus) | **The one that governs this product.** Its "Operate" mode covers task surfaces — dashboards, tables, app UI. `reference/operate.md` and `reference/craft-floor.md` are the two files worth reading. | Primary |
| **ui-ux-pro-max** (nextlevelbuilder) | Generating and critiquing a token system; anti-pattern validation | Use to critique, not to adopt presets — we stay opinionated |
| **emilkowalski/skills** | Animation and motion craft | Relevant only if motion work is needed; our motion budget is deliberately small |
| **taste-skill** (Leonxlnx) | Landing pages, portfolios, marketing surfaces | **Self-excludes dashboards** — not applicable to the product UI. Useful later for a marketing site |

Also available inside Claude Code without installing: **dataviz** (read before
writing any chart code) and **artifact-design**.

## How they were applied

See DECISIONS.md ADR-013. In short: impeccable's Operate mode set the posture,
its craft floor caught a real contrast failure (3.0:1) and unthemed browser
surfaces, and the dataviz procedure decided that win rate should not be a chart.
Where a skill's default conflicted with the founder's pinned references, the
brief won — that is the skills' own rule.
