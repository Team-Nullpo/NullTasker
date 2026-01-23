# NullTasker API ドキュメント

## 概要

NullTasker は RESTful API を使用してクライアントとサーバー間の通信を行います。すべての API エンドポイントは JSON 形式でデータを送受信します。

## 認証

NullTasker は JWT (JSON Web Token) ベースの認証を使用します。

### トークンの取得

ログインエンドポイントを通じて JWT トークンを取得します：

```http
POST /api/login
Content-Type: application/json

{
  "id": "user_id",
  "password": "user_password",
  "rememberMe": false
}
```

### トークンの使用

取得したトークンは `Authorization` ヘッダーに含めて送信します：

```http
Authorization: Bearer <your-jwt-token>
```

## エンドポイント

### 認証 API

#### ユーザーログイン

```http
POST /api/login
```

**リクエスト:**
```json
{
  "id": "string",
  "password": "string",
  "rememberMe": "boolean"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "ログインに成功しました",
  "token": "jwt-token-string",
  "user": {
    "id": "string",
    "displayName": "string",
    "email": "string",
    "role": "user|project_admin|system_admin"
  }
}
```

#### ユーザー登録

```http
POST /api/register
```

**リクエスト:**
```json
{
  "id": "string",
  "password": "string",
  "displayName": "string",
  "email": "string"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "ユーザー登録が完了しました",
  "token": "jwt-token-string",
  "user": {
    "id": "string",
    "displayName": "string",
    "email": "string",
    "role": "user"
  }
}
```

#### トークン検証

```http
POST /api/validate-token
```

**リクエスト:**
```json
{
  "token": "jwt-token-string"
}
```

**レスポンス:**
```json
{
  "valid": true,
  "user": {
    "id": "string",
    "displayName": "string",
    "role": "string"
  }
}
```

#### ユーザー情報取得

```http
GET /api/user
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "loginId": "string",
    "displayName": "string",
    "email": "string",
    "role": "string",
    "createdAt": "ISO8601 timestamp",
    "lastLogin": "ISO8601 timestamp"
  }
}
```

#### プロフィール更新

```http
PUT /api/user/profile
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "displayName": "string",
  "email": "string"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "プロフィールを更新しました",
  "user": {
    "id": "string",
    "loginId": "string",
    "displayName": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### パスワード変更

```http
PUT /api/user/password
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "パスワードを変更しました"
}
```

### タスク API

#### 全タスク取得

```http
GET /api/tasks
Authorization: Bearer <token>
```

**クエリパラメータ:**
- `projectId` (optional): プロジェクトIDでフィルタリング

**レスポンス:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "string",
      "project": "string",
      "title": "string",
      "description": "string",
      "assignee": "string",
      "category": "string",
      "priority": "high|medium|low",
      "status": "todo|in_progress|review|done",
      "progress": 0-100,
      "startDate": "ISO8601 date",
      "dueDate": "ISO8601 date",
      "estimatedHours": "number",
      "actualHours": "number",
      "tags": ["string"],
      "parentTask": "string|null",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ]
}
```

#### タスク作成/更新

```http
POST /api/tasks
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "tasks": [
    {
      "id": "string",
      "project": "string",
      "title": "string",
      "description": "string",
      "assignee": "string",
      "category": "string",
      "priority": "high|medium|low",
      "status": "todo|in_progress|review|done",
      "progress": 0-100,
      "startDate": "ISO8601 date",
      "dueDate": "ISO8601 date",
      "estimatedHours": "number",
      "actualHours": "number",
      "tags": ["string"],
      "parentTask": "string|null"
    }
  ]
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "タスクを保存しました",
  "count": 0
}
```

### 管理者 API

#### 全ユーザー取得

```http
GET /api/admin/users
Authorization: Bearer <token>
```

**権限:** `system_admin` のみ

