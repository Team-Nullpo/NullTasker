/* ==========================================================================
   CSS Refactoring Guide - CSSリファクタリングガイド
   ========================================================================== */

## ファイル構成

NullTaskerのCSSは以下の階層で構成されています：

```
src/styles/
├── variables.css       # CSS変数定義（最優先）
├── base.css           # リセット、基本スタイル
├── layout.css         # レイアウトコンポーネント
├── components.css     # 共通コンポーネント
├── sidebar.css        # サイドバー固有
├── user-dropdown.css  # ユーザードロップダウン固有
├── pages.css          # ページ固有スタイル
├── admin.css          # 管理者ページ固有
├── login.css          # ログインページ固有
├── responsive.css     # レスポンシブデザイン
├── components-dark.css # ダークテーマ（非推奨）
└── styles.css         # レガシー（段階的廃止予定）
```

## 読み込み順序

HTMLファイルでのCSS読み込みは以下の順序で行ってください：

```html
<!-- 1. CSS変数（必須・最優先） -->
<link rel="stylesheet" href="../styles/variables.css">

<!-- 2. ベーススタイル -->
<link rel="stylesheet" href="../styles/base.css">

<!-- 3. レイアウト -->
<link rel="stylesheet" href="../styles/layout.css">

<!-- 4. 共通コンポーネント -->
<link rel="stylesheet" href="../styles/components.css">

<!-- 5. 特定コンポーネント -->
<link rel="stylesheet" href="../styles/sidebar.css">
<link rel="stylesheet" href="../styles/user-dropdown.css">

<!-- 6. ページ固有（必要な場合のみ） -->
<link rel="stylesheet" href="../styles/pages.css">
<!-- <link rel="stylesheet" href="../styles/admin.css"> -->
<!-- <link rel="stylesheet" href="../styles/login.css"> -->

<!-- 7. レスポンシブ（最後） -->
<link rel="stylesheet" href="../styles/responsive.css">

<!-- レガシー（段階的に削除） -->
<!-- <link rel="stylesheet" href="../styles/styles.css"> -->
<!-- <link rel="stylesheet" href="../styles/components-dark.css"> -->
```

## CSS変数システム

### カラーパレット

```css
/* プライマリカラー（9段階） */
var(--color-primary-50)  /* 最も明るい */
var(--color-primary-500) /* 基準色 */
var(--color-primary-900) /* 最も暗い */

/* セマンティックカラー */
var(--primary-color)     /* プライマリ */
var(--success-color)     /* 成功 */
var(--warning-color)     /* 警告 */
var(--danger-color)      /* 危険 */
var(--info-color)        /* 情報 */
```

### テーマ変数

テーマに応じて自動的に変わる変数：

```css
/* 背景色 */
var(--bg-primary)        /* メイン背景 */
var(--bg-secondary)      /* セカンダリ背景 */
var(--bg-tertiary)       /* 3次背景 */
var(--bg-elevated)       /* 浮き上がった要素 */

/* テキスト色 */
var(--text-primary)      /* メインテキスト */
var(--text-secondary)    /* セカンダリテキスト */
var(--text-tertiary)     /* 3次テキスト */
var(--text-disabled)     /* 無効化テキスト */
var(--text-inverted)     /* 反転テキスト */

/* ボーダー色 */
var(--border-color)      /* 基本ボーダー */
var(--border-color-light)/* 薄いボーダー */
var(--border-color-dark) /* 濃いボーダー */

/* インタラクティブ */
var(--color-hover)       /* ホバー状態 */
var(--color-active)      /* アクティブ状態 */
var(--color-focus)       /* フォーカス状態 */
```

### スペーシング

