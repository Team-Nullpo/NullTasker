# 🔄 段階的移行ガイド

## 現在の状況

プロジェクトは現在、**移行期間中**です：

```
✅ 新しいコード: client/src/     (TypeScript + React)
⚠️  旧コード:     src/            (Vanilla JavaScript - 削除予定)
✅ バックエンド:   server.js       (そのまま維持)
```

## 📋 旧ファイルの扱い方

### なぜ旧ファイルを残しているのか？

1. **参考資料** - 既存のビジネスロジックを確認しながら React 化
2. **段階的移行** - 一度にすべてを書き換えるリスクを回避
3. **バックアップ** - 万が一の際の保険

### いつ削除するのか？

各機能の React 実装が完了し、動作確認が取れたら、対応する旧ファイルを削除します。

## 🗂️ ファイル対応表

詳細は **[OLD_FILES_MAPPING.md](./OLD_FILES_MAPPING.md)** を参照

## 📝 移行作業の進め方

### ステップ 1: 旧ファイルを確認

例: タスク管理機能を実装する場合

```bash
# 参考にするファイル
src/scripts/task-manager.js      # ビジネスロジック
src/scripts/ticket-manager.js    # データ管理
src/pages/task.html               # UI構造
src/styles/pages.css              # スタイル
```

### ステップ 2: 新しいファイルを作成

```bash
# 新しく作成するファイル
client/src/pages/TaskPage.tsx           # メインページ
client/src/services/taskService.ts      # API通信
client/src/components/TaskList.tsx      # コンポーネント
client/src/components/TaskForm.tsx      # フォーム
client/src/styles/task.css              # スタイル
```

### ステップ 3: 実装 & テスト

1. React コンポーネントとして実装
2. 既存のロジックを TypeScript で書き直し
3. 動作確認

### ステップ 4: 旧ファイルの削除

動作確認が完了したら：

```bash
# 例: タスク管理機能の旧ファイル削除
rm src/scripts/task-manager.js
rm src/scripts/ticket-manager.js
rm src/pages/task.html
# 対応するスタイルも確認して削除
```

### ステップ 5: マッピングファイルの更新

`OLD_FILES_MAPPING.md` の対応表を更新：

```markdown
| `src/scripts/task-manager.js` | `client/src/services/taskService.ts` | ✅ 完了 | ✅ 削除済 |
```

## 🎯 移行の優先順位

### Phase 1: 基盤（✅ 完了）

- [x] プロジェクト構造
- [x] TypeScript 設定
- [x] 認証システム
- [x] ルーティング

### Phase 2: コアページ（🚧 進行中）

- [ ] ダッシュボード
- [ ] タスク管理
- [ ] 共通レイアウト（サイドバー、ヘッダー）

### Phase 3: 詳細機能（📅 未着手）

- [ ] ガントチャート
- [ ] カレンダー
- [ ] 設定管理
- [ ] ユーザープロフィール

### Phase 4: 管理機能（📅 未着手）

- [ ] 管理者ダッシュボード
- [ ] ユーザー管理
- [ ] プロジェクト管理

### Phase 5: クリーンアップ

- [ ] すべての旧ファイルを削除
- [ ] スタイルの統合
- [ ] ドキュメント整理

## ⚠️ 重要なルール

### ✅ DO（推奨）

- 新しいコードは `client/src/` に書く
- 旧ファイルは**読み取り専用**として扱う
- 機能ごとに段階的に移行する
- 動作確認を十分に行ってから旧ファイルを削除
- 削除前に git でコミットしておく

### ❌ DON'T（非推奨）

- `src/` ディレクトリのファイルを編集しない
- すべての旧ファイルを一度に削除しない
- テストせずに旧ファイルを削除しない
- バックアップなしで削除しない

## 🔍 チェックリスト

機能を移行する前に：

- [ ] 旧ファイルのロジックを理解した
- [ ] 必要な型定義を追加した
- [ ] API 仕様を確認した

機能を移行した後に：

- [ ] 新しいコードが動作することを確認した
- [ ] すべてのエッジケースをテストした
- [ ] スタイルが正しく適用されている
- [ ] エラーハンドリングが適切
- [ ] コードをコミットした
- [ ] 旧ファイルを削除した
- [ ] マッピングファイルを更新した

## 📊 進捗追跡

```bash
# 残っている旧ファイルの数を確認
find src/pages -name "*.html" | wc -l
find src/scripts -name "*.js" | wc -l

# 新しいコンポーネントの数を確認
find client/src/pages -name "*.tsx" | wc -l
find client/src/components -name "*.tsx" | wc -l
```

## 🎓 学習リソース

移行作業の参考に：

- **既存の成功例**: `client/src/pages/LoginPage.tsx`
- **認証の実装**: `client/src/contexts/AuthContext.tsx`
- **API 通信**: `client/src/services/authService.ts`

## 📞 サポート

質問や問題がある場合：

1. `IMPLEMENTATION_STATUS.md` で実装状況を確認
2. `OLD_FILES_MAPPING.md` で対応関係を確認
3. Issue を作成して相談

---

**Team Nullpo** - 段階的移行を成功させましょう！🚀
