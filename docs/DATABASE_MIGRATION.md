# データベース移行ガイド

このドキュメントは、NullTaskerをJSON形式からSQLiteデータベースに移行する手順を説明します。

## 📋 概要

NullTasker v1.1.0では、データストレージをJSONファイルからSQLiteデータベースに移行しました。

### 移行の利点

✅ **データの整合性**: 外部キー制約によるデータ整合性の保証  
✅ **パフォーマンス**: インデックスによる高速な検索・集計  
✅ **並行処理**: WALモードによる読み書き同時実行  
✅ **トランザクション**: ACID特性による一貫性保証  
✅ **スケーラビリティ**: 大量データの効率的な管理

## 🚀 移行手順

### 1. 既存データのバックアップ（推奨）

```bash
# JSONファイルのバックアップは自動で作成されます
# 念のため手動バックアップも推奨
cp -r config config-backup-$(date +%Y%m%d)
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. データベースへの移行

#### 方法A: 既存データを移行

```bash
# JSONデータをSQLiteに移行
npm run migrate
```

このコマンドは以下を実行します:
- 既存データベースのバックアップ作成
- 新しいデータベースの作成とスキーマ初期化
- users.json, projects.json, tickets.json, settings.json からのデータインポート

#### 方法B: クリーンインストール

```bash
# 新規データベースを作成（初期データのみ）
npm run reset
```

このコマンドは以下を実行します:
- 新規データベースの作成
- 管理者アカウント（admin/admin123）の作成
- デフォルトプロジェクトの作成
- 初期設定の適用

### 4. サーバーの起動

```bash
npm start
```

### 5. 動作確認

1. ブラウザで `https://localhost:3443` にアクセス
2. 管理者アカウントでログイン（admin/admin123）
3. データが正しく移行されているか確認

## 📊 データベース構造

### テーブル一覧

- **users**: ユーザー情報
- **projects**: プロジェクト情報
- **project_members**: プロジェクトとユーザーの多対多リレーション
- **tasks**: タスク情報
- **settings**: システム設定

詳細なスキーマは `db/schema.sql` を参照してください。

## 🛠️ トラブルシューティング

### マイグレーションが失敗する

```bash
# データベースファイルを削除して再試行
rm -rf db/nulltasker.db*
npm run migrate
```

### 既存データが見つからない

JSONファイルが `config/` ディレクトリに存在することを確認してください:
- `config/users.json`
- `config/projects.json`
- `config/tickets.json`
- `config/settings.json`

### データベースが破損した場合

```bash
# バックアップから復元
cp db/backups/nulltasker.backup-YYYYMMDD-HHMMSS.db db/nulltasker.db

# または完全リセット
npm run reset -- --clean
```

## 🔄 ロールバック手順

万が一、旧バージョンに戻す必要がある場合:

```bash
# 1. 旧サーバーファイルを復元
cp server-json-backup.js server.js

# 2. JSONファイルを復元
cp -r config/json-backup/* config/

# 3. サーバー再起動
npm start
```

## 📝 npm コマンド一覧

### データベース関連

```bash
npm run migrate          # JSONからSQLiteへ移行
npm run reset            # データベースを初期状態にリセット
npm run reset:users      # ユーザーデータのみリセット
npm run reset:tasks      # タスクデータのみリセット
npm run reset:settings   # 設定データのみリセット
npm run reset:projects   # プロジェクトデータのみリセット
```

### オプション

```bash
node scripts/reset-data.js --clean      # データベースを完全に再作成
node scripts/reset-data.js --no-backup  # バックアップなしで実行
node scripts/reset-data.js --help       # ヘルプ表示
```

## 🔍 データベースツール

### SQLiteデータベースの直接操作

```bash
# SQLiteコマンドラインツールでデータベースを開く
sqlite3 db/nulltasker.db

# よく使うコマンド
.tables                 # テーブル一覧
.schema users           # usersテーブルのスキーマ表示
SELECT * FROM users;    # 全ユーザー表示
.quit                   # 終了
```

### VS Code拡張機能

SQLite Viewer拡張機能をインストールすると、VSCode内でデータベースを閲覧できます:
- 拡張機能ID: `alexcvzz.vscode-sqlite`

## 📚 関連ドキュメント

- [README.md](../README.md) - メインドキュメント
- [RESET.md](RESET.md) - データリセットガイド
- [db/schema.sql](../db/schema.sql) - データベーススキーマ定義
- [db/database.js](../db/database.js) - データベース管理クラス

## 🆘 サポート

問題が発生した場合:
1. [GitHub Issues](https://github.com/Team-Nullpo/NullTasker/issues) で既存の問題を検索
2. 新しいIssueを作成して問題を報告
3. エラーメッセージとログを添付

---

**移行作業に関する注意事項:**
- 移行中はサーバーを停止してください
- バックアップは自動的に作成されますが、重要なデータは手動でもバックアップすることを推奨します
- 移行後、旧JSONファイルは `config/json-backup/` に保管されます
