---
paths:
  - "app/Livewire/**"
  - "resources/views/livewire/**"
  - "resources/views/components/**"
---

# Livewire Rules

> 前提: Livewire 3.7。単一ファイルコンポーネントは Volt。Livewire 2 の書き方（`$listeners`、`emit()`、`wire:model.defer` など）は使わない。

## 設計
- 1コンポーネント1責務。コンポーネントは状態・イベント・描画に専念させる。
  - クエリ組み立て・フィルタは `app/Application/Tasks` に置く。
  - 検証と永続化は `app/Livewire/Forms` の Form Object に置く。
  - モデルから UI 向けの形への変換は `app/Presenters` に置く。
- コンポーネント名は PascalCase（例: `TaskList`、`TaskModal`）。
- Volt を使う箇所は、既存の Volt コンポーネントの書き方（クラス型 / 関数型）に合わせる。
- Blade の中にロジックを書かない。計算は `#[Computed]` に置く。
- ビューのルート要素は1つにする。ループ内の要素には必ず `wire:key` を付ける。
- UI は Flux UI / WireUI のコンポーネントを使い、自作で作り直さない。既存で使われていないコンポーネントや props を使う前に、既存の使用例か `vendor/` の定義を確認する。

## セキュリティ（重要）
- public プロパティはクライアントから改ざんできる。ID などは `#[Locked]` を検討し、値は必ず検証する。
- 認可チェックは、各アクションメソッドの中で `$this->authorize()` を呼んで行う（mount だけで済ませない）。
- 入力検証は Form Object（`#[Validate]`）で行う。

## 状態・通信
- URL連動は `#[Url]` を使う。ビュー切替時にクエリパラメータが残る/消えるかを確認する。
- イベントは `#[On]` で受け、送信側は `->to(Component::class)` で宛先を絞る。全体ブロードキャストは避ける。
- `wire:model` は既定（遅延送信）を基本とし、`.live` は必要な場合のみ使う。使う場合は `.debounce` を併用する。
- 重いコンポーネントは `#[Lazy]` を検討する。
- サーバ往復が不要な UI 状態（開閉・タブ切替など）はサーバに持たせない。
- テストは `Livewire::test()` で書く。
