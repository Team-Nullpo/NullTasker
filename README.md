# NullTasker

<div align="center">
  <img src="src/assets/logo.png" alt="NullTasker Logo" width="300">
  <p><strong>チーム向け総合タスク管理システム</strong></p>
  <p>効率的なプロジェクト管理とチームコラボレーションを実現</p>
</div>


## 📋 概要

NullTasker は、学生・チーム向けの Web ベースのタスク管理システムです。直感的なインターフェースと豊富な機能で、プロジェクトの進捗管理を効率化します。

### 🌟 主要機能

- **🔐 ユーザー認証**: JWT 認証によるセキュアなログイン・ログアウト機能
- **👤 ユーザー管理**: 階層化された権限システム（システム管理者・プロジェクト管理者・メンバー）
- **👤 ユーザープロフィール**: 個人設定・パスワード変更・プロフィール編集
- **ユーザープロフィール管理**: 包括的な管理機能（ユーザー管理・システム設定・バックアップ）
- **📊 ダッシュボード**: プロジェクト全体の進捗を一目で確認
- **✅ タスク管理**: 詳細なタスク作成・編集・追跡機能
- **📈 ガントチャート**: 視覚的なプロジェクトスケジュール管理
- **📅 カレンダー**: 期日と予定の統合管理
- **⚙️ 設定管理**: ユーザー・カテゴリ・通知の柔軟な設定
- **📱 レスポンシブ**: デスクトップ・モバイル対応
- **🔄 リアルタイム同期**: データの自動保存とバックアップ
- **🔒 セキュリティ**: bcrypt パスワードハッシュ化・CSP・レート制限
- **🔐 自動ログアウト**: 認証失効時に自動的にログイン画面へ遷移

## 🚀 クイックスタート

### 前提条件

- Node.js 14.0.0 以上
- npm または yarn
- OpenSSL（SSL 証明書生成に必要）
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

### インストール

詳細なセットアップ手順は [SETUP.md](docs/SETUP.md) をご覧ください。

```bash
# リポジトリのクローン
git clone https://github.com/Team-Nullpo/NullTasker.git

# プロジェクトディレクトリへ移動
cd NullTasker

# 依存関係のインストール
npm install

# 環境変数の設定（オプション）
cp .env.example .env

# SSL証明書の生成（HTTPS使用時）
npm run generate-cert
```

### 起動方法

#### 本番モード（HTTPS）

```bash
npm start
```

- サーバーアクセス: **https://localhost:3443**
- HTTP リダイレクト: http://localhost:3000 → https://localhost:3443

#### 開発モード（HTTPS + ホットリロード）

```bash
npm run dev
```

#### HTTP モード（HTTPS を無効化）

```bash
npm run start:http
# または
npm run dev:http
```

- サーバーアクセス: http://localhost:3000

> **⚠️ 証明書警告について**  
> HTTPS で初回アクセス時、ブラウザに証明書の警告が表示されます。  
> これは開発用の自己署名証明書を使用しているためで、正常な動作です。  
> 詳細は [HTTPS 設定ガイド](docs/HTTPS_SETUP.md) または [クイックスタート](docs/QUICKSTART_HTTPS.md) を参照してください。

### データベース管理

#### データリセット

開発・テスト用にデータリセットコマンドを提供しています。
詳細は [RESET.md](docs/RESET.md) をご覧ください。

```bash
npm run reset-data
```

#### データベース移行（旧JSON形式から）

```bash
npm run migrate
```

詳細は [DATABASE_MIGRATION.md](docs/DATABASE_MIGRATION.md) を参照してください。

### 初回ログイン

デフォルトの管理者アカウント：

- **ログイン ID**: `admin`
- **パスワード**: `admin123`

セキュリティのため、初回ログイン後にパスワードの変更を推奨します。

## 📁 プロジェクト構造

