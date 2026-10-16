# Project: Practice Livewire（常時適用）

Laravel 12 の TODO / タスク管理アプリ。Livewire 3.7 + Volt、Flux UI、FullCalendar、Flatpickr、Laravel WebPush。

## 層の役割（コードを書く場所）
| 場所 | 役割 |
|---|---|
| `app/Models` | Eloquent モデル。リレーションとローカルスコープのみ |
| `app/Application/Tasks` | UI に依存しないクエリ組み立て・フィルタ（`TaskQuery`、`TaskFilters`）。入力の正規化もここ |
| `app/Livewire` | リクエスト状態・イベント処理・描画（`TaskList`、`TaskModal` など） |
| `app/Livewire/Forms` | タスク操作の検証と永続化（Form Object） |
| `app/Presenters` | モデルを UI 向けの形に変換（例: カレンダーイベント） |
| `app/Enums` | 有限状態（`TaskPriority`、`TaskStatusFilter`、`TaskView`） |
| `app/Policies` | 認可（`TaskPolicy`） |
| `resources/views` | Flux を使った Blade |
| `resources/js` | カスタム Alpine コンポーネントと初期化処理 |
| `public/sw.js` | Web Push 用の Service Worker |

## 守ること
- クエリ組み立てを Livewire コンポーネントの中に書かない。`app/Application/Tasks` に置く。
- 検証・保存のロジックを Livewire コンポーネントに直接書かない。Form Object に置く。
- 表示用の整形をモデルや Blade に書かない。Presenter に置く。
- タスクの取得は、必ず `$user->tasks()` などユーザー経由のスコープで行い、`TaskPolicy` で認可する。
- 新しい状態種別・優先度は enum に追加し、文字列リテラルで済ませない。
- Livewire イベントは `->to(Component::class)` で宛先を絞り、受け側は `#[On]` を使う。
- マイグレーションは前進のみ。適用済みのファイルは編集しない。
- 日付範囲は終端排他（FullCalendar の `end` に合わせる）。

## コマンド
- 整形: `vendor/bin/pint --dirty`
- PHP テスト: `./vendor/bin/pest`（`--filter=` で絞る）
- E2E: `npm run test:e2e`
- ビルド: `npm run build`

## 変更のたびに確認する
- Policy / スコープを経由していて、他ユーザーのデータが見えない。
- 新規・変更した振る舞いに Pest のテストがある。
- UI を変えた場合、`npm run build` が通る。
