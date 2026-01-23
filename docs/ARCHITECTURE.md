# NullTasker アーキテクチャドキュメント

## システム概要

NullTasker は、Node.js + Express.js バックエンドと Vanilla JavaScript フロントエンドで構成された、モダンな Web ベースのタスク管理システムです。SQLite データベースを使用し、JWT 認証による安全なユーザー管理を実現しています。

## アーキテクチャの概要図

```
┌─────────────────────────────────────────────────────────┐
│                   クライアント層                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  HTML/CSS   │  │ JavaScript  │  │ LocalStorage │   │
│  │   (View)    │  │ (ES6 Modules)│  │   (Cache)    │   │
│  └─────────────┘  └─────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTPS/HTTP
┌─────────────────────────────────────────────────────────┐
│                   サーバー層                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Express.js                           │  │
│  │  ┌────────────┐ ┌─────────────┐ ┌────────────┐  │  │
│  │  │ Middleware │ │   Routes    │ │  Security  │  │  │
│  │  │  ├ Auth   │ │  ├ API      │ │  ├ Helmet  │  │  │
│  │  │  ├ CORS   │ │  ├ Pages    │ │  ├ CORS    │  │  │
│  │  │  └ Rate    │ │  └ Static   │ │  └ Rate    │  │  │
│  │  │   Limit    │ │              │ │   Limit    │  │  │
│  │  └────────────┘ └─────────────┘ └────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↕                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │          データアクセス層                          │  │
│  │            DatabaseManager                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │  │
│  │  │  Users   │ │ Projects │ │  Tasks   │         │  │
│  │  │   CRUD   │ │   CRUD   │ │   CRUD   │         │  │
│  │  └──────────┘ └──────────┘ └──────────┘         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                 データストレージ層                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │             SQLite Database                       │  │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐│  │
│  │  │ users  │ │ projects │ │ tasks  │ │settings ││  │
│  │  └────────┘ └──────────┘ └────────┘ └─────────┘│  │
│  │  ┌──────────────────┐                            │  │
│  │  │ project_members  │                            │  │
│  │  └──────────────────┘                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## レイヤー構成

### 1. クライアント層 (Client Layer)

#### 責務
- ユーザーインターフェースの表示と管理
- ユーザー入力の処理
- サーバーとの通信
- ローカルキャッシュ管理

#### 主要コンポーネント

**HTML/CSS (View Layer)**
```
src/pages/          # HTMLページ
src/styles/         # CSSスタイル
  ├── base.css      # 基本スタイル
  ├── components.css # UI コンポーネント
  ├── layout.css    # レイアウト
  └── responsive.css # レスポンシブ対応
```

**JavaScript (Controller/Logic Layer)**
```
src/scripts/
  ├── main.js              # エントリーポイント
  ├── config.js            # 設定管理
  ├── constants.js         # 定数定義
  ├── utils.js             # ユーティリティ関数
  ├── simple-auth.js       # 認証管理
  ├── sidebar.js           # UI管理
  ├── task-manager.js      # タスク管理ロジック
  ├── project-manager.js   # プロジェクト管理
  ├── user-manager.js      # ユーザー管理
  ├── calendar-manager.js  # カレンダー機能
  ├── gantt-manager.js     # ガントチャート
  └── settings-manager.js  # 設定管理
```

#### デザインパターン

**モジュールパターン**
```javascript
// ES6 モジュールを使用した疎結合設計
export class TaskManager {
  constructor() {
    this.tasks = [];
    this.init();
  }
  
  init() {
    this.loadTasks();
    this.setupEventListeners();
  }
}
```

**シングルトンパターン**
```javascript
// グローバル状態管理
class AuthManager {
  static instance = null;
  
  static getInstance() {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }
}
```

**Observer パターン**
```javascript
// イベント駆動アーキテクチャ
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}
```

### 2. サーバー層 (Server Layer)

#### 責務
- API エンドポイントの提供
- リクエスト検証とルーティング
- ビジネスロジックの実行
- 認証・認可の管理
- セキュリティ対策

#### Express.js アプリケーション構造

```javascript
// server.js の主要構造

