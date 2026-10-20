---
paths:
  - "tests/**"
  - "tests/e2e/**"
  - "playwright.config.*"
---

# Testing Rules

## Pest (PHP)
- Keep tests consistent with the Pest style (`it()` / `test()`, `expect()`). Do not add new PHPUnit class-style tests.
- Add a Feature test for every new feature. For a bug fix, first write a reproducing test and confirm that it fails, then fix it.
- Use `RefreshDatabase` and factories for tests that touch the database.
- Fake external HTTP with `Http::fake()`, and mail, notifications, and queues with `Mail::fake()` / `Notification::fake()` / `Queue::fake()`.
- For Livewire, use `Livewire::test()` and always verify authorization (that other users' tasks cannot be touched) and validation errors.
- Do not distort the implementation to make tests pass. Do not weaken assertions.

## Playwright (TypeScript)
- Use TypeScript only in these E2E tests. Do not convert application code to TypeScript.
- Prefer role / label / `data-testid` selectors, and avoid depending on CSS classes or DOM structure.
- Do not use fixed `waitForTimeout`; wait for element state or for the Livewire update to complete.
- Remove dependencies between tests; each test should prepare its own data.
