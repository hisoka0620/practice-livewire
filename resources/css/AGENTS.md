# AGENTS.md — `resources/css/` (CSS / Tailwind CSS 4)

Rules for stylesheets under `resources/css/`. Cross-cutting rules (language,
commits, safety) live in the root `AGENTS.md`.

## Structure

- `app.css` — entry point. Keeps the `@import "tailwindcss";` directive
  first, followed by vendor/theme imports
  (`../../vendor/livewire/flux/dist/flux.css`, `./calendar.css`,
  `./flatpickr-theme.css`) and `@source` declarations scanned by Tailwind.
- `calendar.css` — FullCalendar skin, scoped under `#task-calendar`.
- `flatpickr-theme.css` — flatpickr date-input theme.

## Tailwind CSS 4 Conventions

- Use Tailwind 4 syntax: `@theme` for design tokens (fonts, custom colors
  such as `--color-accent`), `@layer` blocks for theme/base additions, and
  `@custom-variant dark (&:where(.dark, .dark *))` for dark-mode variants.
- Prefer theme tokens (`--color-accent`, zinc scale) over hard-coded color
  values in new rules.
- Use `@apply` sparingly, for attribute-driven Flux integration hooks like
  `[data-flux-field]` — not as a replacement for utility classes in Blade.
- Do not add new CSS frameworks, preprocessors, or plugins.

## FullCalendar Skin (`calendar.css`)

- Scope every rule under `#task-calendar` (or `#calendar-container`); never
  restyle FullCalendar globally.
- Control FullCalendar through its CSS custom properties (`--fc-header-height`,
  `--fc-today-bg-color`, ...) instead of blind property overrides on
  vendor class names where possible.
- Breakpoint / size constants must stay in sync with
  `resources/js/calendar/options.js` (e.g. `MOBILE_CALENDAR_MAX_WIDTH = 639`
  matches `@media (max-width: 639px)`). When changing a breakpoint on either
  side, update the counterpart.

## `!important`

**Avoid `!important` whenever possible.** Before adding it, try these in
order:

1. Raise selector specificity (e.g. scope under `#task-calendar` or a
   `[data-*]` attribute) instead of adding `!important`.
2. Use Tailwind utilities in the Blade template, or the `@theme` tokens,
   rather than a new CSS override rule.
3. Check whether `@layer` ordering or a CSS custom property (`--fc-*`,
   `--color-accent`) already lets you win the cascade cleanly.

**If you still need `!important` (including Tailwind's important modifier
`!mb-0`), you must do both:**

- Report the concrete reason to the user in your final response — which
  vendor/library style you are overriding and why no alternative works.
- Add an inline `/* ... */` comment at that line explaining the reason
  (same convention as the `#task-calendar .fc-popover` rules).

**Pre-approved patterns (no need to re-justify):**

- `[x-cloak] { display: none !important; }` — required by Alpine.js.
- Overriding FullCalendar inline styles (`position` / `top` / `left` on
  `.fc-popover`) — FullCalendar writes these as inline styles, so only
  `!important` can beat them.
- Tailwind important modifier to override Flux component defaults
  (`@apply !mb-0`, `!text-green-600`) — verified to emit `!important`
  in the built CSS under Tailwind 4.

**Never** use `!important` merely to silence a conflict without
investigating why the styles collide — fix the root cause instead.

## Verify

- `npm run build` is required after any CSS edit.
