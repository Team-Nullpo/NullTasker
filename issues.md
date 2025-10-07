# NullTasker - バグ・問題リスト

最終更新日: 2025年10月7日

## 🔴 重大なバグ

### 1. task-manager.js - 変数名の誤り
**ファイル**: `src/scripts/task-manager.js`  
**行**: 44  
**問題**: `response.status}`の後に、未定義の変数`a.status`を参照している
```javascript
throw new Error(`HTTP error! status: ${a.status}`);
```
**修正案**: `a.status` → `projectResponse.status`

### 2. calendar.html - 存在しないJSファイルの参照
**ファイル**: `src/pages/calendar.html`  
**行**: 17  
**問題**: 存在しない`script.js`ファイルを読み込んでいる
```html
<script type="module" src="../scripts/script.js"></script>
```
**修正案**: この行を削除するか、正しいファイル名に変更

### 3. gantt.html - 存在しないJSファイルの参照
**ファイル**: `src/pages/gantt.html`  
**行**: 17  
**問題**: 存在しない`script.js`ファイルを読み込んでいる
```html
<script type="module" src="../scripts/script.js"></script>
```
**修正案**: この行を削除するか、正しいファイル名に変更

## 🟡 中程度のバグ

### 4. task.html - ボトムナビゲーションのリンクパス不一致
**ファイル**: `src/pages/task.html`  
**行**: 97-109  
**問題**: ボトムナビゲーションのリンクが`/`や`/task`など絶対パスになっているが、他のリンクは相対パス
```html
<a href="/" class="nav-item">
<a href="/task" class="nav-item active">
```
**修正案**: 他のページと同様に相対パスに統一する（例: `index.html`, `task.html`）

### 5. user-profile.html - Font Awesomeの重複読み込み
**ファイル**: `src/pages/user-profile.html`  
**行**: 9, 13  
**問題**: Font AwesomeのCSSが2回読み込まれている
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<!-- 中略 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
```
**修正案**: 重複している方の行を削除

### 6. user-profile.html - user-profile.jsの重複読み込み
**ファイル**: `src/pages/user-profile.html`  
**行**: 11, 189  
**問題**: user-profile.jsが2回読み込まれている
```html
<script type="module" src="../scripts/user-profile.js"></script>
<!-- 最後に -->
<script type="module" src="../scripts/user-profile.js"></script>
```
**修正案**: 重複している方の行を削除

## 🟢 軽微なバグ・改善点

### 7. HTMLファイル全般 - faviconの設定漏れ
**ファイル**: すべてのHTMLファイル  
**問題**: faviconの設定が全てのHTMLファイルで欠けていた
**状態**: ✅ 修正済み（2025/10/07）

### 8. calendar.html - HTMLとJavaScriptのID不一致の可能性
**ファイル**: `src/pages/calendar.html`, `src/scripts/calendar-manager.js`  
**問題**: calendar-manager.jsで`#dailyTaskList`を参照しているが、HTMLでは`#dailyTaskList`として定義されているか要確認
**修正案**: コード上は一致しているため問題なし

### 9. task-manager.js - 非効率的なDOM検索
**ファイル**: `src/scripts/task-manager.js`  
**問題**: 複数のDOM要素が繰り返し検索されている（パフォーマンスの問題）
**修正案**: 初期化時に一度だけ検索して変数に保存する

### 10. register.js - パスワード検証の不一致
**ファイル**: `src/scripts/register.js`  
**行**: 174-177  
**問題**: パスワード検証の正規表現が、表示されるメッセージと一致していない可能性
```javascript
if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_-]+$/.test(data.password))
```
**修正案**: メッセージと正規表現の整合性を確認

### 11. server.js - 開発環境でのJWT_SECRET生成の警告表示
**ファイル**: `server.js`  
**行**: 30-31  
**問題**: 本番環境でJWT_SECRETがないとプロセスが終了するが、メッセージが表示された後に終了処理が実行される
**修正案**: 警告メッセージの表示順序を確認

## 📝 その他の注意点

### 潜在的な問題
1. **認証トークンのリフレッシュ**: トークンの有効期限切れ時の処理が不完全な可能性
2. **エラーハンドリング**: 一部のAPI呼び出しでエラーハンドリングが不十分
3. **データ整合性**: ローカルストレージとサーバー間のデータ同期の問題
4. **セキュリティ**: CSP設定が`unsafe-inline`を許可しているため、セキュリティリスクがある

### パフォーマンスの問題
1. タスクリストの再レンダリングが頻繁に発生する可能性
2. ガントチャートのバー描画処理が大量のタスクで遅くなる可能性

### UI/UX の改善点
1. モバイルビューでのタスク編集UIの改善が必要
2. エラーメッセージの表示位置と表示時間の統一
3. ローディング状態の表示が一部で欠けている

---

## 優先度の定義

- 🔴 **重大**: システムが正常に動作しない、データ損失のリスクがある
- 🟡 **中程度**: 機能は動作するが、ユーザー体験に影響がある
- 🟢 **軽微**: 小さな不便さや改善の余地がある

## 次のアクションアイテム

1. ✅ favicon.icoをすべてのHTMLファイルに追加（完了）
2. ⬜ task-manager.js の変数名を修正
3. ⬜ 存在しないscript.jsファイルの参照を削除
4. ⬜ ボトムナビゲーションのパスを統一
5. ⬜ 重複しているリソース読み込みを削除
