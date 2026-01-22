# コントリビューションガイド

NullTasker プロジェクトへの貢献に興味を持っていただきありがとうございます！このガイドでは、プロジェクトに貢献する方法について説明します。

## 行動規範

このプロジェクトに参加するすべての人は、以下の行動規範に従うことが期待されます：

- **尊重**: 他の貢献者を尊重し、建設的なフィードバックを提供する
- **協力**: チームとして協力し、知識を共有する
- **包括性**: すべての背景を持つ人々を歓迎する
- **プロフェッショナリズム**: 礼儀正しく、プロフェッショナルなコミュニケーションを維持する

## 貢献の方法

### バグ報告

バグを発見した場合は、GitHub Issues で報告してください。

**良いバグ報告には以下が含まれます：**

- **明確なタイトル**: 問題を簡潔に説明
- **再現手順**: バグを再現するための詳細な手順
- **期待される動作**: 何が起こるべきか
- **実際の動作**: 実際に何が起こったか
- **環境情報**: OS、ブラウザ、Node.jsバージョンなど
- **スクリーンショット**: 可能であれば画像を添付

**テンプレート例：**

```markdown
## バグの説明
タスク作成時にカレンダーが正しく表示されない

## 再現手順
1. タスクページを開く
2. 「新規タスク」をクリック
3. 期限日フィールドをクリック

## 期待される動作
カレンダーピッカーが表示される

## 実際の動作
カレンダーが表示されず、エラーが発生

## 環境
- OS: Windows 11
- ブラウザ: Chrome 120
- Node.js: 18.17.0

## スクリーンショット
[画像を添付]
```

### 機能提案

新機能のアイデアがある場合：

1. **既存の Issue を確認**: 同じ提案がないか確認
2. **GitHub Discussions で議論**: まず Discussions で提案を共有
3. **Issue を作成**: 合意が得られたら Issue として正式に提案

**機能提案には以下を含めてください：**

- **ユースケース**: なぜこの機能が必要か
- **提案する解決策**: どのように実装するか
- **代替案**: 他の可能な解決策
- **追加コンテキスト**: 参考資料やスクリーンショット

### コードによる貢献

#### 開発環境のセットアップ

1. **リポジトリをフォーク**
   ```bash
   # GitHubでフォークボタンをクリック
   ```

2. **ローカルにクローン**
   ```bash
   git clone https://github.com/YOUR_USERNAME/NullTasker.git
   cd NullTasker
   ```

3. **依存関係をインストール**
   ```bash
   npm install
   ```

4. **環境変数を設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集
   ```

5. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

#### ブランチ戦略

```
main          - 本番環境用の安定版
  └─ develop  - 開発用メインブランチ
       ├─ feature/xxx   - 新機能開発
       ├─ bugfix/xxx    - バグ修正
       └─ hotfix/xxx    - 緊急修正
```

**ブランチ命名規則：**

- `feature/task-filter` - 新機能
- `bugfix/calendar-date-issue` - バグ修正
- `hotfix/security-patch` - 緊急修正
- `refactor/cleanup-utils` - リファクタリング
- `docs/update-readme` - ドキュメント更新

#### 開発ワークフロー

1. **Issue を確認または作成**
   ```bash
   # GitHub Issues で作業する Issue を確認
   ```

2. **ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **コードを実装**
   - コーディング規約に従う（[DEVELOPMENT.md](DEVELOPMENT.md) 参照）
   - 小さな単位でコミット
   - 明確なコミットメッセージ

4. **テスト**
   ```bash
   npm run test-api
   npm run test-admin-api
   ```

5. **コミット**
   ```bash
   git add .
   git commit -m "feat: タスクフィルター機能を追加"
   ```

6. **プッシュ**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **プルリクエストを作成**
   - GitHub でプルリクエストを作成
   - テンプレートに従って記入

### コミットメッセージ規約

Conventional Commits 形式を使用します：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル変更（機能に影響なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルドプロセスやツールの変更

**例:**

```bash
# 良い例
feat(tasks): タスクフィルター機能を追加
fix(auth): ログイン時のトークン検証エラーを修正
docs(readme): セットアップ手順を更新

# 詳細な例
feat(calendar): 月次ビューにタスクを表示

カレンダーの月次ビューに、その日のタスク数を表示する
機能を追加しました。

- タスク数バッジを追加
- クリックでタスク詳細モーダルを表示
- パフォーマンス最適化のためキャッシュを実装

