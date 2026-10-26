# AGENTS.md — `resources/js/` (JavaScript: Alpine.js / FullCalendar / Vite)

Rules for JavaScript under `resources/js/`. Cross-cutting rules (language,
commits, safety) live in the root `AGENTS.md`.

## Structure & Registration

- Plain ES modules (no TypeScript, no build-time transpilation of project
  files). Styling imports (e.g. tippy.js CSS) also live here.
- Alpine components are registered in `app.js` inside a
  `document.addEventListener("livewire:init", ...)` hook so they exist
  before Livewire starts. Register new Alpine components the same way:
  `window.Alpine.data("<name>", ...)`.
- FullCalendar logic lives in `resources/js/calendar/` as small cohesive
  modules (`options.js`, `layout.js`, `date-utils.js`, `event-utils.js`,
  `loading-state.js`, `commit-hook.js`).

## Testability & Timezone

- Extract calendar date/event logic into pure functions in
  `calendar/date-utils.js` and `calendar/event-utils.js` rather than
  burying it in the Alpine component classes — they are unit-tested.
- Unit tests run with Node's built-in test runner:
  `npm run test:unit:calendar` executes `tests/Unit/JavaScript/calendar-*.test.js`
  with `TZ=America/Los_Angeles` forced by the npm script. Never change the
  timezone or test expectations to a local timezone (see `tests/AGENTS.md`).

## Code Style

Match the existing style; it is enforced by convention, not by a linter:

- 4-space indentation.
- Double quotes for strings.
- Semicolons and trailing commas on multi-line lists.
- Named `export` per module; default `export` only for the Alpine
  component objects.

## Constraints

- Keep the CSS/JS breakpoint split in sync with
  `resources/css/calendar.css` (e.g. `MOBILE_CALENDAR_MAX_WIDTH = 639`
  matches `@media (max-width: 639px)`).
- Do not introduce new JS frameworks or UI libraries (root `AGENTS.md`).
- Do not read or modify FullCalendar/Alpine internals under `node_modules/`.

## Verify

- `npm run build` is required after any JS edit.
- Run `npm run test:unit:calendar` when calendar logic changed.
