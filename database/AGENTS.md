# AGENTS.md — `database/` (Migrations / Factories / Seeders)

Rules for schema and data under `database/`. Cross-cutting rules (language,
commits, safety) live in the root `AGENTS.md`.

## Migrations

- Schema changes are **new migration files only**. Do not edit migrations
  that are already committed (`users`, `cache`, `jobs` foundations and every
  `*_tasks_*` / `push_subscriptions` migration).
- Follow the additive tail pattern used by this repo
  (`add_priority_to_tasks_table`, `add_deadline_to_tasks_table`,
  `add_deadline_notified_at_to_tasks_table`): one concern per migration,
  anonymous class, `change()` or explicit `up()`/`down()`.
- A deadline-related schema change must not skip
  `deadline_notified_at` semantics (see `app/AGENTS.md`).
- Choose column types that work on both MySQL (dev/prod) and SQLite (tests,
  e2e.sqlite): prefer portable types (`text`, `string`, `timestamp`,
  `decimal`); avoid MySQL-only column options.

## Safety

- ❌ Destructive operations (`migrate:fresh`, `migrate:reset`, `db:wipe`)
  are **ask-gated** in `opencode.jsonc` — never run them without explicit
  user permission (root `AGENTS.md`).
- Never read or commit `*.sqlite` files (`database.sqlite`, `e2e.sqlite`).
- Do not edit `e2e.sqlite` contents manually; E2E expects the schema Playwright
  migrations create (port 8017 server).

## Factories

- Factory definitions use faker random values as defaults
  (`TaskFactory`, `UserFactory`). Tests that depend on specific values must
  override them explicitly (`->create(['title' => '...'])`) — do not
  hard-code deterministic assumptions into factory defaults.
- Keep states minimal; add a factory state only when several tests share
  the same shape.

## Seeders

- Seeders are for local development data only; tests must not rely on
  seeders.
