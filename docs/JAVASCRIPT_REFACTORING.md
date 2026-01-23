# JavaScriptリファクタリングガイド

## ファイル構成

```
src/scripts/
├── api-client.js       # 統一されたAPIクライアント（新規）
├── utils.js            # 共通ユーティリティ（拡張）
├── constants.js        # アプリケーション定数
├── config.js           # 設定管理
├── auth-interceptor.js # 認証インターセプター
├── simple-auth.js      # 認証管理
├── sidebar.js          # サイドバー管理
├── main.js             # メインエントリーポイント
│
├── project-manager.js  # プロジェクト管理
├── user-manager.js     # ユーザー管理
├── ticket-manager.js   # チケット管理
├── task-manager.js     # タスク管理
├── calendar-manager.js # カレンダー管理
├── gantt-manager.js    # ガントチャート管理
├── settings-manager.js # 設定管理
├── admin-manager.js    # 管理者機能
├── user-profile.js     # ユーザープロフィール
└── register.js         # ユーザー登録
```

## 主な改善点

### 1. APIクライアントの統一

#### Before（各ファイルでfetchを直接使用）

```javascript
// task-manager.js
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});

if (!response.ok) {
  throw new Error('Failed to create task');
}

const result = await response.json();
```

#### After（APIClientを使用）

```javascript
// task-manager.js
import { APIClient, ErrorHandler } from './api-client.js';

try {
  const result = await APIClient.post('/tasks', data);
  Utils.showNotification('タスクを作成しました', 'success');
} catch (error) {
  ErrorHandler.handle(error, 'タスクの作成に失敗しました');
}
```

### 2. エラーハンドリングの統一

```javascript
// APIエラーの一元管理
import { APIError, ErrorHandler } from './api-client.js';

try {
  const data = await APIClient.get('/tasks');
  // 処理...
} catch (error) {
  if (ErrorHandler.isAuthError(error)) {
    // 認証エラー時の処理
  } else if (ErrorHandler.isValidationError(error)) {
    // バリデーションエラー時の処理
  } else {
    // その他のエラー
    ErrorHandler.handle(error);
  }
}
```

### 3. Utilsクラスの拡張

新しく追加された便利な関数：

```javascript
// 相対時間表示
Utils.formatRelativeTime(task.createdAt); // "3日前"

// デバイス判定
if (Utils.isMobile()) {
  // モバイル向け処理
}

// バリデーション
const result = Utils.validatePassword(password);
if (!result.valid) {
  console.error(result.message);
}

// デバウンス・スロットル
const debouncedSearch = Utils.debounce(search, 300);
input.addEventListener('input', debouncedSearch);

// クリップボードコピー
await Utils.copyToClipboard('コピーするテキスト');
```

## APIClient使用方法

### 基本的なCRUD操作

```javascript
import { APIClient, ErrorHandler } from './api-client.js';

// GET（一覧取得）
const tasks = await APIClient.get('/tasks', { projectId: 1 });

// GET（単一取得）
const task = await APIClient.get(`/tasks/${id}`);

// POST（作成）
const newTask = await APIClient.post('/tasks', {
  title: 'New Task',
  description: 'Task description'
});

// PUT（全体更新）
const updated = await APIClient.put(`/tasks/${id}`, taskData);

// PATCH（部分更新）
const patched = await APIClient.patch(`/tasks/${id}`, {
  status: 'completed'
});

// DELETE（削除）
await APIClient.delete(`/tasks/${id}`);
```

### ファイルアップロード

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', 'filename');

