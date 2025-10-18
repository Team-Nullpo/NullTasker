# 古いファイルと新しいファイルの対応表

このドキュメントは、旧 Vanilla JavaScript ファイルと新しい React コンポーネントの対応関係を示します。

## 📁 ファイル対応表

### 認証関連

| 旧ファイル                   | 新ファイル                            | 状態    | 削除可能  |
| ---------------------------- | ------------------------------------- | ------- | --------- |
| `src/scripts/simple-auth.js` | `client/src/contexts/AuthContext.tsx` | ✅ 完了 | 🟡 移行後 |
| `src/scripts/register.js`    | `client/src/pages/RegisterPage.tsx`   | ✅ 完了 | 🟡 移行後 |
| `src/pages/login.html`       | `client/src/pages/LoginPage.tsx`      | ✅ 完了 | 🟡 移行後 |

### ページ関連

| 旧ファイル                    | 新ファイル                             | 状態      | 削除可能 |
| ----------------------------- | -------------------------------------- | --------- | -------- |
| `src/pages/index.html`        | `client/src/pages/DashboardPage.tsx`   | 📅 未実装 | ❌       |
| `src/pages/task.html`         | `client/src/pages/TaskPage.tsx`        | 📅 未実装 | ❌       |
| `src/pages/gantt.html`        | `client/src/pages/GanttPage.tsx`       | 📅 未実装 | ❌       |
| `src/pages/calendar.html`     | `client/src/pages/CalendarPage.tsx`    | 📅 未実装 | ❌       |
| `src/pages/setting.html`      | `client/src/pages/SettingsPage.tsx`    | 📅 未実装 | ❌       |
| `src/pages/user-profile.html` | `client/src/pages/UserProfilePage.tsx` | 📅 未実装 | ❌       |
| `src/pages/admin.html`        | `client/src/pages/AdminPage.tsx`       | 📅 未実装 | ❌       |

### スクリプト関連

| 旧ファイル                        | 新ファイル                              | 状態      | 削除可能  | 備考                           |
| --------------------------------- | --------------------------------------- | --------- | --------- | ------------------------------ |
| `src/scripts/task-manager.js`     | `client/src/services/taskService.ts`    | 📅 未実装 | ❌        | タスク CRUD 操作の参考に       |
| `src/scripts/ticket-manager.js`   | `client/src/services/taskService.ts`    | 📅 未実装 | ❌        | タスクデータ管理の参考に       |
| `src/scripts/gantt-manager.js`    | `client/src/components/GanttChart.tsx`  | 📅 未実装 | ❌        | ガントチャートロジックの参考に |
| `src/scripts/calendar-manager.js` | `client/src/components/Calendar.tsx`    | 📅 未実装 | ❌        | カレンダーロジックの参考に     |
| `src/scripts/settings-manager.js` | `client/src/pages/SettingsPage.tsx`     | 📅 未実装 | ❌        | 設定管理の参考に               |
| `src/scripts/admin-manager.js`    | `client/src/pages/AdminPage.tsx`        | 📅 未実装 | ❌        | 管理機能の参考に               |
| `src/scripts/user-manager.js`     | `client/src/services/userService.ts`    | 📅 未実装 | ❌        | ユーザー管理の参考に           |
| `src/scripts/user-profile.js`     | `client/src/pages/UserProfilePage.tsx`  | 📅 未実装 | ❌        | プロフィール機能の参考に       |
| `src/scripts/project-manager.js`  | `client/src/services/projectService.ts` | 📅 未実装 | ❌        | プロジェクト管理の参考に       |
| `src/scripts/sidebar.js`          | `client/src/components/Sidebar.tsx`     | 📅 未実装 | ❌        | サイドバーの参考に             |
| `src/scripts/utils.js`            | `client/src/utils/`                     | 📅 未実装 | ❌        | ユーティリティ関数の参考に     |
| `src/scripts/constants.js`        | `client/src/constants/`                 | 📅 未実装 | ❌        | 定数定義の参考に               |
| `src/scripts/config.js`           | `client/src/config/`                    | 📅 未実装 | ❌        | 設定の参考に                   |
| `src/scripts/main.js`             | `client/src/main.tsx`                   | ✅ 完了   | 🟡 移行後 | エントリーポイント             |

