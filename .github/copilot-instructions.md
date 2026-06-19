# プロジェクトの前提条件と技術スタック

このプロジェクトのコードを生成、修正、または提案する際は、必ず以下のバージョンおよび仕様を厳格に遵守してください。

## 必須技術とバージョン
- **Alpine.js**: v3.14.9
- **Laravel Livewire**: v3.7

## コード生成のルール
1. **Livewire v3の標準構文を使用する**:
   - `wire:model` はデフォルトで遅延評価（Livewire v2の `wire:model.defer` 相当）になります。リアルタイム同期が必要な場合のみ `wire:model.live` を使用してください。
   - コンポーネントのプロパティやメソッドへのアクセスは、Livewire v3のベストプラクティスに従ってください。
   - `wire:click` などのアクションも、v3で推奨される記述（`wire:click="save"` など）を使用してください。

2. **Alpine.js v3の標準構文を使用する**:
   - `x-data`, `x-init`, `x-show`, `x-on` などのディレクティブは、すべてAlpine.js v3の仕様に準拠してください。
   - マジックプロパティ（`$el`, `$refs`, `$dispatch`, `$watch` など）を適切に活用してください。

3. **LivewireとAlpine.jsの連携（最重要）**:
   - Livewireコンポーネント内でAlpine.jsを組み合わせる場合は、互換性トラブルを防ぐため、必ずAlpine.jsの `$wire` マジックプロパティ（例: `$wire.get('propertyName')`, `$wire.methodName()`）を使用してください。
   - バージョンが古い記述（`@this` など）は原則として使用せず、Livewire v3 / Alpine.js v3 の最新の連携方法を優先してください。
