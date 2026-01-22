# NullTasker 開発ガイド

## 開発環境

### 必要なツール

- **Node.js**: 14.0.0以上
- **npm**: 6.x以上
- **Git**: 2.x以上
- **エディタ**: VS Code推奨（設定ファイル付属）

### 推奨VS Code拡張機能

- ESLint
- Prettier
- SQLite Viewer
- JavaScript (ES6) code snippets
- HTML CSS Support

## プロジェクト構造の理解

### ディレクトリ構成

```
NullTasker/
├── server.js              # Express サーバーのエントリーポイント
├── server-constants.js    # サーバー定数定義
├── db/
│   ├── database.js        # データベース管理クラス
│   ├── schema.sql         # SQLスキーマ定義
│   └── nulltasker.db      # SQLiteデータベース（自動生成）
├── src/
│   ├── pages/             # HTMLページ
│   ├── scripts/           # フロントエンドJavaScript
│   │   ├── main.js        # エントリーポイント
│   │   ├── config.js      # 設定管理
│   │   ├── constants.js   # 定数定義
│   │   ├── utils.js       # ユーティリティ関数
│   │   ├── simple-auth.js # 認証管理
│   │   ├── sidebar.js     # サイドバー管理
│   │   ├── task-manager.js      # タスク管理
│   │   ├── project-manager.js   # プロジェクト管理
│   │   ├── user-manager.js      # ユーザー管理
│   │   ├── calendar-manager.js  # カレンダー管理
│   │   ├── gantt-manager.js     # ガントチャート管理
│   │   └── settings-manager.js  # 設定管理
│   └── styles/            # CSSファイル
│       ├── base.css       # 基本スタイル
│       ├── components.css # コンポーネントスタイル
│       ├── layout.css     # レイアウト
│       └── responsive.css # レスポンシブ対応
└── scripts/               # 管理スクリプト
    ├── reset-data.js      # データリセット
    ├── migrate-to-sqlite.js # マイグレーション
    ├── generate-cert.js   # SSL証明書生成
    ├── test-api.js        # APIテスト
    └── test-admin-api.js  # 管理者APIテスト
```

### アーキテクチャパターン

#### フロントエンド

- **モジュラーアーキテクチャ**: ES6モジュールを使用した疎結合設計
- **マネージャークラス**: 各機能領域ごとにマネージャークラスを配置
- **シングルトンパターン**: グローバル状態管理に使用
- **イベント駆動**: DOM イベントとカスタムイベントを活用

#### バックエンド

- **レイヤードアーキテクチャ**: 
  - ルーティング層 (Express routes)
  - ビジネスロジック層 (サーバーロジック)
  - データアクセス層 (DatabaseManager)
- **ミドルウェアパターン**: 認証、検証、エラーハンドリング
- **Repository パターン**: データベースアクセスの抽象化

## 開発ワークフロー

### 初期セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/Team-Nullpo/NullTasker.git
cd NullTasker

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集

# SSL証明書の生成（HTTPS使用時）
npm run generate-cert

# データベースの初期化は自動実行されます
```

### 開発サーバーの起動

```bash
# HTTPSモード（推奨）
npm run dev

# HTTPモード
npm run dev:http
```

### ブランチ戦略

- `main`: 本番環境用の安定版
- `develop`: 開発用のメインブランチ
- `feature/*`: 新機能開発用
- `bugfix/*`: バグ修正用
- `hotfix/*`: 緊急修正用

### 開発フロー

1. **機能ブランチの作成**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **コードの実装**
   - 小さな単位でコミット
   - わかりやすいコミットメッセージ

3. **テスト**
   ```bash
   npm run test-api
   ```

4. **プルリクエスト作成**
   - 変更内容の説明
   - スクリーンショット（UI変更時）

## コーディング規約

### JavaScript

#### ネーミング規則

```javascript
// クラス: PascalCase
class TaskManager {}

// 関数・変数: camelCase
function getUserData() {}
const taskList = [];

// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// プライベートメソッド: _で開始
class Example {
  _privateMethod() {}
}
```

#### コードスタイル

```javascript
// ES6+ の機能を積極的に使用
const { id, name } = user;
const tasks = [...oldTasks, newTask];

// async/await を優先
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('エラー:', error);
  }
}

// アロー関数の使用
const double = (x) => x * 2;
array.map(item => item.name);

// テンプレートリテラル
const message = `ユーザー${name}がログインしました`;
```

#### エラーハンドリング

```javascript
// フロントエンド
try {
  const data = await api.fetchData();
  processData(data);
} catch (error) {
  console.error('データ取得エラー:', error);
  Utils.showNotification('エラーが発生しました', 'error');
}

// バックエンド
app.get('/api/data', async (req, res) => {
  try {
    const data = await getData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('API エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました' 
    });
  }
});
```

### CSS

#### ネーミング規則

```css
/* BEM記法を推奨 */
.block {}
.block__element {}
.block--modifier {}

/* 例 */
.task-card {}
.task-card__title {}
.task-card__title--important {}
```

#### スタイルの構成

```css
/* 1. レイアウト */
.container {
  display: flex;
  flex-direction: column;
}

/* 2. ボックスモデル */
.box {
  width: 100%;
  padding: 1rem;
  margin: 0.5rem;
}

/* 3. 視覚効果 */
.card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 4. テキスト */
.title {
  color: #333;
  font-size: 1.5rem;
  font-weight: bold;
}

