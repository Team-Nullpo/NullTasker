# NullTasker

<div align="center">
  <img src="src/assets/logo.png" alt="NullTasker Logo" width="300">
  <p><strong>チーム向け総合タスク管理システム</strong></p>
  <p>効率的なプロジェクト管理とチームコラボレーションを実現</p>
</div>

## 📋 概要

NullTaskerは、学生・チーム向けのWebベースのタスク管理システムです。直感的なインターフェースと豊富な機能で、プロジェクトの進捗管理を効率化します。

### 🌟 主要機能

- **🔐 ユーザー認証**: JWT認証によるセキュアなログイン・ログアウト機能
- **👤 ユーザー管理**: 階層化された権限システム（システム管理者・プロジェクト管理者・メンバー）
- **👤 ユーザープロフィール**: 個人設定・パスワード変更・プロフィール編集
- **🛡️ システム管理**: 包括的な管理機能（ユーザー管理・システム設定・バックアップ）
- **📊 ダッシュボード**: プロジェクト全体の進捗を一目で確認
- **✅ タスク管理**: 詳細なタスク作成・編集・追跡機能
- **📈 ガントチャート**: 視覚的なプロジェクトスケジュール管理
- **📅 カレンダー**: 期日と予定の統合管理
- **⚙️ 設定管理**: ユーザー・カテゴリ・通知の柔軟な設定
- **📱 レスポンシブ**: デスクトップ・モバイル対応
- **🔄 リアルタイム同期**: データの自動保存とバックアップ
- **🔒 セキュリティ**: bcryptパスワードハッシュ化・CSP・レート制限

## 🚀 クイックスタート

### 前提条件

- Node.js 14.0.0以上
- npm または yarn
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/Team-Nullpo/NullTasker.git

# 依存関係のインストール
npm install
```

### 起動方法

#### 開発環境
```bash
npm run dev
```

#### 本番環境
```bash
npm start
```

アプリケーションは `http://localhost:3000` で起動します。

### データリセット機能

開発・テスト用にデータリセットコマンドを提供しています。
詳細は `docs/RESET.md`をご覧ください。

### 初回ログイン

デフォルトの管理者アカウント：
- **ログインID**: `admin`
- **パスワード**: `admin123`

セキュリティのため、初回ログイン後にパスワードの変更を推奨します。

## 📁 プロジェクト構造

```
NullTasker/
├── LICENSE                     # ライセンスファイル
├── README.md                   # メインドキュメント
├── SECURITY.md                 # セキュリティガイドライン
├── package.json               # Node.js プロジェクト設定
├── server.js                  # バックエンドサーバー
├── config/                    # 設定・データファイル
│   ├── settings.json          # アプリケーション設定
│   ├── tickets.json           # タスクデータ
│   ├── users.json             # ユーザー認証データ
│   └── backups/               # バックアップファイル
├── docs/                      # ドキュメント
│   └── RESET.md               # データリセット説明書
├── public/                    # 静的ファイル（将来の拡張用）
├── scripts/                   # 管理・開発用スクリプト
│   └── reset-data.js          # データリセットスクリプト
└── src/                       # ソースコード
    ├── assets/                # アセット（画像等）
    │   └── logo.png           # アプリケーションロゴ
    ├── pages/                 # HTMLページ
    │   ├── index.html         # ダッシュボード
    │   ├── login.html         # ログインページ
    │   ├── register.html      # ユーザー登録
    │   ├── task.html          # タスク管理
    │   ├── gantt.html         # ガントチャート
    │   ├── calendar.html      # カレンダー
    │   ├── setting.html       # 設定
    │   ├── user-profile.html  # ユーザープロフィール
    │   ├── admin.html         # システム管理
    │   └── debug-storage.html # ストレージデバッグ
    ├── scripts/               # JavaScript
    │   ├── main.js            # メインエントリーポイント
    │   ├── script.js          # メインスクリプト
    │   ├── simple-auth.js     # 認証モジュール
    │   ├── register.js        # ユーザー登録機能
    │   ├── task-manager.js    # タスク管理機能
    │   ├── calendar-manager.js # カレンダー機能
    │   ├── gantt-manager.js   # ガントチャート機能
    │   ├── settings-manager.js # 設定管理機能
    │   ├── admin-manager.js   # システム管理機能
    │   ├── user-profile.js    # ユーザープロフィール機能
    │   ├── sidebar.js         # サイドバー制御
    │   └── utils.js           # 共通ユーティリティ
    └── styles/                # CSS
        ├── styles.css         # メインスタイルシート
        ├── login.css          # ログインページスタイル
        ├── base.css           # ベーススタイル
        ├── components.css     # コンポーネントスタイル
        ├── layout.css         # レイアウトスタイル
        ├── pages.css          # ページ固有スタイル
        ├── responsive.css     # レスポンシブデザイン
        ├── sidebar.css        # サイドバースタイル
        ├── admin.css          # 管理画面スタイル
        └── user-dropdown.css  # ユーザードロップダウンスタイル
```

