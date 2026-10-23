# AGENTS.md

## Project Overview & Tech Stack

Personal Todo application with calendar view & web push notifications.

- **Backend:** PHP 8.2+, Laravel 12, Livewire 3.7 (Volt), Pest 4
- **Frontend:** Flux UI 2, Tailwind CSS 4, Alpine.js 3.14, Vite 7, FullCalendar 6
- **Database/Queue:** MySQL (dev/prod), SQLite `:memory:` (Pest testing), `e2e.sqlite` (E2E testing), Database Queue

---

## Token & Context Optimization Rules

- **Do not read heavy or generated files:** Avoid reading `/vendor/`, `/node_modules/`, `/storage/`, `/public/build/`, build outputs, or SQLite database files (`*.sqlite`) to save context and tokens.
- **Targeted search only:** When searching for files, narrow down to specific layers (e.g., `app/Application/Tasks/`, `app/Livewire/`, `resources/js/`) instead of scanning the entire repository.

---

## Core Guidelines for AI Agents

1. **Language & Communication**
    - User-facing responses and explanations must be in **Japanese**.
    - Code identifiers, commit messages, code comments, and documentation must be in **English**.

2. **Design Philosophy**
    - Make minimal, focused, and surgical changes. Do not refactor unrelated code.
    - Do not introduce new architectural layers, packages, or JS frameworks unless explicitly requested.
    - Strictly scope all task operations to the authenticated user (`$user->tasks()`) and enforce `TaskPolicy`.

3. **Architecture & File Mapping**
    - **`app/Application/Tasks/`**: Business logic & query building (`TaskQuery`, `TaskFilters`, `TaskActions`). _Never put query/mutation logic directly inside Livewire components._
    - **`app/Livewire/` & `app/Livewire/Forms/`**: UI orchestration and form request validation/persistence (`TaskForm`).
    - **`app/Presenters/`**: Data mappers for UI (e.g., `TaskCalendarEventMapper`).
    - **`app/Enums/`**: Backed enums for status, priority, filter, and view states.
    - **`resources/js/`**: Alpine components registered in `app.js` during `livewire:init` and FullCalendar modules.

---

## Commands & Workflow

### Development

- **Full Dev Stack:** `composer run dev` (starts Artisan serve, queue listener, Pail, and Vite)
- **Code Formatting:** `vendor/bin/pint --dirty` (run before finalizing changes)
- **Command Discipline:** Prefer one command per shell invocation. Chained commands (`&&`, `;`) are permission-checked segment by segment, so routine allowlisted commands prompt for approval when combined with others. Prefer dedicated tools (`read`, `grep`, `glob`) over `cat`/`grep`/`find` in the shell.

### Testing & Build

- **PHP Unit/Feature Tests:** `./vendor/bin/pest` (or `./vendor/bin/pest tests/Feature/Livewire/TaskListTest.php`)
- **Frontend Build:** `npm run build` (required check after any Blade/JS/CSS edits)
- **JS Unit Tests (Calendar):** `npm run test:unit:calendar` (_Forces `TZ=America/Los_Angeles`_)
- **E2E Tests:** `npm run test:e2e -- tests/e2e/<spec>.spec.ts` (Playwright runs server on port 8017 using `database/e2e.sqlite`)

---

## Setup Gotchas & Important Rules

- **Flux UI Dependency:** Paid package via `composer.fluxui.dev`. Do not attempt to modify auth/installation configs manually if it fails.
- **Web Push / VAPID:** Managed via `php artisan webpush:vapid`. Never print, read, or commit `.env` or VAPID private keys.
- **Timezone Pinning:** Calendar unit tests and E2E tests pin timezone to `America/Los_Angeles`. Do not change test expectations to local timezones.
- **Database Scope in Tests:** Pest uses SQLite `:memory:` (`QUEUE_CONNECTION=sync`).
- **Livewire 3 Specifics:**
    - `wire:model` is deferred by default; use `.live` + debounce only when immediate server sync is required.
    - Target Livewire events using `->to(Component::class)`.
    - Always authorize actions inside action methods, not just `mount()`.
- **Deadline Semantics:** Changing a task deadline must reset `deadline_notified_at` to prevent missing/duplicate notifications.

---

## Safety & Prohibited Actions

- ❌ **DO NOT** run destructive commands (`migrate:fresh`, `migrate:reset`, `db:wipe`, `git reset --hard`) without explicit user permission.
- ❌ **DO NOT** commit `.env` files, credentials, or secret keys.
- ❌ **DO NOT** use PHP 8.3/8.4-only syntax (e.g., typed class constants, `#[\Override]`), as the project targets PHP 8.2+.