/* 5. その他 */
.interactive {
  cursor: pointer;
  transition: all 0.3s ease;
}
```

### HTML

```html
<!-- セマンティックタグの使用 -->
<header>
  <nav>...</nav>
</header>

<main>
  <section>
    <article>...</article>
  </section>
</main>

<footer>...</footer>

<!-- アクセシビリティ -->
<button aria-label="メニューを開く">
  <i class="fas fa-bars"></i>
</button>

<!-- データ属性の使用 -->
<div data-task-id="123" data-status="done">
  ...
</div>
```

## データベース開発

### スキーマ変更

1. `db/schema.sql` を更新
2. マイグレーションスクリプトを作成（必要に応じて）
3. データベースを再作成してテスト

```bash
# データベースのリセット
npm run reset-data
```

### データベース操作

```javascript
// DatabaseManager の使用例
const db = new DatabaseManager('./db/nulltasker.db');

// ユーザー操作
const users = db.getAllUsers();
const user = db.getUserById('user_id');
const newUser = db.createUser({
  loginId: 'testuser',
  password: hashedPassword,
  displayName: 'Test User',
  email: 'test@example.com',
  role: 'user'
});

// トランザクション
db.db.transaction(() => {
  db.createProject(projectData);
  db.addProjectMember(projectId, userId);
})();
```

### バックアップとリストア

```bash
# 手動バックアップ
cp db/nulltasker.db db/backups/backup_$(date +%Y%m%d_%H%M%S).db

# リストア
cp db/backups/backup_20260122_120000.db db/nulltasker.db
```

## API 開発

### 新しいエンドポイントの追加

```javascript
// server.js

// 1. ルート定義
app.get('/api/custom', authenticateToken, async (req, res) => {
  try {
    // 2. 入力検証
    const { param } = req.query;
    if (!param) {
      return res.status(400).json({
        success: false,
        message: 'パラメータが必要です'
      });
    }

    // 3. ビジネスロジック
    const data = await processData(param);

    // 4. レスポンス
    res.json({
      success: true,
      data
    });
  } catch (error) {
    // 5. エラーハンドリング
    console.error('API エラー:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
});
```

### バリデーション

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/data',
  [
    body('name').notEmpty().withMessage('名前は必須です'),
    body('email').isEmail().withMessage('有効なメールアドレスを入力してください'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }
    // 処理を続行
  }
);
```

## テスト

### 手動テスト

```bash
# APIテスト
npm run test-api

# 管理者APIテスト
npm run test-admin-api
```

### テストデータの作成

```bash
# データベースをリセットしてデフォルトデータを作成
npm run reset-data
```

デフォルトユーザー:
- 管理者: `admin` / `admin123`

## デバッグ

### フロントエンドデバッグ

```javascript
// Utils.debugLog を使用
import { Utils } from './utils.js';

Utils.debugLog('デバッグ情報:', data);

// ブラウザのコンソール
console.log('変数の値:', variable);
console.table(arrayData); // 配列やオブジェクトを表形式で表示
```

### バックエンドデバッグ

```javascript
// サーバーログ
console.log('[DEBUG]', 'メッセージ');
console.error('[ERROR]', error);

// デバッグモード
const DEBUG_MODE = process.env.NODE_ENV === 'development';
if (DEBUG_MODE) {
  console.log('デバッグ情報:', data);
}
```

### ストレージデバッグ

ブラウザで `debug-storage.html` にアクセスして、LocalStorageの内容を確認できます。

## パフォーマンス最適化

### フロントエンド

- **遅延読み込み**: 必要なデータのみ読み込み
- **キャッシング**: LocalStorageを活用
- **デバウンス/スロットル**: イベントハンドラーの最適化

```javascript
// デバウンスの実装例
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 使用例
const handleSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

### バックエンド

- **データベースインデックス**: 頻繁にクエリされるカラムにインデックスを作成
- **接続プール**: データベース接続の再利用
- **キャッシング**: よく使われるデータをメモリにキャッシュ

## トラブルシューティング

### よくある問題

#### ポートが使用中

```bash
# ポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

#### データベースロック

```bash
# データベースファイルを削除して再作成
rm db/nulltasker.db
npm start
```

#### モジュール not found エラー

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ログの確認

```bash
# サーバーログをファイルに出力
npm start > server.log 2>&1
```

## ビルドとデプロイ

### 本番環境用設定

```bash
# 環境変数の設定
export NODE_ENV=production
export JWT_SECRET="strong-random-secret-key"
export ALLOWED_ORIGINS="https://yourdomain.com"

# サーバー起動
npm start
```

### プロセス管理

PM2 を使用したプロセス管理を推奨：

```bash
# PM2 のインストール
npm install -g pm2

# アプリケーション起動
pm2 start server.js --name nulltasker

# ログ確認
pm2 logs nulltasker

# 再起動
pm2 restart nulltasker

# 停止
pm2 stop nulltasker
```

## 参考リソース

### プロジェクト内ドキュメント

- [セットアップガイド](SETUP.md)
- [API ドキュメント](API.md)
- [アーキテクチャ](ARCHITECTURE.md)
- [データベース移行](DATABASE_MIGRATION.md)
- [HTTPS設定](HTTPS_SETUP.md)

### 外部リソース

- [Express.js ドキュメント](https://expressjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Node.js ドキュメント](https://nodejs.org/docs/)
- [SQLite ドキュメント](https://www.sqlite.org/docs.html)

## コントリビューション

プロジェクトへの貢献方法については [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。
