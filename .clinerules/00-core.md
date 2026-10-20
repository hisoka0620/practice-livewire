# Core Rules (always applied)

## Basic Policy
- Speak and explain in Japanese. Follow the conventions of the existing code for identifiers and comments.
- Always read the related files before making changes. Never guess methods, packages, config keys, or component props without verifying their existence (check `composer.json` / `package.json` / `grep` / `php artisan route:list`, etc.).
- Do not refactor, reformat, or add dependencies outside the scope of the request. Do not implement incidental findings; write them up as suggestions at the end.
- Keep each change small. For work spanning multiple files, present a plan in Plan mode, and execute it in Act mode only after approval.
- Ask questions only when the specification is ambiguous and the implementation would branch. Otherwise, proceed while stating your assumptions.

## Context Conservation (to save quota)
- Do not read large files in full; use search to read only the relevant parts.
- Do not read or search `vendor/` `node_modules/` `storage/` `public/build/` `bootstrap/cache/` `test-results/` `playwright-report/`.
- Do not re-read the same file repeatedly. Check only the tail of logs.
- No preamble, repetition, or long summaries. Report only the results and the changes, concisely.

## Safety
- Never run the following commands without prior user confirmation:
  `migrate:fresh` `migrate:reset` `db:wipe` `rm -rf` `git reset --hard` `git push --force` full `composer update` full `npm update`
- Never read, print, or commit `.env` files, credentials, or secret keys (including the VAPID private key).
- Never connect to production databases or APIs.
- Before any destructive operation, explain the scope of impact and get confirmation.

## Commit Messages
- When committing, follow Conventional Commits. Keep the first line under 50 characters, leave a blank line, and wrap the body at 72 characters. Focus on the "Why" and "What", not listing every single technical detail.

## Completion Criteria
- When PHP is changed:
  - Run the related tests with `./vendor/bin/pest --filter=...`.
  - Format the code with `vendor/bin/pint --dirty`.
- When UI (Blade / JS / CSS) is changed:
  - Verify that `npm run build` succeeds.
  - Run only the related E2E specs with `npm run test:e2e -- <spec>` (the full suite takes long, so run it only when requested).
- If a test fails, fix the implementation. Never make a test pass by deleting or skipping it, or by weakening assertions.
- Finally, report the "List of changed files" and "How to verify".
