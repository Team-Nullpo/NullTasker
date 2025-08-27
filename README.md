# NullTasker

<div align="center">
  <img src="src/assets/logo.png" alt="NullTasker Logo" width="300">
  <p><strong>チーム向け総合タスク管理システム</strong></p>
  <p>効率的なプロジェクト管理とチームコラボレーションを実現</p>
</div>

## 📋 概要

NullTaskerは、学生向けのWebベースのタスク管理システムです。直感的なインターフェースと豊富な機能で、プロジェクトの進捗管理を効率化します。

### 🌟 主要機能

- **📊 ダッシュボード**: プロジェクト全体の進捗を一目で確認
- **✅ タスク管理**: 詳細なタスク作成・編集・追跡機能
- **📈 ガントチャート**: 視覚的なプロジェクトスケジュール管理
- **📅 カレンダー**: 期日と予定の統合管理
- **⚙️ 設定管理**: ユーザー・カテゴリ・通知の柔軟な設定
- **📱 レスポンシブ**: デスクトップ・モバイル対応
- **🔄 リアルタイム同期**: データの自動保存とバックアップ

## 🚀 クイックスタート

### 前提条件

- Node.js 14.0.0以上
- npm または yarn
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/Team-Nullpo/NullTasker.git
cd NullTasker

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

## 📁 プロジェクト構造

```
NullTasker/
├── LICENSE                     # ライセンスファイル
├── README.md                   # メインドキュメント
├── package.json               # Node.js プロジェクト設定
├── server.js                  # バックエンドサーバー
├── config/                    # 設定・データファイル
│   ├── settings.json          # アプリケーション設定
│   └── tickets.json           # タスクデータ
├── public/                    # 静的ファイル（将来の拡張用）
└── src/                       # ソースコード
    ├── assets/                # アセット（画像等）
    │   └── logo.png           # アプリケーションロゴ
    ├── pages/                 # HTMLページ
    │   ├── index.html         # ダッシュボード
    │   ├── task.html          # タスク管理
    │   ├── gantt.html         # ガントチャート
    │   ├── calendar.html      # カレンダー
    │   ├── setting.html       # 設定
    │   └── debug-storage.html # デバッグ用
    ├── scripts/               # JavaScript
    │   ├── main.js            # メインエントリーポイント
    │   ├── script.js          # メインスクリプト
    │   ├── task-manager.js    # タスク管理機能
    │   ├── calendar-manager.js # カレンダー機能
    │   ├── gantt-manager.js   # ガントチャート機能
    │   ├── settings-manager.js # 設定管理機能
    │   ├── sidebar.js         # サイドバー制御
    │   └── utils.js           # 共通ユーティリティ
    └── styles/                # CSS
        ├── styles.css         # メインスタイルシート
        ├── base.css           # ベーススタイル
        ├── components.css     # コンポーネントスタイル
        ├── layout.css         # レイアウトスタイル
        ├── pages.css          # ページ固有スタイル
        ├── responsive.css     # レスポンシブデザイン
        └── sidebar.css        # サイドバースタイル
```

## 🎯 詳細機能

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
- **JSON**: ファイルベースデータストレージ
- **CORS**: クロスオリジンリクエスト対応

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

### タスクAPI
```http
GET  /api/tasks          # 全タスク取得
POST /api/tasks          # タスクデータ保存
```

### バックアップAPI
```http
POST /api/backup         # データバックアップ
```

### 設定API
```http
GET  /api/settings       # 設定取得
```

## 🛠️ 開発・カスタマイズ

### 開発環境セットアップ
```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# ファイル監視モード
npm run watch

# デバッグモード
DEBUG=nulltasker:* npm run dev
```

### カスタマイズポイント
- **テーマ変更**: `src/styles/`ディレクトリのCSSファイルでカラースキーム調整
- **機能拡張**: `src/scripts/`の各マネージャークラスで機能追加
- **データスキーマ**: JSONスキーマの拡張・変更
- **UI拡張**: HTMLテンプレートとCSSスタイル追加

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
# アプリケーションログ
tail -f logs/app.log

# エラーログ
tail -f logs/error.log
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
</div>