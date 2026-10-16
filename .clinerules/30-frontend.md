---
paths:
  - "resources/css/**"
  - "resources/js/**"
  - "resources/views/**"
  - "public/sw.js"
---

# Frontend Rules

> 前提: Tailwind CSS 4 / Alpine.js 3.14 / JavaScript（ES6）/ Vite。TypeScript はアプリ側では使わない（Playwright のテストのみ）。

## 優先順位
1. 表示切替や状態に応じたスタイルは、まず CSS で解決する。
   例: `peer-*` / `group-*` / `has-*` / `data-*` / `aria-*` バリアント、`:target`、`<details>`、`:focus-within`
2. CSS で足りない動的ロジックは JS に書く。理由が分かるよう、1行コメントを残す。
3. Blade には、ロジックをインラインで書かない。Alpine のロジックは `resources/js` のコンポーネントに切り出し、Blade 側は `x-data="componentName(...)"` で呼び出すだけにする。

## Tailwind 4
- v3 の書き方（`@tailwind` ディレクティブ、`tailwind.config.js` 前提の設定）を持ち込まない。既存の CSS エントリと `@theme` の書き方に合わせる。
- クラス名を文字列連結で動的に組み立てない（完全なクラス名を書く）。
- 外部ライブラリ（FullCalendar など）の見た目の上書きは、ビュー固有のセレクタに限定して、他のビューに影響させない。

## Alpine.js 3.14
- 外部ファイルの Alpine コンポーネントでは `@entangle` を使えない。`$wire` を Blade から引数で渡す。
- `x-effect` の中でリアクティブな値を書き換えない（再描画ループの原因になる）。
- ネイティブ入力（`input[type=month]` など）では、`x-model` / `:value` のキー入力ごとの書き戻しが入力バッファを壊すことがある。その場合は `$refs` で値を命令的に設定する。
- Livewire との同期は、`wire:model` と Alpine の二重管理を避け、どちらか一方を状態の正とする。

## JavaScript（ES6）
- ES modules を使い、グローバルに変数を増やさない。
- リサイズやスクロールのハンドラは debounce / throttle する。付けたリスナーは破棄時に解除する。
- Service Worker（`public/sw.js`）を変更したときは、キャッシュ・更新の挙動（`skipWaiting` / `clients.claim`）への影響を確認する。

## アクセシビリティ
- label・aria 属性・キーボード操作を維持する。
