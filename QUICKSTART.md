# 🚀 NullTasker React - クイックスタート

## 前提条件

- Node.js 14.0.0 以上
- npm または yarn

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

#### オプション A: 全て同時に起動（推奨）

```bash
npm run dev
```

このコマンドで以下が同時に起動します：

- **フロントエンド（React + Vite）**: http://localhost:5173
- **バックエンド（Express）**: http://localhost:3000

#### オプション B: 個別に起動

```bash
# ターミナル 1: フロントエンド
npm run dev:client

# ターミナル 2: バックエンド
npm run dev:server
```

### 3. ブラウザでアクセス

http://localhost:5173 を開きます

### 4. ログイン

デフォルトの管理者アカウント:

- **ログイン ID**: `admin`
- **パスワード**: `admin123`

## 📁 プロジェクト構造

```
client/src/
├── main.tsx          # エントリーポイント
├── App.tsx           # ルートコンポーネント
├── components/       # 共通コンポーネント
├── contexts/         # React Context
├── pages/            # ページコンポーネント
├── services/         # API通信
└── styles/           # CSS

shared/types/         # 共有型定義
server.js             # バックエンドサーバー
config/               # データファイル
```

## 🛠️ 開発コマンド

```bash
# 開発サーバー起動
npm run dev              # フロント + バック同時起動
npm run dev:client       # フロントのみ
npm run dev:server       # バックのみ

# ビルド
npm run build            # 本番用ビルド

# その他
npm run generate-cert    # SSL証明書生成
npm run reset            # データリセット
```

## 🎯 実装状況

- ✅ 認証システム（ログイン・登録）
- ✅ ルーティング
- ✅ API 通信層
- 🚧 ダッシュボード（進行中）
- 📅 タスク管理（予定）
- 📅 ガントチャート（予定）
- 📅 カレンダー（予定）

詳細は `IMPLEMENTATION_STATUS.md` を参照してください。

## ⚠️ トラブルシューティング

### ポート競合エラー

```bash
# 使用中のポートを確認
lsof -i :5173  # フロントエンド
lsof -i :3000  # バックエンド
```

### 依存関係エラー

```bash
# クリーンインストール
rm -rf node_modules package-lock.json
npm install
```

## 📚 ドキュメント

- [実装状況](./IMPLEMENTATION_STATUS.md) - 詳細な実装状況
- [移行ガイド](./MIGRATION.md) - 移行の詳細手順
- [README.md](./README.md) - プロジェクト概要

---

Happy Coding! 🎉
