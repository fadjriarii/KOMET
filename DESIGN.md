# Design Direction

This file is the design direction `antislop` reads before any UI work. It is a
pointer to the existing system, not a new style guide.

## Source of truth

- Palette and font tokens: `apps/client/src/index.css` (`@theme` block,
  `digital-blue` scale, `--font-terminal`).
- Primitives: `apps/client/src/components/common/ui/` (`Button`, `Input`,
  `Select`, `CheckboxSelect`, `Badge`).
- Charts: `apps/client/src/components/common/charts/`.

## Rules

- Reuse an existing primitive or token before adding a new one. Never introduce
  a second palette, font, or radius scale.
- Keep the layout dense and dashboard-like: KOMET is an analytics tool, not a
  marketing site. No hero sections, no decorative gradients, no oversized
  headings.
- UI copy is Indonesian. Numbers, periods, and academic years use the existing
  formatters from `@komet/shared`.
- `antislop` is a filter, not a beautifier. Do not invent a new art direction
  and do not rewrite unrelated screens.
- If a screen genuinely needs a new pattern, add it to `components/common/ui/`
  first and reuse it on the second screen, not inline in the module.
