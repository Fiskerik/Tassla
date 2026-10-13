# VISION-R02-2 v11 — plan review record

Date: 2026-10-13. This record tracks the exact portrait/week-strip amendment in `vision-rev02-r02-2-v11.md`. V10's data, SQL and mutation reviews remain historical and in force for their unchanged scope.

## Previous v11 review cycle

- Architect first returned **CHANGES**, then approved an intermediate revision. That approval was superseded by later review findings that changed the shared plan/design contract.
- Critic returned **CHANGES** on an intermediate exact revision:
  1. The generic photo-style asset could be mistaken for the named dog's own photo without a public cue. Require the visible `Standardbild` label on public and review Home, while keeping the image decorative and allowing accessibility to announce the visible cue.
  2. Specify the geometry and fade bands exactly and consistently: fade zone `L−16 pt ≤ x ≤ R`; `z=(x−(L−16))/(R−(L−16))`; levels 0.78, 0.56 and 0.38 at the defined one-third bands. Fade only non-current decoration; keep numerals fully opaque with contrast backing and preserve the active marker.
- Architect then returned **CHANGES** on the revision containing those requirements: the Home README still contradicted public/review asset use, and the Standardbild cue needed a solid backing plus ≥4.5:1 text contrast checks at standard and 140% text.
- Critic returned **PROCEED** on the exact revision before the README and label-contrast amendments. That verdict is superseded; re-review the current synchronized revision.

## Current exact plan

**Architect: APPROVE.** Exact current revision approved after the Home README was updated to shared generic AI asset use and the label contract added solid warm backing, ≥4.5:1 at standard and 140% text, and no clipping. The image identity and fade/contrast details remain consistent across plan, canonical design rules, Home spec/prompt, manifest, and queue.

**Critic: PROCEED.** Exact current revision approved after the README and Standardbild contrast amendments. Public/review cue, AI-generated generic role, no clipping, exact fade formula/bands, full-opacity numerals/current marker, and synchronized queue/spec are consistent.

## Implementation and QA

Both exact plan reviews now pass. Do not overwrite correction-v10 evidence. SQL runtime/RLS, scheduler, and midnight behavior remain separate verification items.
