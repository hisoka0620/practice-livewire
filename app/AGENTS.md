# AGENTS.md — `app/` (PHP / Laravel 12 / Livewire 3 / Pest 4)

Rules for all PHP code under `app/`. Cross-cutting rules (language, commits,
safety) live in the root `AGENTS.md`.

## PHP Version Constraint

- PHP 8.2 syntax only. Do NOT use PHP 8.3/8.4-only features, e.g.:

  - Typed class constants (PHP 8.3+)
  - `#[\Override]` attribute (PHP 8.3+)

- Run `vendor/bin/pint --dirty` after editing any PHP file (Laravel preset).

## Layers & Responsibilities

- **`app/Application/Tasks/`**: Business logic & query building only
  (`TaskQuery`, `TaskFilters`, `TaskActions`). Never put query or mutation
  logic inside Livewire components — components orchestrate, application
  classes execute.
- **`app/Livewire/` & `app/Livewire/Forms/`**: UI orchestration.
  Form validation/persistence belongs in form objects (e.g. `TaskForm`),
  not in component properties or inline actions.
- **`app/Presenters/`**: Data mappers that convert models/DTOs for the UI
  (e.g. `TaskCalendarEventMapper`). No presentation formatting logic inside
  Livewire components.
- **`app/Enums/`**: Backed enums for status, priority, filter, and view
  states. Do not use bare string/int constants for these values.
- **`app/Policies/`**: Authorization. Enforce via `TaskPolicy`; never bypass
  it in favor of hand-written conditions.

## Scoping & Authorization

- Strictly scope all task operations to the authenticated user
  (`$user->tasks()`), never against global `Task` query builders.
- Always authorize inside the action method itself, not only in `mount()`.
  Any wire action can invoke a component method independently.

## Livewire 3 Conventions

- `wire:model` is deferred by default. Use `.live` + debounce only when
  immediate server sync is really required (e.g. `updatedFilters()`).
- Target Livewire events with `->to(Component::class)`, not magic strings.
- Public properties (including `#[Modelable]` arrays) must remain
  serializable; keep only UI state there.

## Deadline Semantics

- Changing a task deadline must reset `deadline_notified_at` (to `null`) so
  the reminder notification is neither missed nor duplicated.

## Verify

- After changes, run the affected tests:

  ```sh
  ./vendor/bin/pest tests/Feature/Livewire/TaskListTest.php
  ```

  Run the whole suite (`./vendor/bin/pest`) before finalizing a unit.
- See `tests/AGENTS.md` for test conventions.
