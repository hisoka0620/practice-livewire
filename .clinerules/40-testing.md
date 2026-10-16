---
paths:
  - "tests/**"
  - "e2e/**"
  - "playwright.config.*"
---

# Testing Rules

## Pest（PHP）
- テストは Pest の書き方に統一する（`it()` / `test()`、`expect()`）。新規に PHPUnit クラス形式を増やさない。
- 新機能には Feature テストを追加する。バグ修正は、まず再現するテストを書き、失敗を確認してから直す。
- DB を使うテストは `RefreshDatabase` と Factory を使う。
- 外部通信は `Http::fake()`、メール・通知・キューは `Mail::fake()` / `Notification::fake()` / `Queue::fake()` で差し替える。
- Livewire は `Livewire::test()` で、認可（他人のタスクに触れないこと）と検証エラーを必ず確認する。
- テストを通すために実装を歪めない。アサーションを弱めない。

## Playwright（TypeScript）
- TypeScript はこの E2E テストでのみ使う。アプリ側のコードを TypeScript 化しない。
- セレクタは role / label / `data-testid` を優先し、CSS クラスや DOM 構造に依存しない。
- 固定の `waitForTimeout` は使わず、要素の状態や Livewire の更新完了を待つ。
- テスト同士の依存をなくし、各テストが自分でデータを用意する。
