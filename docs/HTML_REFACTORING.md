# HTMLリファクタリングガイド

## 実施内容

### 1. 構造の標準化

すべてのHTMLファイルで統一された構造を採用：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="ページの説明">
  <title>ページタイトル - NullTasker</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="../assets/favicon.ico">
  
  <!-- Stylesheets (順序重要) -->
  <!-- Font Awesome -->
  
</head>
<body>
  <!-- コンテンツ -->
  
  <!-- Scripts -->
</body>
</html>
```

### 2. セマンティックHTML

#### 改善前
```html
<div class="main-header">
  <h1>タイトル</h1>
</div>
<div class="login-footer">
  <p>リンク</p>
</div>
```

#### 改善後
```html
<header class="main-header">
  <h1>タイトル</h1>
</header>
<footer class="login-footer">
  <p>リンク</p>
</footer>
```

### 3. アクセシビリティ改善

#### WAI-ARIA属性の追加

```html
<!-- ナビゲーション -->
<aside class="sidebar" role="navigation" aria-label="メインナビゲーション">
  <!-- ... -->
</aside>

<!-- ボタン -->
<button id="toggleSidebar" aria-label="サイドバーを切り替え">
  <i class="fas fa-bars"></i>
</button>

<!-- 現在のページ -->
<a href="index.html" class="active" aria-current="page">
  <i class="fas fa-home"></i>
  <span>Home</span>
</a>

<!-- アラート -->
<div role="alert" aria-live="polite">
  エラーメッセージ
</div>
```

#### フォームの改善

```html
<!-- オートコンプリート属性 -->
<input 
  type="text" 
  id="loginId" 
  autocomplete="username"
  aria-required="true">

<input 
  type="password" 
  id="password" 
  autocomplete="current-password"
  aria-required="true">

<!-- アイコンの装飾マーク -->
<i class="fas fa-user" aria-hidden="true"></i>
```

### 4. メタデータの改善

各ページに適切な説明を追加：

```html
<!-- index.html -->
<meta name="description" content="NullTasker - チーム向けプロジェクト管理システムのダッシュボード">

<!-- login.html -->
<meta name="description" content="NullTasker ログインページ - プロジェクト管理システムへのログイン">

<!-- task.html -->
<meta name="description" content="タスク管理 - NullTasker プロジェクトのタスクを管理">
```

### 5. コメントの改善

#### 改善前
```html
<!-- トグルボタン（サイドバーの外に配置） -->
<!-- スマートフォン専用ボトムナビゲーション -->
```

#### 改善後
```html
<!-- サイドバートグルボタン -->
<!-- モバイルナビゲーション -->
```

### 6. 一貫性のある命名

- クラス名: `kebab-case`
- ID: `camelCase`
- データ属性: `data-*`

```html
<!-- Good -->
<div class="main-content" id="mainContent">
<button class="login-btn" data-action="submit">

<!-- Bad -->
<div class="mainContent" id="main-content">
<button class="LoginBtn" data-Action="submit">
```

## 改善されたポイント

### アクセシビリティ

1. **ARIA ラベル**: すべてのインタラクティブ要素に適切なラベル
2. **ランドマーク**: `role`属性でセクションを明確化
3. **現在のページ**: `aria-current="page"`で現在位置を示す
4. **キーボードナビゲーション**: `tabindex`で適切なフォーカス順序
5. **スクリーンリーダー対応**: `aria-hidden`で装飾要素を除外

### SEO

1. **メタディスクリプション**: 各ページに固有の説明
2. **意味のあるタイトル**: "ページ名 - NullTasker"形式
3. **セマンティックHTML**: 検索エンジンが理解しやすい構造
4. **alt属性**: すべての画像に説明的なテキスト

### 保守性

1. **統一された構造**: すべてのページで同じパターン
2. **明確なコメント**: セクションの目的を明示
3. **テンプレート提供**: `_template.html`で標準構造を文書化
4. **CSS読み込み順序の標準化**: 予測可能なスタイル適用順序

### パフォーマンス

1. **不要な空白削除**: HTMLファイルサイズの最適化
2. **効率的なスクリプト読み込み**: `type="module"`で遅延読み込み
3. **リソースヒント**: 将来的に`preload`, `prefetch`追加可能

## 今後の改善提案

### 1. コンポーネント化

共通部分をJavaScriptで動的に生成：

```javascript
// components/sidebar.js
export class Sidebar {
  static render(currentPage) {
    return `
      <aside class="sidebar" id="sidebar">
        <!-- サイドバー内容 -->
      </aside>
    `;
  }
}
```

### 2. テンプレートエンジンの導入

Handlebars や EJS を使用して重複を削減：

```handlebars
{{> header }}
{{> sidebar currentPage="index" }}
<main class="main-content">
  {{{ content }}}
</main>
{{> footer }}
```

### 3. HTML検証

CI/CDパイプラインに HTML バリデーション追加：

```bash
npm install -g html-validate
html-validate "src/pages/**/*.html"
```

### 4. プログレッシブエンハンスメント

基本機能をHTMLで、拡張機能をJavaScriptで：

```html
<!-- JavaScript無効でも動作 -->
<form action="/api/login" method="POST">
  <!-- フォーム -->
</form>

<!-- JavaScriptで拡張 -->
<script>
  // AJAX送信、バリデーション、UIフィードバック
</script>
```

## チェックリスト

すべての新規HTMLページで確認：

- [ ] `<!DOCTYPE html>`宣言
- [ ] `lang="ja"`属性
- [ ] `<meta charset="UTF-8">`
- [ ] `<meta name="viewport">`
- [ ] `<meta name="description">`
- [ ] 意味のあるタイトル
- [ ] favicon指定
- [ ] CSS読み込み順序
- [ ] セマンティックHTML使用
- [ ] ARIA属性（必要な箇所）
- [ ] alt属性（すべての画像）
- [ ] autocomplete属性（フォーム）
- [ ] `aria-hidden="true"`（装飾アイコン）
- [ ] 適切なheading階層
- [ ] `role`属性（ナビゲーション等）
- [ ] `type="module"`（スクリプト）

## リファレンス

- [MDN Web Docs - HTML](https://developer.mozilla.org/ja/docs/Web/HTML)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [HTML5 Validator](https://validator.w3.org/)
- [WebAIM - Web Accessibility In Mind](https://webaim.org/)