const app = express();

// ミドルウェアスタック
app.use(helmet());           // セキュリティヘッダー
app.use(cors());             // CORS 対応
app.use(express.json());     // JSON パーサー
app.use(rateLimiter);        // レート制限

// 静的ファイル配信
app.use('/src', express.static('src'));

// ルーティング
// - 認証API
// - タスクAPI
// - 管理者API
// - 設定API

// エラーハンドリング
app.use(errorHandler);
```

#### ミドルウェア構成

**認証ミドルウェア**
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '認証が必要です' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'トークンが無効です' 
      });
    }
    req.user = user;
    next();
  });
};
```

**権限チェックミドルウェア**
```javascript
const requireSystemAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'system_admin') {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    });
  }
  next();
};
```

### 3. データアクセス層 (Data Access Layer)

#### 責務
- データベース操作の抽象化
- SQLクエリの実行
- データの整合性保証
- トランザクション管理

#### DatabaseManager クラス

```javascript
class DatabaseManager {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }
  
  // ユーザー管理
  getAllUsers() { /* ... */ }
  getUserById(id) { /* ... */ }
  createUser(userData) { /* ... */ }
  updateUser(id, userData) { /* ... */ }
  deleteUser(id) { /* ... */ }
  
  // プロジェクト管理
  getAllProjects() { /* ... */ }
  getProjectById(id) { /* ... */ }
  createProject(projectData) { /* ... */ }
  
  // タスク管理
  getAllTasks(projectId) { /* ... */ }
  createTask(taskData) { /* ... */ }
  updateTask(id, taskData) { /* ... */ }
  deleteTask(id) { /* ... */ }
  
  // トランザクション
  transaction(fn) {
    return this.db.transaction(fn);
  }
}
```

#### Repository パターン

データアクセス層は Repository パターンを採用し、ビジネスロジックからデータベースの詳細を隠蔽します。

```
DatabaseManager (抽象化)
    ↓
SQL Queries (実装)
    ↓
SQLite Database (データストア)
```

### 4. データストレージ層 (Data Storage Layer)

#### SQLite データベース

**特徴:**
- 単一ファイル形式
- サーバーレスアーキテクチャ
- ACID トランザクション対応
- 軽量で高速

**スキーマ設計:**

```sql
-- users テーブル
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    login_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'project_admin', 'system_admin')),
    created_at TEXT NOT NULL,
    last_login TEXT
);

-- projects テーブル
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT NOT NULL,
    settings TEXT,
    created_at TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE
);

-- project_members テーブル (多対多関係)
CREATE TABLE project_members (
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- tasks テーブル
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assignee TEXT,
    category TEXT,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date TEXT,
    due_date TEXT,
    estimated_hours REAL,
    actual_hours REAL,
    tags TEXT,
    parent_task TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_task) REFERENCES tasks(id) ON DELETE SET NULL
);
```

**インデックス戦略:**

```sql
-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_tasks_project ON tasks(project);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_project_members_user ON project_members(user_id);
```

## データフロー

### 認証フロー

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│ Client  │────1───>│ Server  │────2───>│ Database │
│         │<───6────│         │<───3────│          │
└─────────┘         └─────────┘         └──────────┘
     │                   │
     └────────4──────────┘
              ↓
         JWT Token
```

1. ユーザーがログイン情報を送信
2. サーバーがデータベースでユーザー検証
3. データベースがユーザー情報を返却
4. サーバーが JWT トークンを生成
5. (内部処理)
6. トークンをクライアントに返却

### タスク操作フロー

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│ Client  │         │ Server  │         │ Database │
│         │────1───>│         │────3───>│          │
│         │<───6────│         │<───4────│          │
└─────────┘         └─────────┘         └──────────┘
     │                   │
     │                   2. JWT検証
     │                   5. データ整形
     │
     └─ LocalStorage更新
```

