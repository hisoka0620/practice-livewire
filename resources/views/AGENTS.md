# AGENTS.md — `resources/views/` (Blade / Flux UI 2)

Rules for Blade templates under `resources/views/`. Cross-cutting rules
(language, commits, safety) live in the root `AGENTS.md`.

## Flux UI 2

- Prefer Flux components (`<flux:...>`) over hand-built markup.
- Never edit files under `vendor/livewire/flux*`. Local overrides live in
  `resources/views/flux/` only.
- `resources/views/livewire/` holds Livewire component templates.

## No Business Logic in Views

- Do not query models or mutate state inside Blade files.
- Avoid `@php` blocks for anything beyond simple presentation helpers.
  Compute values in Livewire components, form objects, or `app/Presenters/`
  mappers (see `app/AGENTS.md`).

## Markup & Styling

- Tailwind CSS 4 is utility-first: style via class names in markup.
  No inline `style=""` attributes and no new CSS frameworks.
- Reusable styling goes into Flux components or `resources/css/`
  (see `resources/css/AGENTS.md`).
- Keep `data-*` attributes and Alpine `x-...` hooks consistent with the JS
  components in `resources/js/` (see `resources/js/AGENTS.md`).

## Livewire Attributes

- `wire:model` is deferred by default; add `.live` (+ debounce) only when
  immediate server sync is required.
- Alpine `@click` / `x-data` may orchestrate UI presentation, but persistence
  goes through Livewire actions — which must authorize inside the action
  method (see `app/AGENTS.md`).

## Verify

- `npm run build` is required after any Blade edit.