## 🎯 詳細機能

### ユーザー認証・権限管理
- **セキュアログイン**: bcryptによるパスワードハッシュ化
- **JWT認証**: JSON Web Tokenによるステートレスセッション管理
- **権限システム**: 3階層権限（システム管理者・プロジェクト管理者・メンバー）
- **自動ログアウト**: 一定期間後の自動セッション終了
- **ログイン状態保持**: "ログイン状態を保持する"オプション
- **認証保護**: 全ページでのログイン状態チェック

### ユーザープロフィール管理
- **プロフィール編集**: 表示名・メールアドレスの変更
- **セキュアなパスワード変更**: 現在のパスワード確認必須
- **パスワード強度チェック**: リアルタイムの強度判定とフィードバック
- **個人設定**: テーマ・通知設定のカスタマイズ
- **ユーザー情報表示**: ログイン中のユーザー情報とドロップダウンメニュー

### システム管理機能
- **ユーザー管理**: チームメンバーの作成・編集・削除
- **権限管理**: 階層化された権限の付与・変更
- **プロジェクト管理**: プロジェクトの作成・設定・メンバー割り当て
- **システム設定**: アプリケーション全体の設定管理
- **バックアップ機能**: データの定期バックアップと手動バックアップ
- **データ復元**: バックアップファイルからのデータ復元
- **ダッシュボード**: システム全体の統計とクイックアクセス

### タスク管理
- **作成・編集**: 直感的なモーダルフォームでタスク管理
- **優先度設定**: 高・中・低の3段階優先度
- **ステータス管理**: 未着手→進行中→レビュー中→完了
- **進捗追跡**: パーセンテージベースの進捗管理
- **担当者割当**: チームメンバーへのタスク割り当て
- **カテゴリ分類**: プロジェクトに応じた柔軟なカテゴリ設定

### ガントチャート
- **視覚的スケジュール**: タスクの開始・終了日を視覚化
- **進捗表示**: リアルタイムの進捗状況を色分け表示
- **期間設定**: 日・週・月単位でのビュー切り替え
- **インタラクティブ**: クリックでタスク詳細表示

### カレンダー機能
- **月次表示**: 月全体のタスク配置を確認
- **日次詳細**: 選択日のタスク一覧とクイック追加
- **期日管理**: 期日の近いタスクを強調表示
- **統合ビュー**: 全プロジェクトのタスクを統合表示

### 設定システム
- **ユーザー管理**: チームメンバーの追加・削除
- **カテゴリ管理**: プロジェクト固有カテゴリの設定
- **通知設定**: メール・デスクトップ・リマインダー設定
- **データ管理**: インポート・エクスポート・バックアップ機能

## 🔧 技術仕様

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: FlexBox・Grid・アニメーション
- **Vanilla JavaScript**: ES6+モジュラー設計
- **LocalStorage**: クライアントサイドデータ永続化

