# 認証インターセプター機能

## 概要

NullTasker では、ログイン失効時（認証トークンの有効期限切れや無効化）に自動的にログイン画面へリダイレクトする機能を実装しています。この機能により、ユーザーは手動でログアウトする必要がなく、セキュアで快適な利用体験が提供されます。

## 機能詳細

### 自動リダイレクト

- **対象エラー**: HTTP ステータス 401 (Unauthorized) または 403 (Forbidden)
- **動作**: API リクエスト時に認証エラーが発生した場合、自動的にログイン画面へ遷移
- **適用範囲**: すべての API エンドポイント（`/api/*`）
- **除外**: ログイン API（`/api/login`）および登録 API（`/api/register`）

### 認証情報のクリア

認証エラー発生時、以下のデータを自動的にクリアします：

- `localStorage.authToken`
- `localStorage.refreshToken`
- `localStorage.user`
- `sessionStorage.authToken`
- `sessionStorage.refreshToken`
- `sessionStorage.user`

### 実装方法

認証インターセプターは、グローバルな `fetch` 関数をラップすることで実装されています。これにより、既存のコードを変更することなく、すべての API リクエストで自動的に認証チェックが行われます。

## 技術仕様

### ファイル構成

```
src/scripts/
├── auth-interceptor.js    # 認証インターセプター本体
└── main.js               # インターセプター初期化
```

### 初期化

`main.js` でアプリケーション起動時に自動的に初期化されます：

```javascript
import { AuthInterceptor } from "./auth-interceptor.js";

// アプリケーション初期化
document.addEventListener("DOMContentLoaded", async () => {
  // 認証インターセプターを初期化
  AuthInterceptor.init();
  
  // その他の初期化処理...
});
```

### 動作フロー

```
API リクエスト発行
    ↓
fetch インターセプター
    ↓
サーバーレスポンス受信
    ↓
ステータスコードチェック
    ↓
401 または 403？
    ├─ Yes → 認証情報をクリア → ログイン画面へリダイレクト
    └─ No  → 通常のレスポンス処理
```

## 使用例

### 通常のケース

```javascript
// 既存のコード（変更不要）
const response = await fetch('/api/tasks', {
  headers: SimpleAuth.getAuthHeaders()
});

// 認証が有効な場合
if (response.ok) {
  const data = await response.json();
  // データ処理...
}
```

### 認証失効時

```javascript
// 同じコード
const response = await fetch('/api/tasks', {
  headers: SimpleAuth.getAuthHeaders()
});

// トークンが無効な場合、自動的にログイン画面へリダイレクト
// （以降のコードは実行されない）
```

## テスト方法

### 1. トークン無効化テスト

1. ログインする
2. ブラウザの開発者ツール（F12）を開く
3. Console タブで以下を実行：
   ```javascript
   localStorage.setItem('authToken', 'invalid-token');
   ```
4. 任意のページをリロードまたは API リクエストを実行
5. 自動的にログイン画面へリダイレクトされることを確認

### 2. トークン削除テスト

1. ログインする
2. 開発者ツールの Console で以下を実行：
   ```javascript
   localStorage.removeItem('authToken');
   ```
3. 任意の API リクエストを実行（タスク追加など）
4. ログイン画面へリダイレクトされることを確認

### 3. サーバー側トークン失効テスト

1. ログインする
2. サーバーを再起動（JWT シークレットが変更される場合）
3. 任意の API リクエストを実行
4. ログイン画面へリダイレクトされることを確認

## トラブルシューティング

### 問題: リダイレクトループが発生する

**原因**: ログイン画面でも認証チェックが実行されている

**解決方法**: ログイン画面とregister画面では `main.js` をインポートしないこと

### 問題: リダイレクトされない

**原因**: `main.js` が正しくインポートされていない

**解決方法**: HTML ファイルで以下のように `main.js` をインポート
```html
<script type="module" src="../scripts/main.js"></script>
```

### 問題: 複数回リダイレクトされる

**原因**: 複数の API リクエストが同時に失敗している

**解決方法**: これは正常な動作です。`AuthInterceptor.isRedirecting` フラグにより、実際のリダイレクトは1回のみ実行されます。

## セキュリティ上の利点

1. **自動セッション管理**: 手動でのログアウト忘れを防止
2. **トークン漏洩対策**: 無効なトークンでのアクセスを即座にブロック
3. **ユーザビリティ向上**: シームレスな認証フロー
4. **一貫性**: すべてのページで統一された認証処理

## 今後の拡張性

- リフレッシュトークンによる自動再認証
- 認証失効の理由を通知（セッションタイムアウト、強制ログアウトなど）
- ログイン画面へのリダイレクト前にユーザーへの確認ダイアログ表示
- 未保存のデータがある場合の警告

## 関連ドキュメント

- [セキュリティガイドライン](../SECURITY.md)
- [API 仕様](../README.md#api-仕様)
- [認証システム](../README.md#ユーザー認証権限管理)

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-21