Closes #123
```

### プルリクエストガイドライン

#### プルリクエストの作成前

- [ ] コードがコーディング規約に従っている
- [ ] すべてのテストが通過している
- [ ] 新機能にはテストが含まれている
- [ ] ドキュメントが更新されている
- [ ] コミットメッセージが規約に従っている

#### プルリクエストテンプレート

```markdown
## 概要
このPRは何を解決しますか？

## 変更内容
- 変更点1
- 変更点2
- 変更点3

## 関連Issue
Closes #123

## テスト方法
1. 手順1
2. 手順2
3. 期待される結果

## スクリーンショット
UIの変更がある場合は画像を添付

## チェックリスト
- [ ] コーディング規約に従っている
- [ ] テストが通過している
- [ ] ドキュメントを更新している
- [ ] コミットメッセージが適切
```

#### レビュープロセス

1. **自動チェック**: CI/CDが自動的に実行
2. **コードレビュー**: メンテナーがレビュー
3. **修正**: 必要に応じて修正
4. **承認**: レビュー承認後にマージ

#### レビューを受ける際の心構え

- フィードバックを建設的に受け止める
- 質問や提案に丁寧に対応する
- 必要に応じて説明を追加する
- タイムリーに対応する

## コーディング規約

詳細は [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

### クイックリファレンス

**JavaScript:**
```javascript
// 良い例
class TaskManager {
  constructor() {
    this.tasks = [];
  }
  
  async loadTasks() {
    try {
      const response = await fetch('/api/tasks');
      this.tasks = await response.json();
    } catch (error) {
      console.error('タスク読み込みエラー:', error);
    }
  }
}

// 悪い例
class taskmanager {
  constructor() {
    this.Tasks = []
  }
  
  loadTasks() {
    fetch('/api/tasks').then(response => {
      this.Tasks = response.json()
    })
  }
}
```

**CSS:**
```css
/* 良い例 */
.task-card {
  padding: 1rem;
  border: 1px solid #ddd;
}

.task-card__title {
  font-size: 1.2rem;
  font-weight: bold;
}

/* 悪い例 */
.TaskCard {
  padding:1rem;
  border:1px solid #ddd;
}
```

## ドキュメントへの貢献

ドキュメントの改善も大歓迎です：

- **誤字脱字の修正**
- **不明瞭な説明の改善**
- **例やチュートリアルの追加**
- **翻訳**

### ドキュメント構成

```
docs/
├── SETUP.md              # セットアップガイド
├── DEVELOPMENT.md        # 開発ガイド
├── API.md                # API ドキュメント
├── ARCHITECTURE.md       # アーキテクチャ
├── CONTRIBUTING.md       # このファイル
├── DATABASE_MIGRATION.md # マイグレーションガイド
├── HTTPS_SETUP.md        # HTTPS設定
├── QUICKSTART_HTTPS.md   # HTTPSクイックスタート
├── RESET.md              # データリセット
├── SECURITY.md           # セキュリティガイド
├── PRIVACY_POLICY.md     # プライバシーポリシー
└── TERMS_OF_SERVICE.md   # 利用規約
```

## コミュニティ

### コミュニケーションチャンネル

- **GitHub Issues**: バグ報告、機能提案
- **GitHub Discussions**: 一般的な議論、質問
- **Pull Requests**: コードレビュー、議論

### 質問の仕方

良い質問には以下が含まれます：

- **具体的な問題**: 何を達成しようとしているか
- **試したこと**: これまでの試み
- **環境情報**: バージョン、OS など
- **エラーメッセージ**: 完全なエラーログ

## ライセンス

このプロジェクトに貢献することにより、あなたの貢献が MIT ライセンスの下でライセンスされることに同意するものとします。

## 認識と謝辞

すべての貢献者は、プロジェクトの README や貢献者リストで認識されます。

## はじめての貢献

プロジェクトへの貢献が初めての方は、以下のラベルが付いた Issue から始めることをお勧めします：

- `good first issue`: 初心者向けの簡単な Issue
- `help wanted`: コントリビューターの助けを求めている Issue
- `documentation`: ドキュメント関連の作業

## サポートが必要な場合

- [DEVELOPMENT.md](DEVELOPMENT.md) - 開発ガイド
- [API.md](API.md) - API ドキュメント
- [GitHub Discussions](https://github.com/Team-Nullpo/NullTasker/discussions) - 質問フォーラム

## 最後に

あなたの貢献は、NullTasker をより良いプロジェクトにするために非常に価値があります。
どんな小さな貢献でも歓迎します！

質問がある場合は、遠慮なく Issue や Discussion で質問してください。

**Happy Coding! 🎉**