```
NullTasker/
├── LICENSE                     # ライセンスファイル
├── README.md                   # メインドキュメント
├── SECURITY.md                 # セキュリティガイドライン
├── package.json               # Node.js プロジェクト設定
├── .env.example               # 環境変数設定例
├── server.js                  # バックエンドサーバー (SQLite版)
├── server-constants.js        # サーバー定数定義
├── db/                        # データベース
│   ├── README.md              # データベース説明書
│   ├── nulltasker.db          # SQLiteデータベースファイル（自動生成・Git除外）
│   ├── schema.sql             # データベーススキーマ定義
│   ├── database.js            # データベース管理クラス
│   └── backups/               # データベースバックアップ（Git除外）
├── config/                    # 設定ファイル（ランタイム生成・Git除外）
│   ├── README.md              # 設定ディレクトリ説明書
│   └── backups/               # 設定バックアップ（Git除外）
├── docs/                      # ドキュメント
│   ├── SETUP.md               # セットアップガイド
│   ├── RESET.md               # データリセット説明書
│   ├── HTTPS_SETUP.md         # HTTPS設定ガイド
│   ├── QUICKSTART_HTTPS.md    # HTTPSクイックスタート
│   └── DATABASE_MIGRATION.md  # データベース移行ガイド
├── ssl/                       # SSL証明書（自動生成・Git除外）
│   ├── server.key             # 秘密鍵
│   └── server.cert            # 証明書
├── scripts/                   # 管理・開発用スクリプト
│   ├── reset-data.js          # データリセットスクリプト
│   ├── migrate-to-sqlite.js   # JSON→SQLiteマイグレーション
│   ├── generate-cert.js       # SSL証明書生成
│   ├── test-api.js            # API動作テスト
│   └── test-admin-api.js      # 管理者API動作テスト
└── src/                       # フロントエンドソースコード
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
    │   ├── auth-interceptor.js # 認証インターセプター（401/403エラー自動処理）
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

- **セキュアログイン**: bcrypt によるパスワードハッシュ化
- **JWT 認証**: JSON Web Token によるステートレスセッション管理
- **権限システム**: 3 階層権限（システム管理者・プロジェクト管理者・メンバー）
- **自動ログアウト**: 一定期間後の自動セッション終了
- **ログイン状態保持**: "ログイン状態を保持する"オプション
- **認証保護**: 全ページでのログイン状態チェック
- **認証失効時の自動リダイレクト**: トークン失効時に自動的にログイン画面へ遷移

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
- **優先度設定**: 高・中・低の 3 段階優先度
- **ステータス管理**: 未着手 → 進行中 → レビュー中 → 完了
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

## 🔧 技術スタック

### フロントエンド

- **HTML5/CSS3**: セマンティックマークアップ、FlexBox/Grid
- **Vanilla JavaScript (ES6+)**: モジュラー設計
- **LocalStorage**: クライアントサイドデータ永続化

### バックエンド

- **Node.js + Express.js**: Web アプリケーションフレームワーク
- **SQLite (better-sqlite3)**: 軽量・高速なデータベース
- **JWT**: トークンベース認証
- **bcrypt**: パスワードハッシュ化
- **Helmet**: セキュリティヘッダー
- **express-validator**: 入力値検証

詳細な技術仕様は [API ドキュメント](docs/API.md) と [アーキテクチャドキュメント](docs/ARCHITECTURE.md) を参照してください。

## 📚 ドキュメント

- **[セットアップガイド](docs/SETUP.md)** - 詳細なインストール手順
- **[開発ガイド](docs/DEVELOPMENT.md)** - 開発環境とコーディング規約
- **[API ドキュメント](docs/API.md)** - API 仕様とエンドポイント
- **[アーキテクチャ](docs/ARCHITECTURE.md)** - システム設計と構造
- **[コントリビューションガイド](docs/CONTRIBUTING.md)** - プロジェクトへの貢献方法
- **[データベース移行](docs/DATABASE_MIGRATION.md)** - JSON→SQLite 移行ガイド
- **[HTTPS 設定](docs/HTTPS_SETUP.md)** - SSL/TLS 証明書設定
- **[データリセット](docs/RESET.md)** - データベースリセット手順
- **[セキュリティ](docs/SECURITY.md)** - セキュリティ設定と対策
- **[プライバシーポリシー](docs/PRIVACY_POLICY.md)** - プライバシー保護方針
- **[利用規約](docs/TERMS_OF_SERVICE.md)** - サービス利用規約

## 🎨 ユーザーインターフェース

### デスクトップ版
- サイドバーナビゲーション（折りたたみ可能）
- レスポンシブレイアウト
- キーボードショートカット: `Ctrl+B`でサイドバー切り替え

### モバイル版
- ボトムナビゲーション（タッチフレンドリー）
- スワイプジェスチャー対応
- 小画面最適化 UI

## 🛠️ 開発・カスタマイズ

### 開発環境

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# データリセット（開発・テスト用）
npm run reset-data

# API テスト
npm run test-api
npm run test-admin-api
```

詳細は [開発ガイド](docs/DEVELOPMENT.md) を参照してください。

### カスタマイズ

- **テーマ変更**: `src/styles/` の CSS ファイルを編集
- **機能拡張**: `src/scripts/` のマネージャークラスで機能追加
- **UI 拡張**: HTML テンプレートと CSS スタイル追加

詳細は [アーキテクチャドキュメント](docs/ARCHITECTURE.md) を参照してください。

## 🚨 トラブルシューティング

よくある問題と解決方法については [セットアップガイド](docs/SETUP.md#トラブルシューティング) を参照してください。

### クイックヘルプ

```bash
# ポート使用状況確認
lsof -i :3000

# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# データベースリセット
npm run reset-data
```

## 🔒 セキュリティ

実装済みセキュリティ機能:
- bcrypt パスワードハッシュ化
- JWT 認証
- レート制限（DoS 対策）
- 入力検証
- セキュリティヘッダー（Helmet）
- CSP（XSS 対策）
- CORS 設定

詳細は [セキュリティガイド](docs/SECURITY.md) を参照してください。

セキュリティ上の問題を発見した場合は、公開 Issue ではなく、プロジェクトメンテナーに直接連絡してください。

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: 素晴らしい機能を追加'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

詳細は [コントリビューションガイド](docs/CONTRIBUTING.md) を参照してください。

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

- **バグ報告・機能提案**: [GitHub Issues](https://github.com/Team-Nullpo/NullTasker/issues)
- **質問・議論**: [GitHub Discussions](https://github.com/Team-Nullpo/NullTasker/discussions)
- **ドキュメント**: [docs/](docs/) ディレクトリ

## 📖 関連リンク

- [プロジェクトホーム](https://github.com/Team-Nullpo/NullTasker)
- [リリースノート](https://github.com/Team-Nullpo/NullTasker/releases)
- [コントリビューター](https://github.com/Team-Nullpo/NullTasker/graphs/contributors)

---

<div align="center">
  <p>Made with ❤️ by <strong>Team Nullpo</strong></p>
  <p><em>効率的なタスク管理で、チームの生産性を最大化</em></p>
  <p><strong>Version 1.1.0(beta)</strong> | <strong>Node.js 14.0.0+</strong></p>
</div>
