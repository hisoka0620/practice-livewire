---
paths:
  - "app/Livewire/**"
  - "resources/views/livewire/**"
  - "resources/views/components/**"
---

# Livewire Rules

> Prerequisites: Livewire 3.7. Single-file components use Volt. Do not use Livewire 2 patterns (`$listeners`, `emit()`, `wire:model.defer`, etc.).

## Design
- One component, one responsibility. Components should focus on state, events, and rendering.
  - Put query building and filtering in `app/Application/Tasks`.
  - Put validation and persistence in the Form Objects in `app/Livewire/Forms`.
  - Put model-to-UI transformations in `app/Presenters`.
- Name components in PascalCase (e.g., `TaskList`, `TaskModal`).
- Where Volt is used, follow the style of existing Volt components (class-based / function-based).
- Do not write logic inside Blade. Put computed values in `#[Computed]`.
- Use a single root element in a view. Always add `wire:key` to elements inside loops.
- Use Flux UI / WireUI components instead of rebuilding them from scratch. Before using a component or prop that is not already in use, check existing usage examples or the definitions in `vendor/`.

## Security (important)
- Public properties can be tampered with by the client. Consider `#[Locked]` for IDs and always validate values.
- Perform authorization checks by calling `$this->authorize()` inside each action method (not only in `mount()`).
- Validate input in a Form Object (with `#[Validate]`).

## State & Communication
- Use `#[Url]` for URL binding. Check whether query parameters persist or disappear when switching views.
- Receive events with `#[On]`, and narrow the destination on the sender side with `->to(Component::class)`. Avoid broadcasting to everyone.
- Use `wire:model` with its default (deferred) behavior, and use `.live` only when needed. When using `.live`, also use `.debounce`.
- Consider `#[Lazy]` for heavy components.
- Do not keep UI state that does not need a server round trip (open/close, tab switching, etc.) on the server.
- Write tests with `Livewire::test()`.
