---
paths:
  - "app/**/*.php"
  - "routes/**/*.php"
  - "database/**/*.php"
  - "config/**/*.php"
---

# Laravel Rules

> Prerequisites: PHP 8.2+ / Laravel 12. Do not use syntax introduced in PHP 8.3 or later (typed class constants, `#[\Override]`, etc.).

## PHP
- Add types to arguments, return values, and properties. Use `===` for comparisons.
- Use constructor property promotion and named arguments where appropriate.
- Follow the style of surrounding files for new files (e.g., whether `declare(strict_types=1)` is present).
- Represent finite states and types with backed enums in `app/Enums` instead of string constants.

## Structure
- Keep controllers thin. Put validation in Form Requests (Form Objects in Livewire) and business logic in dedicated classes.
- Use Policies for authorization and always call them inside actions. Load user data through a user-scoped relation such as `$user->tasks()`.
- Name routes and avoid hardcoding URLs.
- Use `env()` only inside `config/`. Use `config()` elsewhere in the application.
- Dispatch slow work (mail, notifications, external APIs) to the Queue. Specify `ShouldQueue` and a backoff.

## Eloquent / DB
- Avoid N+1 queries (use `with()` / `load()`). Use `chunkById()` / `lazy()` for bulk processing.
- Declare `$fillable` explicitly. Never use `$guarded = []`.
- Use the `#[Scope]` attribute for scopes, `Attribute::make()` for accessors/mutators, and the `casts()` method for casts.
- Always bind raw SQL parameters (prepared statements); never embed values via string concatenation.
- Treat date range boundaries as exclusive (`>= start` and `< end`). Do not include the end boundary with `whereBetween`.
- Migrations (forward-only):
  - Never edit an already-applied migration; add a new one instead.
  - Add foreign key constraints and indexes. Follow the existing conventions for `down()`.