```css
/* スペーシングスケール（Tailwind風） */
var(--space-0)   /* 0 */
var(--space-1)   /* 4px */
var(--space-2)   /* 8px */
var(--space-3)   /* 12px */
var(--space-4)   /* 16px */
var(--space-5)   /* 20px */
var(--space-6)   /* 24px */
var(--space-8)   /* 32px */
var(--space-10)  /* 40px */
var(--space-12)  /* 48px */

/* レガシー互換（既存コードで使用中） */
var(--spacing-xs)   /* var(--space-1) */
var(--spacing-sm)   /* var(--space-2) */
var(--spacing-md)   /* var(--space-3) */
var(--spacing-lg)   /* var(--space-4) */
var(--spacing-xl)   /* var(--space-5) */
var(--spacing-xxl)  /* var(--space-6) */
```

### タイポグラフィ

```css
/* フォントサイズ */
var(--font-size-xs)   /* 12px */
var(--font-size-sm)   /* 14px */
var(--font-size-base) /* 16px */
var(--font-size-lg)   /* 18px */
var(--font-size-xl)   /* 20px */
var(--font-size-2xl)  /* 24px */
var(--font-size-3xl)  /* 30px */
var(--font-size-4xl)  /* 36px */

/* フォントウェイト */
var(--font-weight-light)     /* 300 */
var(--font-weight-normal)    /* 400 */
var(--font-weight-medium)    /* 500 */
var(--font-weight-semibold)  /* 600 */
var(--font-weight-bold)      /* 700 */

/* 行の高さ */
var(--line-height-tight)     /* 1.25 */
var(--line-height-normal)    /* 1.5 */
var(--line-height-relaxed)   /* 1.75 */
```

### ボーダーとシャドウ

```css
/* ボーダー半径 */
var(--border-radius-none) /* 0 */
var(--border-radius-sm)   /* 4px */
var(--border-radius-base) /* 6px */
var(--border-radius-md)   /* 8px */
var(--border-radius-lg)   /* 12px */
var(--border-radius-xl)   /* 16px */
var(--border-radius-full) /* 9999px（円形） */

/* シャドウ */
var(--shadow-xs)   /* 最小 */
var(--shadow-sm)   /* 小 */
var(--shadow-base) /* 基本 */
var(--shadow-md)   /* 中 */
var(--shadow-lg)   /* 大 */
var(--shadow-xl)   /* 最大 */
```

### トランジション

```css
var(--transition-fast)   /* 150ms */
var(--transition-base)   /* 200ms */
var(--transition-slow)   /* 300ms */
var(--transition-slower) /* 500ms */
```

### Z-index

```css
var(--z-base)           /* 0 */
var(--z-dropdown)       /* 1000 */
var(--z-sticky)         /* 1020 */
var(--z-fixed)          /* 1030 */
var(--z-modal-backdrop) /* 1040 */
var(--z-modal)          /* 1050 */
var(--z-popover)        /* 1060 */
var(--z-tooltip)        /* 1070 */
```

## コンポーネントスタイル

### ボタン

```html
<!-- 基本ボタン -->
<button class="btn btn-primary">プライマリ</button>
<button class="btn btn-secondary">セカンダリ</button>
<button class="btn btn-success">成功</button>
<button class="btn btn-warning">警告</button>
<button class="btn btn-danger">危険</button>

<!-- アウトラインボタン -->
<button class="btn btn-outline-primary">アウトライン</button>

<!-- サイズバリエーション -->
<button class="btn btn-primary btn-sm">小</button>
<button class="btn btn-primary">標準</button>
<button class="btn btn-primary btn-lg">大</button>

<!-- 無効化 -->
<button class="btn btn-primary" disabled>無効</button>
```

### フォーム

```html
<div class="form-group">
  <label for="input">ラベル</label>
  <input type="text" id="input" class="form-control">
  <span class="form-help">ヘルプテキスト</span>
</div>

<!-- 2カラムフォーム -->
<div class="form-row">
  <div class="form-group">...</div>
  <div class="form-group">...</div>
</div>
```

### カード

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">タイトル</h3>
  </div>
  <div class="card-content">
    コンテンツ
  </div>