**レスポンス:**
```json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "loginId": "string",
      "displayName": "string",
      "email": "string",
      "role": "user|project_admin|system_admin",
      "createdAt": "ISO8601 timestamp",
      "lastLogin": "ISO8601 timestamp"
    }
  ]
}
```

#### ユーザー作成

```http
POST /api/admin/users
Authorization: Bearer <token>
```

**権限:** `system_admin` のみ

**リクエスト:**
```json
{
  "loginId": "string",
  "password": "string",
  "displayName": "string",
  "email": "string",
  "role": "user|project_admin|system_admin"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "ユーザーを作成しました",
  "user": {
    "id": "string",
    "loginId": "string",
    "displayName": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### ユーザー更新

```http
PUT /api/admin/users/:userId
Authorization: Bearer <token>
```

**権限:** `system_admin` のみ

**リクエスト:**
```json
{
  "displayName": "string",
  "email": "string",
  "role": "user|project_admin|system_admin",
  "password": "string (optional)"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "ユーザー情報を更新しました",
  "user": {
    "id": "string",
    "loginId": "string",
    "displayName": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### ユーザー削除

```http
DELETE /api/admin/users/:userId
Authorization: Bearer <token>
```

**権限:** `system_admin` のみ

**レスポンス:**
```json
{
  "success": true,
  "message": "ユーザーを削除しました"
}
```

#### プロジェクト一覧取得

```http
GET /api/admin/projects
Authorization: Bearer <token>
```

**権限:** `system_admin` のみ

**レスポンス:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "owner": "string",
      "members": ["string"],
      "admins": ["string"],
      "createdAt": "ISO8601 timestamp",
      "lastUpdated": "ISO8601 timestamp"
    }
  ]
}
```

#### プロジェクト作成

```http
POST /api/admin/projects
Authorization: Bearer <token>
```

**権限:** `system_admin` のみ

**リクエスト:**
```json
{
  "name": "string",
  "description": "string",
  "owner": "string"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "プロジェクトを作成しました",
  "project": {
    "id": "string",
    "name": "string",
    "description": "string",
    "owner": "string"
  }
}
```

#### プロジェクト更新

```http
PUT /api/admin/projects/:projectId
Authorization: Bearer <token>
```

**権限:** `system_admin` のみ

**リクエスト:**
```json
{
  "name": "string",
  "description": "string"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "プロジェクト情報を更新しました"
}
```

### 設定 API

#### 設定取得

```http
GET /api/settings
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "success": true,
  "settings": {
    "key": "value"
  }
}
```

### バックアップ API

#### データバックアップ

```http
POST /api/backup
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "success": true,
  "message": "バックアップを作成しました",
  "backup": {
    "timestamp": "ISO8601 timestamp",
    "filename": "string"
  }
}
```

## エラーレスポンス

すべてのエラーレスポンスは以下の形式で返されます：

```json
{
  "success": false,
  "message": "エラーメッセージ"
}
```

### HTTP ステータスコード

- `200 OK` - リクエスト成功
- `201 Created` - リソース作成成功
- `400 Bad Request` - 不正なリクエスト
- `401 Unauthorized` - 認証が必要
- `403 Forbidden` - 権限不足
- `404 Not Found` - リソースが見つからない
- `409 Conflict` - リソースの競合
- `429 Too Many Requests` - レート制限超過
- `500 Internal Server Error` - サーバーエラー

## レート制限

API にはレート制限が設定されています：

- **一般的なリクエスト**: 15分間に100リクエスト
- **ログインAPI**: 15分間に5リクエスト

レート制限に達した場合、`429 Too Many Requests` が返されます。

## データベーススキーマ

### users テーブル

| カラム名     | 型   | 説明                                           |
| ------------ | ---- | ---------------------------------------------- |
| id           | TEXT | ユーザーID (主キー)                            |
| login_id     | TEXT | ログインID (ユニーク)                          |
| display_name | TEXT | 表示名                                         |
| email        | TEXT | メールアドレス (ユニーク)                      |
| password     | TEXT | bcryptハッシュ化パスワード                     |
| role         | TEXT | ユーザー権限 (user/project_admin/system_admin) |
| created_at   | TEXT | 作成日時                                       |
| last_login   | TEXT | 最終ログイン日時                               |

### projects テーブル

| カラム名     | 型   | 説明                                    |
| ------------ | ---- | --------------------------------------- |
| id           | TEXT | プロジェクトID (主キー)                 |
| name         | TEXT | プロジェクト名                          |
| description  | TEXT | プロジェクト説明                        |
| owner        | TEXT | オーナーユーザーID (外部キー: users.id) |
| settings     | TEXT | プロジェクト設定 (JSON)                 |
| created_at   | TEXT | 作成日時                                |
| last_updated | TEXT | 最終更新日時                            |

### project_members テーブル

| カラム名   | 型      | 説明                        |
| ---------- | ------- | --------------------------- |
| project_id | TEXT    | プロジェクトID (複合主キー) |
| user_id    | TEXT    | ユーザーID (複合主キー)     |
| is_admin   | INTEGER | 管理者フラグ (0 or 1)       |
| joined_at  | TEXT    | 参加日時                    |

### tasks テーブル

| カラム名        | 型      | 説明                                      |
| --------------- | ------- | ----------------------------------------- |
| id              | TEXT    | タスクID (主キー)                         |
| project         | TEXT    | プロジェクトID (外部キー: projects.id)    |
| title           | TEXT    | タスクタイトル                            |
| description     | TEXT    | タスク説明                                |
| assignee        | TEXT    | 担当者ID (外部キー: users.id)             |
| category        | TEXT    | カテゴリ                                  |
| priority        | TEXT    | 優先度 (high/medium/low)                  |
| status          | TEXT    | ステータス (todo/in_progress/review/done) |
| progress        | INTEGER | 進捗率 (0-100)                            |
| start_date      | TEXT    | 開始日                                    |
| due_date        | TEXT    | 期限日                                    |
| estimated_hours | REAL    | 見積もり時間                              |
| actual_hours    | REAL    | 実績時間                                  |
| tags            | TEXT    | タグ (JSON配列)                           |
| parent_task     | TEXT    | 親タスクID (外部キー: tasks.id)           |
| created_at      | TEXT    | 作成日時                                  |
| updated_at      | TEXT    | 更新日時                                  |

### settings テーブル

| カラム名     | 型   | 説明              |
| ------------ | ---- | ----------------- |
| key          | TEXT | 設定キー (主キー) |
| value        | TEXT | 設定値 (JSON)     |
| last_updated | TEXT | 最終更新日時      |

## セキュリティ

### 認証トークン

- JWT トークンは環境変数 `JWT_SECRET` で署名されます
- トークンの有効期限は設定可能（デフォルト: 24時間）
- "ログイン状態を保持" オプションで有効期限を30日間に延長可能

### パスワード

- bcrypt でハッシュ化（ソルトラウンド: 10）
- 最小文字数: 8文字
- パスワード強度チェック機能あり

### CORS

本番環境では、`ALLOWED_ORIGINS` 環境変数で許可するオリジンを設定してください。

### CSP (Content Security Policy)

Helmet により以下のセキュリティヘッダーが設定されます：

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`

## 開発者向けヒント

### API テスト

プロジェクトには API テスト用のスクリプトが含まれています：

```bash
# 一般APIテスト
npm run test-api

# 管理者APIテスト
npm run test-admin-api
```

### カスタムエンドポイントの追加

`server.js` にエンドポイントを追加する例：

```javascript
app.get('/api/custom', authenticateToken, async (req, res) => {
  try {
    // ロジックを実装
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

### データベースクエリ

`db/database.js` の `DatabaseManager` クラスを使用：

```javascript
const db = new DatabaseManager(DB_PATH);
const users = db.getAllUsers();
const user = db.getUserById('user_id');
```
