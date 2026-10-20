---
paths:
  - "resources/css/**"
  - "resources/js/**"
  - "resources/views/**"
  - "public/sw.js"
---

# Frontend Rules

> Prerequisites: Tailwind CSS 4 / Alpine.js 3.14 / JavaScript (ES6) / Vite. Do not use TypeScript in the application code (only in Playwright tests).

## Priority Order
1. Resolve state- or condition-dependent styling with CSS first.
   Examples: `peer-*` / `group-*` / `has-*` / `data-*` / `aria-*` variants, `:target`, `<details>`, `:focus-within`
2. Write dynamic logic in JS when CSS is not enough. Leave a one-line comment explaining why.
3. Do not inline logic in Blade. Move Alpine logic into components under `resources/js`, and have Blade only call `x-data="componentName(...)"`.

## Tailwind 4
- Do not bring in v3 patterns (`@tailwind` directives, configurations that assume `tailwind.config.js`). Follow the existing CSS entry point and `@theme` conventions.
- Do not build class names dynamically by string concatenation (write the complete class name).
- When overriding the appearance of third-party libraries (FullCalendar, etc.), scope the selectors to that view so other views are unaffected.

## Alpine.js 3.14
- You cannot use `@entangle` in Alpine components defined in external files. Pass `$wire` in from Blade as an argument.
- Do not rewrite reactive values inside `x-effect` (it causes re-render loops).
- With native inputs (e.g., `input[type=month]`), writing `x-model` / `:value` back on every keystroke can break the input buffer. In that case, set the value imperatively with `$refs`.
- Avoid dual management of state by `wire:model` and Alpine; treat one of them as the single source of truth.

## JavaScript (ES6)
- Use ES modules and avoid adding more global variables.
- Debounce or throttle resize and scroll handlers. Remove listeners when they are disposed.
- When changing the Service Worker (`public/sw.js`), check the impact on caching and update behavior (`skipWaiting` / `clients.claim`).

## Accessibility
- Maintain labels, aria attributes, and keyboard operation.
