# NullTasker React - 移行ガイド

## 📋 概要

このプロジェクトは、Vanilla JavaScript から TypeScript + React 環境への段階的な移行を行っています。

## 🏗️ 新しいプロジェクト構造

```
NullTasker_React/
├── client/                    # Reactフロントエンド
│   ├── index.html            # メインHTMLファイル
│   ├── public/               # 静的ファイル
│   └── src/
│       ├── main.tsx          # エントリーポイント
│       ├── App.tsx           # ルートコンポーネント
│       ├── vite-env.d.ts     # Vite型定義
│       ├── components/       # 再利用可能なコンポーネント
│       │   └── ProtectedRoute.tsx
│       ├── contexts/         # Reactコンテキスト
│       │   └── AuthContext.tsx
│       ├── pages/            # ページコンポーネント
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── TaskPage.tsx
│       │   ├── GanttPage.tsx
│       │   ├── CalendarPage.tsx
│       │   ├── SettingsPage.tsx
│       │   ├── UserProfilePage.tsx
│       │   └── AdminPage.tsx
│       ├── services/         # APIサービス層
│       │   ├── apiClient.ts
│       │   └── authService.ts
│       ├── hooks/            # カスタムフック
│       └── styles/           # スタイルシート
│           ├── index.css
│           └── login.css
├── server/                   # Expressバックエンド（今後移行）
├── shared/                   # クライアント・サーバー間の共有コード
│   └── types/
│       └── index.ts          # TypeScript型定義
├── config/                   # 設定・データファイル
├── scripts/                  # ユーティリティスクリプト
├── package.json
├── tsconfig.json             # TypeScript設定
├── tsconfig.node.json        # Node.js用TypeScript設定
└── vite.config.ts            # Vite設定
```

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. SSL 証明書の生成（初回のみ）

```bash
npm run generate-cert
```

### 3. 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時に起動
npm run dev
```

これにより、以下が起動します：

- **フロントエンド（Vite）**: http://localhost:5173
- **バックエンド（Express）**: http://localhost:3000

フロントエンドは `/api` へのリクエストを自動的にバックエンドにプロキシします。

### 個別に起動する場合

```bash
# フロントエンドのみ
npm run dev:client

# バックエンドのみ
npm run dev:server
```

## 🏗️ ビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## 📝 移行状況

### ✅ 完了

- [x] TypeScript + React 環境の初期設定
- [x] プロジェクト構造の再編成
- [x] 共通型定義ファイルの作成
- [x] 認証システムの React 化
  - [x] AuthContext
  - [x] ProtectedRoute
  - [x] LoginPage
  - [x] RegisterPage
- [x] API サービス層の作成
  - [x] apiClient (Axios)
  - [x] authService

### 🚧 進行中

- [ ] ページコンポーネントの実装
  - [ ] DashboardPage
  - [ ] TaskPage
  - [ ] GanttPage
  - [ ] CalendarPage
  - [ ] SettingsPage
  - [ ] UserProfilePage
  - [ ] AdminPage

### 📅 今後の予定

- [ ] 既存機能の React 化
  - [ ] タスク管理機能
  - [ ] ガントチャート
  - [ ] カレンダー
  - [ ] 設定管理
  - [ ] 管理者機能
- [ ] サーバー側の TypeScript 化
- [ ] テストの追加
- [ ] パフォーマンス最適化

## 🛠️ 技術スタック

### フロントエンド

- **React 18.3** - UI ライブラリ
- **TypeScript 5.5** - 型安全性
- **Vite 5.3** - 高速ビルドツール
- **React Router 6** - ルーティング
- **Axios** - HTTP クライアント

### バックエンド

- **Node.js** - サーバーサイドランタイム
- **Express 4** - Web フレームワーク
- **JWT** - 認証
- **bcrypt** - パスワードハッシュ化

## 📖 開発ガイド

### 新しいページの追加

1. `client/src/pages/` に新しいコンポーネントを作成
2. `client/src/App.tsx` にルートを追加
3. 必要に応じて認証を設定

### 新しい API 呼び出しの追加

1. `shared/types/index.ts` に型定義を追加
2. `client/src/services/` に対応するサービスを作成
3. コンポーネントでサービスを使用

### スタイリング

- グローバルスタイル: `client/src/styles/index.css`
- コンポーネント固有のスタイル: 対応する `.css` ファイルを作成

## 🔑 デフォルトログイン情報

- **ログイン ID**: `admin`
- **パスワード**: `admin123`

## 📚 参考資料

- [React ドキュメント](https://react.dev/)
- [TypeScript ドキュメント](https://www.typescriptlang.org/docs/)
- [Vite ドキュメント](https://vitejs.dev/)
- [React Router ドキュメント](https://reactrouter.com/)

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まず Issue を開いて変更内容を議論してください。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

---

**Team Nullpo** | Version 1.1.0 (React Migration)