1. クライアントがタスク操作リクエスト + JWT
2. サーバーが JWT を検証
3. データベース操作を実行
4. 結果を返却
5. サーバーがデータを整形
6. クライアントに返却、LocalStorage 更新

## セキュリティアーキテクチャ

### 多層防御戦略

```
┌───────────────────────────────────────┐
│   1. ネットワーク層                    │
│      - HTTPS/TLS                      │
│      - Rate Limiting                  │
└───────────────────────────────────────┘
            ↓
┌───────────────────────────────────────┐
│   2. アプリケーション層                │
│      - JWT 認証                       │
│      - CORS 制御                      │
│      - CSP ヘッダー                   │
└───────────────────────────────────────┘
            ↓
┌───────────────────────────────────────┐
│   3. データ層                          │
│      - 入力検証                        │
│      - SQLインジェクション対策         │
│      - パスワードハッシュ化            │
└───────────────────────────────────────┘
            ↓
┌───────────────────────────────────────┐
│   4. データベース層                    │
│      - 外部キー制約                    │
│      - トランザクション                │
│      - バックアップ                    │
└───────────────────────────────────────┘
```

### 認証・認可モデル

```
Role-Based Access Control (RBAC)

system_admin (システム管理者)
    ├── 全機能へのアクセス
    ├── ユーザー管理
    ├── プロジェクト管理
    └── システム設定

project_admin (プロジェクト管理者)
    ├── 担当プロジェクトの管理
    ├── メンバー管理
    └── タスク管理

user (一般ユーザー)
    ├── 割り当てられたタスクの閲覧・編集
    ├── 自分のプロフィール編集
    └── 参加プロジェクトの閲覧
```

## スケーラビリティ考慮事項

### 現在のアーキテクチャの制約

- **SQLite**: 単一ファイルデータベース、並行書き込み制限
- **シングルプロセス**: Node.js シングルスレッド
- **ローカルストレージ**: ブラウザの容量制限

### 将来の拡張性

**水平スケーリング対応**
```
現在: Single Node.js Instance + SQLite

将来: 
┌───────────────────────────────────────┐
│         Load Balancer                 │
└───────────────────────────────────────┘
        ↓          ↓          ↓
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Node 1 │ │ Node 2 │ │ Node 3 │
    └────────┘ └────────┘ └────────┘
            ↓
    ┌──────────────────────┐
    │  PostgreSQL/MySQL    │
    │  (Master-Replica)    │
    └──────────────────────┘
```

**キャッシング戦略**
```
Client
    ↓
CDN (Static Assets)
    ↓
Redis Cache (Session/Frequent Data)
    ↓
Application Server
    ↓
Database
```

## パフォーマンス最適化

### クライアント側

- **コード分割**: 必要な機能のみ読み込み
- **遅延読み込み**: 画像やコンポーネントの遅延読み込み
- **キャッシング**: LocalStorage による状態管理
- **デバウンス/スロットル**: イベントハンドラーの最適化

### サーバー側

- **WAL モード**: SQLite の並行処理性能向上
- **接続プール**: データベース接続の再利用
- **インデックス**: クエリパフォーマンスの最適化
- **レート制限**: リソース保護

## 監視とロギング

### ログレベル

```
ERROR   - システムエラー、即座の対応が必要
WARN    - 警告、潜在的な問題
INFO    - 一般的な情報、重要なイベント
DEBUG   - デバッグ情報（開発環境のみ）
```

### メトリクス

- **パフォーマンス**: レスポンスタイム、スループット
- **エラー率**: API エラー率、データベースエラー
- **リソース**: CPU、メモリ、ディスク使用量
- **ユーザー**: アクティブユーザー数、セッション時間

## まとめ

NullTasker は、シンプルで保守性の高いアーキテクチャを採用しています：

- **モジュラー設計**: 疎結合なコンポーネント
- **セキュアバイデフォルト**: 多層防御戦略
- **スケーラブル**: 将来の拡張に対応可能
- **メンテナブル**: 明確な責任分離

このアーキテクチャにより、チーム開発の効率化と、長期的な保守性を実現しています。