### スタイル関連

| 旧ファイル                  | 新ファイル                       | 状態        | 削除可能  | 備考                           |
| --------------------------- | -------------------------------- | ----------- | --------- | ------------------------------ |
| `src/styles/styles.css`     | `client/src/styles/index.css`    | 🔄 部分移行 | ❌        | グローバルスタイルを徐々に移行 |
| `src/styles/login.css`      | `client/src/styles/login.css`    | ✅ 完了     | 🟡 移行後 |                                |
| `src/styles/base.css`       | `client/src/styles/index.css`    | 📅 未実装   | ❌        | ベーススタイルの参考に         |
| `src/styles/components.css` | 各コンポーネント                 | 📅 未実装   | ❌        | コンポーネントスタイルの参考に |
| `src/styles/layout.css`     | `client/src/components/Layout/`  | 📅 未実装   | ❌        | レイアウトスタイルの参考に     |
| `src/styles/pages.css`      | 各ページコンポーネント           | 📅 未実装   | ❌        | ページスタイルの参考に         |
| `src/styles/sidebar.css`    | `client/src/components/Sidebar/` | 📅 未実装   | ❌        | サイドバースタイルの参考に     |
| `src/styles/admin.css`      | `client/src/pages/AdminPage/`    | 📅 未実装   | ❌        | 管理画面スタイルの参考に       |

### アセット

| 旧ファイル     | 新ファイル        | 状態      | 削除可能 |
| -------------- | ----------------- | --------- | -------- |
| `src/assets/*` | `client/public/*` | 🔄 移行中 | ❌       |

## 🗂️ 推奨アクション

### 今すぐ実行すべきこと

1. **アセットの移動**

   ```bash
   cp -r src/assets/* client/public/
   ```

2. **README の追加**（旧ファイル用）
   ```bash
   # src/README.md に警告を追加
   ```

### 段階的に実行すべきこと

各機能を React 化した後に対応する旧ファイルを削除：

1. ダッシュボード実装 → `src/pages/index.html`, `src/scripts/main.js` 削除
2. タスク管理実装 → `src/pages/task.html`, `src/scripts/task-manager.js`, `src/scripts/ticket-manager.js` 削除
3. ガントチャート実装 → `src/pages/gantt.html`, `src/scripts/gantt-manager.js` 削除
4. カレンダー実装 → `src/pages/calendar.html`, `src/scripts/calendar-manager.js` 削除
5. 設定実装 → `src/pages/setting.html`, `src/scripts/settings-manager.js` 削除
6. プロフィール実装 → `src/pages/user-profile.html`, `src/scripts/user-profile.js` 削除
7. 管理機能実装 → `src/pages/admin.html`, `src/scripts/admin-manager.js` 削除

### 最終的に削除するもの

すべての機能移行が完了したら：

```bash
rm -rf src/pages
rm -rf src/scripts
rm -rf src/styles  # client/src/styles に統合後
```

## 📊 削除チェックリスト

- [ ] ダッシュボード機能完全移行
- [ ] タスク管理機能完全移行
- [ ] ガントチャート機能完全移行
- [ ] カレンダー機能完全移行
- [ ] 設定機能完全移行
- [ ] プロフィール機能完全移行
- [ ] 管理機能完全移行
- [ ] すべてのスタイルを新構造に移行
- [ ] アセットを client/public に移行
- [ ] 旧ファイルの削除

## ⚠️ 注意事項

- **server.js** は現状維持（バックエンドとして必要）
- **config/** フォルダは保持（データファイル）
- **scripts/** の reset-data.js, generate-cert.js は保持（ユーティリティ）

---

最終更新: 2025-10-18