### バックエンド
- **Node.js**: サーバーサイドJavaScript
- **Express.js**: Webアプリケーションフレームワーク
- **bcrypt**: パスワードハッシュ化ライブラリ
- **jsonwebtoken**: JWT認証トークン管理
- **helmet**: セキュリティヘッダー設定
- **cors**: クロスオリジンリクエスト対応
- **express-rate-limit**: レート制限によるDoS攻撃対策
- **express-validator**: 入力値検証
- **JSON**: ファイルベースデータストレージ

### データ構造

#### タスクデータ（tickets.json）
```json
{
  "tasks": [
    {
      "id": "task_1724745600123_456",
      "title": "新機能の設計",
      "description": "ユーザーインターフェースの設計と仕様策定",
      "assignee": "田中太郎",
      "startDate": "2025-08-27",
      "dueDate": "2025-09-05",
      "priority": "high",
      "category": "設計",
      "status": "in_progress",
      "progress": 75,
      "createdAt": "2025-08-27T10:00:00.000Z",
      "updatedAt": "2025-08-27T15:30:00.000Z"
    }
  ],
  "lastUpdated": "2025-08-27T15:30:00.000Z"
}
```

#### ユーザーデータ（users.json）
```json
{
  "users": [
    {
      "id": "admin",
      "loginId": "admin",
      "displayName": "管理者",
      "email": "admin@nulltasker.com",
      "role": "system_admin",
      "password": "$2b$10$RiZky4vC9rq4qgolc79uc.d8GCvpXz5tmA5gaFxBlv0wVpuUpsI0O",
      "createdAt": "2025-09-01T00:00:00.000Z",
      "lastLogin": null
    }
  ],
  "lastUpdated": "2025-09-01T00:00:00.000Z"
}
```

#### 設定データ（settings.json）
```json
{
  "categories": [
    "企画",
    "開発", 
    "デザイン",
    "テスト",
    "ドキュメント",
    "会議",
    "その他"
  ],
  "users": [
    "田中太郎",
    "佐藤花子", 
    "山田次郎",
    "鈴木美咲",
    "高橋健一"
  ],
  "priorities": [
    {"value": "high", "label": "高優先度", "color": "#c62828"},
    {"value": "medium", "label": "中優先度", "color": "#ef6c00"},
    {"value": "low", "label": "低優先度", "color": "#2e7d32"}
  ],
  "statuses": [
    {"value": "todo", "label": "未着手", "color": "#666"},
    {"value": "in_progress", "label": "進行中", "color": "#1976d2"},
    {"value": "review", "label": "レビュー中", "color": "#f57c00"},
    {"value": "done", "label": "完了", "color": "#388e3c"}
  ]
}
```

## 🎨 ユーザーインターフェース

### デスクトップ版
- **サイドバーナビゲーション**: 折りたたみ可能な左側メニュー
- **レスポンシブレイアウト**: 画面サイズに応じた最適表示
- **キーボードショートカット**: `Ctrl+B`でサイドバー切り替え

### モバイル版
- **ボトムナビゲーション**: タッチフレンドリーな下部メニュー
- **スワイプジェスチャー**: 直感的な操作体験
- **最適化UI**: 小画面での視認性とユーザビリティ

## 📊 データ管理

### 自動保存機能
- **リアルタイム同期**: 変更は即座にlocalStorageに保存
- **サーバー同期**: 定期的なサーバー側データ同期
- **競合解決**: 複数ユーザー編集時の競合処理

### バックアップシステム
- **定期バックアップ**: 設定した間隔で自動バックアップ
- **手動エクスポート**: JSONフォーマットでデータダウンロード
- **インポート機能**: 既存データの復元・移行

### ストレージ管理
- **使用量表示**: ローカルストレージ使用量の可視化
- **データクリア**: 全データの一括削除機能
- **デバッグモード**: 開発者向けストレージ詳細表示

### API仕様

