# NullTasker - TypeScript + React 移行完了ガイド 🚀

## ✅ 完了した作業

### 1. プロジェクト構造の再編成

新しいディレクトリ構造を作成し、クライアントとサーバーを分離しました：

```
NullTasker_React/
├── client/                    # ✨ 新規: Reactフロントエンド
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx          # エントリーポイント
│       ├── App.tsx           # ルートコンポーネント
│       ├── components/       # 再利用可能なコンポーネント
│       ├── contexts/         # React Context
│       ├── pages/            # ページコンポーネント
│       ├── services/         # API層
│       └── styles/           # スタイルシート
├── shared/                   # ✨ 新規: 共有型定義
│   └── types/index.ts
├── server.js                 # 既存: Expressサーバー
└── config/                   # 既存: データファイル
```

### 2. TypeScript 設定

- `tsconfig.json` - ルート設定
- `tsconfig.app.json` - クライアント用設定
- `tsconfig.node.json` - Node.js 用設定
- `vite.config.ts` - Vite 設定

### 3. 実装済みコンポーネント

#### ✅ 認証システム

- **AuthContext** (`client/src/contexts/AuthContext.tsx`)

  - JWT 認証管理
  - ログイン/ログアウト機能
  - トークン自動リフレッシュ
  - ローカルストレージ管理

- **ProtectedRoute** (`client/src/components/ProtectedRoute.tsx`)
  - 認証済みユーザー用ルート保護
  - 管理者権限チェック
  - ログインページへの自動リダイレクト

#### ✅ ページコンポーネント

- **LoginPage** - ログイン画面（完全実装）
- **RegisterPage** - 新規登録画面（完全実装）
- **DashboardPage** - ダッシュボード（プレースホルダー）
- **TaskPage** - タスク管理（プレースホルダー）
- **GanttPage** - ガントチャート（プレースホルダー）
- **CalendarPage** - カレンダー（プレースホルダー）
- **SettingsPage** - 設定（プレースホルダー）
- **UserProfilePage** - プロフィール（プレースホルダー）
- **AdminPage** - 管理者画面（プレースホルダー）

#### ✅ サービス層

- **apiClient** (`client/src/services/apiClient.ts`)

  - Axios インスタンス
  - 自動トークン付与
  - トークンリフレッシュ機能
  - エラーハンドリング

- **authService** (`client/src/services/authService.ts`)
  - ログイン/登録 API
  - トークン検証
  - ログアウト

### 4. 型定義

`shared/types/index.ts` に以下の型を定義：

- User, UserProfile, UserRole
- Task, TaskPriority, TaskStatus
- Project, ProjectSettings
- API レスポンス型
- フォームデータ型

### 5. スタイリング

- `client/src/styles/index.css` - グローバルスタイル
- `client/src/styles/login.css` - ログイン画面専用スタイル

## 🎯 現在の動作状況

### ✅ 動作確認済み

1. **開発サーバー起動**

   ```bash
   # フロントエンド (Vite)
   npm run dev:client
   # → http://localhost:5173

   # バックエンド (Express)
   USE_HTTPS=false npm run dev:server
   # → http://localhost:3000

   # 両方を同時に起動
   npm run dev
   ```

2. **API プロキシ設定**

   - Vite が `/api` へのリクエストを `http://localhost:3000` にプロキシ
   - CORS 設定済み

3. **認証フロー**
   - ログインページへのアクセス: ✅
   - 新規登録機能: ✅
   - JWT 認証: ✅
   - 保護されたルート: ✅
   - 自動リダイレクト: ✅

## 📝 次のステップ

### 優先度: 高

1. **ダッシュボードの実装**

   - タスク統計表示
   - 進捗概要
   - 最近のアクティビティ

2. **タスク管理機能の移行**

   - タスク一覧表示
   - タスク作成/編集/削除
   - フィルタリング・ソート機能
   - 既存の `src/scripts/task-manager.js` を参考に React 化

3. **共通コンポーネントの作成**
   - Layout コンポーネント（サイドバー、ヘッダー）
   - Modal コンポーネント
   - Form コンポーネント
   - Loading スピナー

### 優先度: 中

4. **ガントチャート機能**
   - 既存の `src/scripts/gantt-manager.js` を参考
   - React 対応のチャートライブラリ検討
5. **カレンダー機能**

   - 既存の `src/scripts/calendar-manager.js` を参考
   - React Calendar ライブラリ統合

6. **設定管理機能**
   - ユーザー設定
   - カテゴリ管理
   - 通知設定

### 優先度: 低

7. **管理者機能の移行**

   - ユーザー管理
   - プロジェクト管理
   - システム設定

8. **サーバーの TypeScript 化**

   - `server.js` を `server.ts` に変換
   - Express 型定義の追加

9. **テストの追加**
   - Jest + React Testing Library
   - ユニットテスト
   - 統合テスト

## 🛠️ 開発ガイド

### 新しいページの追加方法

1. ページコンポーネントを作成:

```typescript
// client/src/pages/NewPage.tsx
const NewPage = () => {
  return <div>New Page Content</div>;
};

export default NewPage;
```

2. `App.tsx` にルートを追加:

```typescript
<Route
  path="/new"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### API 呼び出しの追加方法

1. 型定義を追加 (`shared/types/index.ts`):

```typescript
export interface NewData {
  id: string;
  name: string;
}
```

2. サービスを作成 (`client/src/services/newService.ts`):

```typescript
import apiClient from "./apiClient";
import { NewData } from "@shared/types";

export const fetchData = async (): Promise<NewData[]> => {
  const response = await apiClient.get<NewData[]>("/new-endpoint");
  return response.data;
};
```

3. コンポーネントで使用:

```typescript
import { useState, useEffect } from "react";
import * as newService from "../services/newService";

const MyComponent = () => {
  const [data, setData] = useState<NewData[]>([]);

  useEffect(() => {
    newService.fetchData().then(setData);
  }, []);

  return <div>{/* レンダリング */}</div>;
};
```

## 🔧 トラブルシューティング

### エラー: "モジュールが見つかりません"

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ポート競合エラー

```bash
# ポートを使用しているプロセスを確認
lsof -i :5173  # フロントエンド
lsof -i :3000  # バックエンド

# プロセスを終了
kill -9 <PID>
```

### TypeScript エラーが表示される

```bash
# TypeScript型チェック
npx tsc --noEmit
```

## 📚 参考資料

- [React 公式ドキュメント](https://react.dev/)
- [TypeScript ハンドブック](https://www.typescriptlang.org/docs/)
- [Vite ガイド](https://vitejs.dev/guide/)
- [React Router ドキュメント](https://reactrouter.com/)
- [Axios ドキュメント](https://axios-http.com/docs/intro)

## 📊 進捗状況

```
全体の進捗: ████████░░░░░░░░░░░░ 40%

✅ 完了:
  - プロジェクト構造再編成
  - TypeScript環境セットアップ
  - 認証システム実装
  - ルーティング設定
  - API層実装

🚧 進行中:
  - 基本ページコンポーネントの実装

📅 未着手:
  - タスク管理機能の完全移行
  - ガントチャート/カレンダー機能
  - 管理者機能の移行
  - サーバー側TypeScript化
```

## 🎉 まとめ

TypeScript + React への移行の基礎は完了しました。認証システムが動作し、ページ間のナビゲーションも機能しています。次は各ページの機能を既存の JavaScript コードを参考に React コンポーネントとして実装していく段階です。

---

**Team Nullpo** | Version 1.1.0 - React Migration Phase 1 Complete ✨
