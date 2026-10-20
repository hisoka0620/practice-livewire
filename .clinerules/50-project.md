# Project: Practice Livewire (always applied)

A TODO / task management application on Laravel 12. Livewire 3.7 + Volt, Flux UI, FullCalendar, Flatpickr, Laravel WebPush.

## Layer Responsibilities (where to write code)
| Location | Responsibility |
|---|---|
| `app/Models` | Eloquent models. Relationships and local scopes only |
| `app/Application/Tasks` | UI-independent query building and filtering (`TaskQuery`, `TaskFilters`). Input normalization also lives here |
| `app/Livewire` | Request state, event handling, and rendering (e.g., `TaskList`, `TaskModal`) |
| `app/Livewire/Forms` | Validation and persistence for task operations (Form Objects) |
| `app/Presenters` | Transform models into UI-ready shapes (e.g., calendar events) |
| `app/Enums` | Finite states (`TaskPriority`, `TaskStatusFilter`, `TaskView`) |
| `app/Policies` | Authorization (`TaskPolicy`) |
| `resources/views` | Blade views using Flux |
| `resources/js` | Custom Alpine components and initialization |
| `public/sw.js` | Service Worker for Web Push |

## Rules to Follow
- Never build queries inside Livewire components. Put them in `app/Application/Tasks`.
- Never write validation or persistence logic directly in Livewire components. Put them in Form Objects.
- Never write presentation formatting in models or Blade. Put it in Presenters.
- Always load tasks through a user-scoped relation such as `$user->tasks()`, and authorize them with `TaskPolicy`.
- Add new status kinds and priorities to the enums instead of using string literals.
- Narrow Livewire event destinations with `->to(Component::class)`, and receive them with `#[On]`.
- Migrations are forward-only. Never edit an already-applied migration.
- Date ranges are end-exclusive (aligned with FullCalendar's `end`).

## Commands
- Format: `vendor/bin/pint --dirty`
- PHP tests: `./vendor/bin/pest` (narrow with `--filter=`)
- E2E: `npm run test:e2e`
- Build: `npm run build`

## Check on Every Change
- Data goes through a Policy / scope, and other users' data is never visible.
- New or changed behavior has a Pest test.
- When the UI is changed, `npm run build` passes.