### 認証API
```http
POST /api/login          # ユーザーログイン
POST /api/register       # ユーザー登録
POST /api/logout         # ログアウト
POST /api/validate-token # トークン検証
GET  /api/user           # ユーザー情報取得
PUT  /api/user/profile   # プロフィール更新
PUT  /api/user/password  # パスワード変更
```

### タスクAPI
```http
GET  /api/tasks          # 全タスク取得（認証必須）
POST /api/tasks          # タスクデータ保存（認証必須）
```

### 管理者API
```http
GET  /api/admin/users        # 全ユーザー取得（システム管理者のみ）
POST /api/admin/users        # ユーザー作成（システム管理者のみ）
PUT  /api/admin/users/:id    # ユーザー更新（システム管理者のみ）
DELETE /api/admin/users/:id  # ユーザー削除（システム管理者のみ）
```

### バックアップAPI
```http
POST /api/backup         # データバックアップ（認証必須）
```

### 設定API
```http
GET  /api/settings       # 設定取得（認証必須）
```

## 🛠️ 開発・カスタマイズ

### 開発環境セットアップ
```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# 本番サーバー起動
npm start

# データリセット（開発・テスト用）
npm run reset

# デバッグモード
DEBUG=nulltasker:* npm run dev
```

### 開発・デバッグツール
- **debug-storage.html**: LocalStorageの内容確認とクリア
- **debug-users.html**: ユーザーデータの詳細確認
- **test-login.html**: ログイン機能のテスト
- **test-css.html**: CSSスタイルのテスト

### カスタマイズポイント
- **テーマ変更**: `src/styles/`ディレクトリのCSSファイルでカラースキーム調整
- **機能拡張**: `src/scripts/`の各マネージャークラスで機能追加
- **データスキーマ**: JSONスキーマの拡張・変更
- **UI拡張**: HTMLテンプレートとCSSスタイル追加
- **権限システム**: ロールベースアクセス制御の拡張

## 🚨 トラブルシューティング

### よくある問題

#### サーバー起動エラー
```bash
# ポート使用状況確認
lsof -i :3000

# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### データが保存されない
1. **ブラウザ設定**: LocalStorageが有効か確認
2. **ディスク容量**: 十分な空き容量があるか確認
3. **権限確認**: ファイル書き込み権限を確認

#### パフォーマンス問題
1. **ブラウザキャッシュ**: キャッシュクリアを実行
2. **データサイズ**: 大量データ時の分割読み込み
3. **メモリ使用量**: ブラウザタブの整理

### ログ確認
```bash
# アプリケーションログ（コンソール出力）
npm run dev

# データリセット操作ログ
npm run reset -- --verbose
```

## 🔒 セキュリティ

### 実装済みセキュリティ機能
- **パスワードハッシュ化**: bcryptによる安全なパスワード保存
- **JWT認証**: ステートレストークン認証
- **レート制限**: 総合・ログイン・API別のレート制限
- **入力検証**: express-validatorによる包括的な入力値検証
- **セキュリティヘッダー**: Helmetによる各種セキュリティヘッダー設定
- **CSP（Content Security Policy）**: XSS攻撃対策
- **CORS設定**: クロスオリジンリクエストの厳格な制御

### セキュリティ設定
```javascript
// 本番環境では必須
JWT_SECRET=your-super-secure-secret-key

// CORS設定（本番環境）
ALLOWED_ORIGINS=https://yourdomain.com

// レート制限設定
RATE_LIMIT_WINDOW_MS=900000  // 15分
RATE_LIMIT_MAX_REQUESTS=100  // 最大リクエスト数
```


## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/Team-Nullpo/NullTasker/issues)
- **Wiki**: [プロジェクトWiki](https://github.com/Team-Nullpo/NullTasker/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/Team-Nullpo/NullTasker/discussions)

---

<div align="center">
  <p>Made with ❤️ by <strong>Team Nullpo</strong></p>
  <p><em>効率的なタスク管理で、チームの生産性を最大化</em></p>
  <p><strong>Version 1.1.0(beta)</strong> | <strong>Node.js 14.0.0+</strong></p>
</div>