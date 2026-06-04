# Practice Livewire

Laravel 12 と Livewire を使用して開発した Todo 管理アプリです。

Livewire のコンポーネント指向開発を活用し、CRUD 操作や検索機能だけでなく、認証・認可・通知機能まで含めた実践的な Web アプリケーションとして開発しました。

---

## アプリ概要

日々のタスクを効率的に管理できる Todo アプリです。

ユーザーごとにタスクを管理でき、優先度や期限による絞り込み、検索機能、期限切れ警告表示などを実装しています。また、期限が近いタスクについては Web Push 通知を送信し、タスクの見落としを防ぐ仕組みを構築しました。

---

## 主な機能

### タスク管理

* タスクの作成・編集・削除（CRUD）
* タスク完了／未完了の切り替え
* 優先度設定（Low / Medium / High）
* 期限（Deadline）の設定
* 期限切れタスクの警告表示
* 期限が近いタスクの可視化

### 検索・フィルタリング

* キーワード検索
* 日本語入力を考慮した検索処理
* 優先度による絞り込み
* 完了状態による絞り込み
* 期限順ソート

### ユーザー管理

* ユーザー登録
* ログイン／ログアウト
* メール認証
* パスワードリセット

### 通知機能

* Web Push 通知
* 期限24時間以内のタスクを検知
* Laravel Scheduler による定期実行
* Queue を利用した非同期通知
* 重複通知防止機能

---

## 技術スタック

### Backend

* PHP 8.2
* Laravel 12
* Livewire 3.7
* Volt
* Laravel Notifications
* Laravel Scheduler
* Laravel Queue

### Frontend

* Blade
* Livewire 3.7
* Alpine.js
* Tailwind CSS
* Vite

### Database

* MySQL 9.6

### Testing

* PHPUnit

---

## 技術的な工夫

### 1. Livewire によるリアクティブUI

Livewire を活用し、ページリロードなしでタスクの作成・編集・検索・フィルタリングを実現しました。

モーダルの表示制御や状態管理も Livewire コンポーネントで実装し、JavaScript の記述量を抑えながらインタラクティブな UI を構築しています。

### 2. Eloquent Scope を利用した検索設計

検索条件やフィルタ条件を Model Scope として実装し、クエリロジックをモデルへ集約しました。

* キーワード検索
* 優先度フィルタ
* 完了状態フィルタ
* 期限ソート

を組み合わせ可能な形で設計しています。

### 3. Policy を利用した認可制御

Task Policy を実装し、

* 編集
* 削除
* 更新

をタスク所有者のみに制限しています。

ユーザー間で他人のタスクを操作できないように設計しています。

### 4. Web Push 通知機能

タスク期限が24時間以内のものを対象として通知を送信します。

実装には以下を利用しています。

* Laravel Notifications （WebPush notifications channel を使用）
* Web Push API
* Service Worker
* Task Scheduling
* Artisan Console
* Queue

通知送信時には通知済みフラグを管理し、重複送信を防止しています。

### 5. テストコードの作成

Web Push 通知機能のfeature testを実装。

* 期限間近のタスクを持つユーザーへのpush通知送信を検証
* 認証ユーザーのpush購読情報の保存を検証

---

## 学習を通じて得た知識・経験

* Laravel による MVC アーキテクチャ設計
* Livewire を利用したコンポーネント開発
* Eloquent ORM を活用したデータ操作
* Policy を用いた認可設計
* Notification・Queue・Scheduler の活用
* Service Worker を利用した Push 通知
* Feature Test による品質担保
* Factory / Seeder を活用した開発環境構築
* Git / GitHub を利用したバージョン管理

---

## セットアップ

### リポジトリをクローン

```bash
git clone https://github.com/hisoka0620/practice-livewire.git
```

### 依存関係をインストール

```bash
composer install
npm install
```

### 環境変数設定

```bash
cp .env.example .env
php artisan key:generate
```

### データベース設定

`.env`

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### マイグレーション・シーダー実行

```bash
php artisan migrate --seed --seeder=UserSeeder
```

### 開発サーバ起動

```bash
composer run dev
```
