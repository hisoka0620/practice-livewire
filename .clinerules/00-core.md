# Core Rules（常時適用）

## 基本方針
- 会話・説明は日本語。コード中の識別子・コメントは既存コードの流儀に合わせる。
- 変更前に必ず関連ファイルを読む。存在確認なしに、メソッド・パッケージ・設定キー・コンポーネントの props を推測で書かない（`composer.json` / `package.json` / `grep` / `php artisan route:list` 等で確認）。
- 依頼範囲外のリファクタ・整形・依存追加はしない。気づいた点は実装せず、最後に提案として書く。
- 1回の変更は小さく保つ。複数ファイルにまたがる作業は、Plan モードで計画を出し、承認後に Act で実行する。
- 仕様が曖昧で実装が分岐する場合のみ質問する。それ以外は仮定を明記して進める。

## コンテキスト節約（無料枠対策）
- 大きなファイルは全文を読まず、検索で必要箇所だけ読む。
- `vendor/` `node_modules/` `storage/` `public/build/` `bootstrap/cache/` `test-results/` `playwright-report/` は読まない・検索しない。
- 同じファイルを繰り返し読まない。ログは末尾のみ確認する。
- 前置き・復唱・長い要約は不要。結果と変更点だけ簡潔に報告する。

## 安全
- 次のコマンドは、事前にユーザーの確認なしで実行しない:
  `migrate:fresh` `migrate:reset` `db:wipe` `rm -rf` `git reset --hard` `git push --force` `composer update`（全体）`npm update`（全体）
- `.env` や認証情報・秘密鍵（VAPID 秘密鍵を含む）は、読まない・出力しない・コミットしない。
- 本番環境のDB・APIには接続しない。
- 破壊的な操作の前は、影響範囲を説明して確認を取る。

## 完了条件
- PHP を変更した場合:
  - `./vendor/bin/pest --filter=...` で関連テストを実行する。
  - `vendor/bin/pint --dirty` で整形する。
- UI（Blade / JS / CSS）を変更した場合:
  - `npm run build` が通ることを確認する。
  - 関連する E2E だけを `npm run test:e2e -- <spec>` で実行する（全件は時間がかかるため、依頼時のみ）。
- テストが失敗したら実装を直す。テストの削除・skip・アサーションの弱体化で通さない。
- 最後に「変更ファイル一覧」と「確認方法」を報告する。
