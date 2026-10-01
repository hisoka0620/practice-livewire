# Copilot instructions for Practice Livewire

## Project overview

This is a personal Todo application built with **PHP 8.2+**, **Laravel 12**, **Livewire 3**, **Volt**, **Flux UI**, **Blade**, **Alpine.js 3**, **Tailwind CSS 4**, and **Vite**. It supports per-user task CRUD, search and filters, deadline/calendar views, and web-push deadline reminders.

Prefer small, focused changes that follow the patterns already present in the surrounding code. Do not introduce a new architectural layer, dependency, or JavaScript framework unless the task clearly requires it.

## Source of truth and project conventions

- Check nearby code, tests, route definitions, migrations, and `composer.json`/`package.json` before proposing an API or behavior.
- Preserve the existing public behavior and URL query parameters unless a change is explicitly requested.
- Use English for identifiers, class names, methods, and commit-style messages. User-facing copy should follow the language and tone already used in the relevant view (currently mostly Japanese).
- Follow Laravel Pint formatting. Do not manually edit generated files, `vendor/`, `node_modules/`, build output, or lockfiles unless dependency changes require it.

## Application structure

- Keep Eloquent persistence, casts, relationships, and reusable query scopes in `app/Models`.
- Keep typed, UI-independent task query/filter behavior in `app/Application/Tasks`:
  - `TaskFilters` normalizes Livewire input into enums.
  - `TaskQuery` builds user-scoped task queries and aggregate queries.
  - `TaskActions` performs task mutations that are shared outside a form.
- Keep request/UI state, event handling, and rendering orchestration in `app/Livewire`. Put create/update validation and form persistence in Livewire Form objects under `app/Livewire/Forms`.
- Use backed enums in `app/Enums` for finite UI/domain states instead of duplicating string literals.
- Keep Blade markup in `resources/views`, and put non-trivial browser behavior in the appropriate module under `resources/js`. Register Alpine components during `livewire:init` as done in `resources/js/app.js`.

## Laravel, Eloquent, and authorization

- Use strict parameter and return types for new PHP code where Laravel conventions allow them. Prefer constructor property promotion and `readonly` DTO-style objects where they improve clarity.
- Use Eloquent relationships and local scopes for composable queries. Scope every task query through the authenticated user (for example, `$user->tasks()`) before looking up or mutating a task.
- Enforce ownership with `TaskPolicy`/Laravel authorization for every task read or mutation that accepts a task ID or model. Never trust a client-supplied `user_id`, and never make `user_id` mass assignable.
- Validate all Livewire input server-side. Use the existing `TaskForm` pattern for task create/update rules; do not rely on HTML validation alone.
- Add a migration for every schema change. Keep migrations forward-only and compatible with a fresh database. Update factories, casts, fillable fields, and tests when a model attribute changes.
- Preserve deadline reminder semantics: when a deadline changes, reset `deadline_notified_at`; do not send duplicate notifications. Queue/scheduler changes must be safe to retry.
- Avoid N+1 queries; eager-load relationships when a view or notification iterates over related models.

## Livewire and Alpine.js

- Use Livewire 3 syntax and attributes such as `#[On]`, `#[Url]`, `#[Validate]`, and `#[Modelable]` when they fit the existing component style.
- In Livewire 3, plain `wire:model` is deferred. Use `wire:model.live` only when the UI genuinely needs immediate server synchronization, and debounce high-frequency inputs such as search.
- Use targeted Livewire events (`->to(Component::class)`) when the receiver is known. After a mutation, refresh every affected component state (task list, calendar, counters) through the established events.
- Use Alpine.js 3 directives and `$wire` for Livewire interaction. Do not introduce legacy Livewire interop such as `@this`.
- When a third-party DOM library manages an element (for example FullCalendar or Flatpickr), isolate it with `wire:ignore` as appropriate and synchronize through explicit events. Clean up listeners/instances when the component is reinitialized.
- Escape user-provided values in Blade with `{{ }}`. If rendering intentionally generated HTML, keep sanitization/escaping in one audited helper and document why the output is safe.

## Frontend and accessibility

- Reuse existing Blade components, Flux components, Tailwind utilities, and the established visual language before creating new components or custom CSS.
- Keep UI controls keyboard-accessible: use semantic elements, visible focus states, labels for inputs, and accessible names for icon-only buttons. Modals must support Escape and restore sensible focus behavior.
- Keep responsive behavior intact for both the list and calendar views. Avoid inline scripts and styles unless a local component convention already uses them.

## Tests and verification

- Use Pest for new tests. Place browser-independent domain/query behavior in `tests/Unit` and authenticated Livewire, routes, notifications, policies, and persistence behavior in `tests/Feature`.
- For each behavior change, cover the happy path and relevant edge cases. For task features, always consider cross-user access, validation, empty/invalid filter values, completion state, and deadline boundaries.
- Use `RefreshDatabase` for tests that persist models. Create data with factories and keep time-dependent tests deterministic with Laravel time helpers.
- Before completing a change, run the narrowest relevant test first, then run the full suite when practical:

  ```bash
  ./vendor/bin/pest
  vendor/bin/pint --dirty
  npm run build
  ```

- Do not change production code merely to make a test pass without confirming that the resulting behavior is intended.

## Security and configuration

- Keep secrets, VAPID keys, credentials, and `.env` files out of source control. Read configuration through `config()`/environment-backed config, not `env()` in application code.
- Preserve CSRF protection and authenticated route middleware. Treat push subscriptions and user-provided search text as untrusted input.
- Do not weaken authorization, validation, queue retry safety, or tests to simplify an implementation. Explain any necessary trade-off in the pull request or response.
