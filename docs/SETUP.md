# NullTasker 開発環境セットアップガイド

## 前提条件

- Node.js 14.x以上
- npm 6.x以上

## インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/Team-Nullpo/NullTasker.git
cd NullTasker
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定（オプション）

`.env.example`をコピーして`.env`ファイルを作成します：

```bash
cp .env.example .env
```

環境変数の説明：

- `NODE_ENV` - 実行環境（development/production）
- `PORT` - HTTPポート番号（デフォルト: 3000）
- `HTTPS_PORT` - HTTPSポート番号（デフォルト: 3443）
- `USE_HTTPS` - HTTPS使用の有無（デフォルト: true）
- `JWT_SECRET` - JWT署名用のシークレットキー（本番環境では必須）

### 4. SSL証明書の生成（HTTPS使用時）

開発環境用の自己署名証明書を生成：

```bash
npm run generate-cert
```

詳細は[HTTPS_SETUP.md](docs/HTTPS_SETUP.md)を参照してください。

### 5. データベースの初期化

初回起動時、自動的にSQLiteデータベースが作成されます。
スキーマは`db/schema.sql`で定義されています。

### 6. サーバーの起動

```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

サーバーが起動したら、ブラウザで以下のURLにアクセス：

- HTTP: http://localhost:3000
- HTTPS: https://localhost:3443

## 初回ログイン

デフォルトの管理者アカウント：

- ユーザーID: `admin`
- パスワード: `admin123`

**注意**: 本番環境では必ずパスワードを変更してください。

## ディレクトリ構造

```
NullTasker/
├── config/          # 設定ファイル（自動生成）
├── db/              # データベース関連
├── docs/            # ドキュメント
├── scripts/         # ユーティリティスクリプト
├── src/             # フロントエンドソース
│   ├── pages/       # HTMLページ
│   ├── scripts/     # JavaScriptモジュール
│   └── styles/      # CSSファイル
├── ssl/             # SSL証明書（自動生成）
├── server.js        # メインサーバーファイル
└── package.json     # プロジェクト設定
```

## 開発のヒント

### データベースのリセット

```bash
npm run reset-data
```

### APIテスト

```bash
# 一般APIテスト
npm run test-api

# 管理者APIテスト
npm run test-admin-api
```

### データベース移行

旧JSON形式からSQLiteへの移行：

```bash
npm run migrate
```

詳細は[DATABASE_MIGRATION.md](docs/DATABASE_MIGRATION.md)を参照。

## トラブルシューティング

### ポートが使用中

別のアプリケーションがポートを使用している場合、`.env`ファイルでポート番号を変更してください。

### SSL証明書エラー

開発環境では自己署名証明書を使用しているため、ブラウザが警告を表示します。
「詳細設定」→「安全でないサイトに進む」で続行できます。

### データベースエラー

データベースが破損した場合：

```bash
rm db/nulltasker.db
npm start  # 再起動で自動再作成
```

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて議論してください。

## ライセンス

[LICENSE](LICENSE)を参照してください。