</div>
```

## ベストプラクティス

### ✅ 推奨

```css
/* CSS変数を使用 */
.my-component {
  padding: var(--space-4);
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-base);
  transition: all var(--transition-base);
}

/* セマンティックな命名 */
.user-profile-card { }
.task-list-item { }
.modal-overlay { }
```

### ❌ 非推奨

```css
/* ハードコードされた値 */
.my-component {
  padding: 16px;
  color: #333;
  background-color: #fff;
  border-radius: 6px;
  transition: all 0.2s ease;
}

/* 一般的すぎる命名 */
.box { }
.item { }
.wrapper { }
```

## テーマ対応

### テーマ固有のスタイル

ダークテーマ向けの追加スタイルは、variables.cssで定義されたテーマ変数を使用することで自動的に適用されます。

```css
/* ✅ 推奨：テーマ変数を使用（自動対応） */
.card {
  background-color: var(--card-bg);
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* ❌ 非推奨：テーマごとに個別定義 */
body.theme-light .card {
  background-color: #ffffff;
  color: #212529;
}

body.theme-dark .card {
  background-color: #2c2c2e;
  color: #ffffff;
}
```

### テーマ固有の追加スタイルが必要な場合

```css
/* 基本スタイル（すべてのテーマ共通） */
.special-component {
  padding: var(--space-4);
}

/* ダークテーマのみ特別な処理が必要な場合 */
body.theme-dark .special-component {
  /* 追加のスタイル */
  box-shadow: 0 0 10px rgba(10, 132, 255, 0.5);
}
```

## レスポンシブデザイン

### ブレークポイント

```css
/* スマートフォン */
@media screen and (max-width: 768px) {
  /* モバイル固有スタイル */
}

/* タブレット */
@media screen and (max-width: 1024px) {
  /* タブレット固有スタイル */
}

/* デスクトップ（デフォルト） */
/* メディアクエリなし */
```

### モバイルファースト vs デスクトップファースト

現在はデスクトップファーストですが、将来的にモバイルファーストへ移行予定：

```css
/* 現在（デスクトップファースト） */
.component {
  /* デスクトップスタイル */
}

@media screen and (max-width: 768px) {
  .component {
    /* モバイルスタイル */
  }
}

/* 推奨（モバイルファースト） */
.component {
  /* モバイルスタイル */
}

@media screen and (min-width: 769px) {
  .component {
    /* デスクトップスタイル */
  }
}
```

## マイグレーションガイド

### 既存コードの更新手順

1. **CSS変数への置き換え**

```css
/* Before */
.element {
  padding: 16px;
  color: #333;
}

/* After */
.element {
  padding: var(--space-4);
  color: var(--text-primary);
}
```

2. **ボタンスタイルの統一**

```css
/* Before */
.my-button {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
}

/* After */
<button class="btn btn-primary">...</button>
```

3. **テーマ対応スタイルの簡素化**

```css
/* Before */
.card {
  background: white;
  color: #333;
}

body.theme-dark .card {
  background: #2c2c2e;
  color: white;
}

/* After */
.card {
  background-color: var(--card-bg);
  color: var(--text-primary);
}
```

## パフォーマンス

### CSS最適化

- **未使用CSSの削除**: PurgeCSSなどのツール使用を検討
- **セレクタの最適化**: 過度に詳細なセレクタを避ける
- **アニメーションのGPU活用**: `transform`と`opacity`を優先

```css
/* ❌ 避ける：再レイアウトを引き起こす */
.element {
  transition: width 0.3s;
}

/* ✅ 推奨：GPUアクセラレーション */
.element {
  transition: transform 0.3s;
}
```

## 今後の改善

- [ ] PurgeCSS導入でファイルサイズ削減
- [ ] PostCSS導入で変数のフォールバック自動生成
- [ ] CSS Modulesまたはstyled-components検討
- [ ] CSSアニメーションライブラリの統合
- [ ] アクセシビリティ向上（ハイコントラストモード対応）
- [ ] ダークモード自動切り替え（prefers-color-scheme）
