# AGENTS.md — `tests/` (Pest 4 / Playwright)

Rules for tests under `tests/`. Cross-cutting rules (language, commits,
safety) live in the root `AGENTS.md`.

## Layout & Naming

- `tests/Feature/...` mirrors the target code layout (`Livewire/`,
  `Application/`, `Auth/`, `Settings/`, ...). Follow the mirror when adding
  tests, e.g. a new class in `app/Application/Tasks/` gets
  `tests/Feature/Application/Tasks/<Name>Test.php` or its equivalent.
- `tests/Unit/...` holds pure logic tests (Enums, Presenters, Support,
  Application). `tests/Unit/JavaScript/` holds Node unit tests that run
  outside Pest (`calendar-*.test.js` via `npm run test:unit:calendar`).
- Files end with `*Test.php`; only `timestamp` failures aside, never rename
  existing test methods without reason.
- Feature tests get `Tests\TestCase` via `uses(TestCase::class)->in('Feature')`
  in `tests/Pest.php`. Unit tests that need Laravel bootstrap must opt in
  explicitly.

## Environment (already configured, do not override)

Configured in `phpunit.xml` — never weaken these:

- SQLite `:memory:` (`DB_CONNECTION` / `DB_DATABASE`)
- `QUEUE_CONNECTION=sync`
- Array cache/session/mail drivers, `PULSE_ENABLED`/`TELESCOPE_ENABLED` false

## Timezone Pinning

- Calendar logic is pinned to `America/Los_Angeles` (JS unit tests force
  `TZ` via the npm script; E2E runs the server in that TZ).
- Never change pinned tests or their expectations to fit a local timezone.
  Fix the code, not the expectation — or discuss with the user before
  touching the pins.

## E2E (Playwright)

- Specs live in `tests/e2e/`. Run one spec:
  `npm run test:e2e -- tests/e2e/<spec>.spec.ts`
- Playwright serves the app on port **8017** using `database/e2e.sqlite`
  (never `database.sqlite` / MySQL data).
- `pretest:e2e` runs `npm run build` automatically. Running E2E requires
  explicit user approval in this project.
- Playwright selectors target Flux/Livewire markup; prefer stable roles and
  `data-*` attributes over generated class names.

## Failure Discipline

- If a test fails because of your change, fix the change (or the smallest
  relevant code path). Do not weaken or delete assertions just to get green.
- If a test fails but you did not cause it, report it to the user instead
  of "fixing" unrelated code.
- Run tests with `QUEUE_CONNECTION=sync` implicit (already configured);
  do not spin up real queue workers in tests.
