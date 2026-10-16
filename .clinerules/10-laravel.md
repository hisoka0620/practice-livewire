---
paths:
  - "app/**/*.php"
  - "routes/**/*.php"
  - "database/**/*.php"
  - "config/**/*.php"
---

# Laravel Rules

> 前提: PHP 8.2+ / Laravel 12。8.3 以降の構文（型付きクラス定数、`#[\Override]` など）は使わない。

## PHP
- 引数・戻り値・プロパティに型を付ける。比較は `===` を使う。
- コンストラクタのプロパティ昇格と Named Arguments を適宜使う。
- 新規ファイルは周辺ファイルの書き方（`declare(strict_types=1)` の有無など）に合わせる。
- 有限の状態・種別は文字列定数ではなく、`app/Enums` の backed enum で表す。

## 構成
- Controller は薄く保つ。検証は Form Request（Livewire では Form Object）、業務ロジックは専用クラスに置く。
- 認可は Policy を使い、アクション内で必ず呼ぶ。ユーザーのデータは `$user->tasks()` のようにユーザー経由のスコープで取得する。
- ルートには名前を付け、URL のハードコードを避ける。
- `env()` は `config/` 内でのみ使う。アプリ側は `config()` を使う。
- 時間のかかる処理（メール・通知・外部API）は Queue に流す。`ShouldQueue` と backoff を指定する。

## Eloquent / DB
- N+1 を避ける（`with()` / `load()`）。大量処理は `chunkById()` / `lazy()` を使う。
- `$fillable` を明示する。`$guarded = []` は使わない。
- スコープは `#[Scope]` 属性、アクセサ/ミューテータは `Attribute::make()`、キャストは `casts()` メソッドを使う。
- 生SQLは必ずバインディング（prepared statement）を使い、文字列連結で値を埋め込まない。
- 日付範囲の絞り込みは、終端を排他的に扱う（`>= start` かつ `< end`）。`whereBetween` で終端を含めない。
- マイグレーション（前進のみ）:
  - 適用済みのマイグレーションは編集せず、新規で追加する。
  - 外部キー制約とインデックスを付ける。`down()` は既存の流儀に合わせる。