try {
  const result = await APIClient.upload('/upload', formData);
  Utils.showNotification('アップロードに成功しました', 'success');
} catch (error) {
  ErrorHandler.handle(error, 'アップロードに失敗しました');
}
```

### ファイルダウンロード

```javascript
try {
  await APIClient.download('/export/data', 'data.json');
  Utils.showNotification('ダウンロードに成功しました', 'success');
} catch (error) {
  ErrorHandler.handle(error, 'ダウンロードに失敗しました');
}
```

### エラーハンドリング

```javascript
try {
  const data = await APIClient.get('/protected-resource');
} catch (error) {
  if (error instanceof APIError) {
    // APIエラー
    console.error('API Error:', error.status, error.message);
    
    if (error.status === 404) {
      // 404エラー処理
    } else if (error.status === 500) {
      // サーバーエラー処理
    }
  } else {
    // ネットワークエラーなど
    console.error('Network Error:', error.message);
  }
}
```

### カスタムヘッダー

```javascript
// カスタムヘッダーを追加
const data = await APIClient.get('/api/resource', {}, {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Utils使用方法

### 日付・時刻

```javascript
// 日付フォーマット
Utils.formatDate(new Date()); // "2026/1/22"
Utils.formatDate(new Date(), 'short'); // "2026/1/22"
Utils.formatDate(new Date(), 'iso'); // "2026-01-22"
Utils.formatDateTime(new Date()); // "2026/1/22 10:30:45"

// 相対時間
Utils.formatRelativeTime(task.createdAt); // "3日前"

// 日付チェック
Utils.isToday(new Date()); // true
Utils.isOverdue('2026-01-20'); // true
Utils.isSameDate(date1, date2); // boolean
```

### データフォーマット

```javascript
// バイト数
Utils.formatBytes(1024); // "1 KB"
Utils.formatBytes(1048576, 2); // "1.00 MB"

// 数値
Utils.formatNumber(1000000); // "1,000,000"

// パーセント
Utils.formatPercent(25, 100); // "25%"
Utils.formatPercent(1, 3, 2); // "33.33%"
```

### DOM操作

```javascript
// 要素取得
const element = Utils.getElement('#taskList');
const elements = Utils.getElements('.task-item');

// 要素作成
const button = Utils.createElement('button', {
  class: 'btn btn-primary',
  id: 'submitBtn',
  'data-action': 'submit'
}, 'Submit');
```

### 通知

```javascript
// 成功通知
Utils.showNotification('保存しました', 'success');

// エラー通知
Utils.showNotification('エラーが発生しました', 'error');

// 警告通知
Utils.showNotification('入力内容を確認してください', 'warning');

// 情報通知（デフォルト）
Utils.showNotification('処理中です', 'info');

// カスタム表示時間
Utils.showNotification('5秒間表示', 'info', 5000);
```

### ローカルストレージ

```javascript
// 保存
Utils.saveToStorage('settings', { theme: 'dark' });

// 取得
const settings = Utils.getFromStorage('settings', { theme: 'light' });

// 削除
Utils.removeFromStorage('settings');

// クリア
Utils.clearStorage();
```

### バリデーション

```javascript
// 日付バリデーション
const valid = Utils.validateDates(startDate, endDate); // boolean

// メールバリデーション
const isValidEmail = Utils.validateEmail('test@example.com'); // boolean

// パスワードバリデーション
const result = Utils.validatePassword('MyP@ssw0rd');
if (result.valid) {
  console.log(result.strength); // 'weak', 'medium', 'strong'
  console.log(result.message);
}
```

### 型変換

```javascript
// 安全な変換
const num = Utils.toSafeInteger('123', 0); // 123
const float = Utils.toSafeFloat('12.34', 0.0); // 12.34
const arr = Utils.toSafeArray(null, []); // []
const str = Utils.toSafeString(null, ''); // ''
```

### ユーティリティ関数

```javascript
// ディープコピー
const copy = Utils.deepClone(originalObject);

// デバウンス
const debounced = Utils.debounce(() => {
  console.log('Debounced!');
}, 300);

// スロットル
const throttled = Utils.throttle(() => {
  console.log('Throttled!');
}, 300);

// 配列シャッフル
const shuffled = Utils.shuffleArray([1, 2, 3, 4, 5]);

// URLパラメータ取得
const id = Utils.getUrlParameter('id'); // ?id=123 => '123'

// クリップボードコピー
const success = await Utils.copyToClipboard('コピーするテキスト');

// スリープ
await Utils.sleep(1000); // 1秒待機
```

## コーディング規約

### 命名規則

```javascript
// クラス: PascalCase
class TaskManager { }

// メソッド・関数: camelCase
function getTasks() { }

// 定数: UPPER_SNAKE_CASE
const MAX_TASKS = 100;

// プライベートメソッド: 先頭にアンダースコア
_privateMethod() { }
```

### async/await vs Promise

```javascript
// ✅ 推奨: async/await
async function loadTasks() {
  try {
    const tasks = await APIClient.get('/tasks');
    return tasks;
  } catch (error) {
    ErrorHandler.handle(error);
  }
}

// ❌ 非推奨: .then().catch()
function loadTasks() {
  return fetch('/api/tasks')
    .then(response => response.json())
    .then(data => data)
    .catch(error => console.error(error));
}
```

### エラーハンドリング

```javascript
// ✅ 推奨: 適切なエラーハンドリング
async function createTask(data) {
  try {
    const task = await APIClient.post('/tasks', data);
    Utils.showNotification('タスクを作成しました', 'success');
    return task;
  } catch (error) {
    ErrorHandler.handle(error, 'タスクの作成に失敗しました');
    throw error; // 必要に応じて再スロー
  }
}

// ❌ 非推奨: エラーを無視
async function createTask(data) {
  const task = await APIClient.post('/tasks', data);
  return task; // エラーが発生してもキャッチされない
}
```

### インポート

```javascript
// ✅ 推奨: 必要なものだけインポート
import { APIClient, ErrorHandler } from './api-client.js';
import { Utils } from './utils.js';

// ❌ 非推奨: ワイルドカードインポート
import * as API from './api-client.js';
```

### JSDoc コメント

```javascript
/**
 * タスクを作成
 * @param {Object} data - タスクデータ
 * @param {string} data.title - タスクタイトル
 * @param {string} data.description - タスク説明
 * @param {string} data.priority - 優先度
 * @returns {Promise<Object>} 作成されたタスク
 * @throws {APIError} API呼び出しエラー
 */
async function createTask(data) {
  return await APIClient.post('/tasks', data);
}
```

## マイグレーションガイド

### 既存コードの移行手順

1. **APIClient への移行**

```javascript
// Before
const response = await fetch('/api/tasks', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// After
import { APIClient } from './api-client.js';
const data = await APIClient.get('/tasks');
```

2. **エラーハンドリングの改善**

```javascript
// Before
try {
  const data = await fetchTasks();
} catch (e) {
  console.error(e);
  alert('エラーが発生しました');
}

// After
import { ErrorHandler } from './api-client.js';
try {
  const data = await fetchTasks();
} catch (error) {
  ErrorHandler.handle(error, 'タスクの取得に失敗しました');
}
```

3. **Utils関数の活用**

```javascript
// Before
const date = new Date(task.createdAt);
const formatted = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;

// After
const formatted = Utils.formatDate(task.createdAt);
```

## パフォーマンス最適化

### デバウンスの活用

```javascript
// 検索入力のデバウンス
const searchInput = document.getElementById('search');
const debouncedSearch = Utils.debounce(async (query) => {
  const results = await APIClient.get('/search', { q: query });
  displayResults(results);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### リクエストのキャンセル

```javascript
// AbortControllerを使用したキャンセル
const controller = new AbortController();

// リクエスト送信
const promise = APIClient.get('/tasks', {}, {
  signal: controller.signal
});

// キャンセル
controller.abort();
```

### ローカルキャッシュの活用

```javascript
class TaskCache {
  static cache = new Map();
  static TTL = 5 * 60 * 1000; // 5分

  static async getTasks(projectId) {
    const key = `tasks_${projectId}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    const data = await APIClient.get('/tasks', { projectId });
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}
```

## デバッグ

### デバッグログの活用

```javascript
// 開発環境のみログ出力
Utils.debugLog('Task data:', taskData);

// エラーログ（常に出力）
Utils.errorLog('Failed to load tasks:', error);
```

### APIリクエストの確認

```javascript
// APIClientは自動的にリクエストをログ出力（開発環境のみ）
// [DEBUG] GET /api/tasks?projectId=1
// [DEBUG] POST /api/tasks {"title":"New Task"}
```

## 今後の改善

- [ ] TypeScript移行検討
- [ ] ユニットテスト追加（Jest）
- [ ] E2Eテスト追加（Playwright/Cypress）
- [ ] リントツール導入（ESLint）
- [ ] フォーマッター導入（Prettier）
- [ ] バンドラー導入（Vite/Webpack）
- [ ] Service Worker対応（オフライン機能）
- [ ] WebSocket対応（リアルタイム更新）
