# HTTPS サーバー設定ガイド

## 概要

NullTasker は開発環境で HTTPS サーバーとして動作するように設定されています。

## セットアップ手順

### 1. SSL 証明書の生成

初回起動前に、自己署名 SSL 証明書を生成する必要があります：

```bash
npm run generate-cert
```

このコマンドは以下を実行します：

- `ssl/` ディレクトリを作成
- 自己署名の SSL 証明書（`server.cert`）と秘密鍵（`server.key`）を生成
- 証明書の有効期限は 365 日

### 2. サーバーの起動

#### HTTPS モード（デフォルト）

```bash
npm start
```

サーバーは `https://localhost:3443` で起動します。
HTTP から HTTPS への自動リダイレクトも有効になります（http://localhost:3000 → https://localhost:3443）。

#### HTTP モード

HTTPS を無効にして HTTP モードで起動する場合：

```bash
npm run start:http
```

サーバーは `http://localhost:3000` で起動します。

## 開発環境での証明書警告

自己署名証明書を使用しているため、ブラウザで初回アクセス時に証明書の警告が表示されます。

### Chrome/Edge の場合

1. 「詳細設定」をクリック
2. 「localhost にアクセスする（安全ではありません）」をクリック

### Firefox の場合

1. 「詳細設定」をクリック
2. 「危険性を承知で続行」をクリック

## 環境変数

以下の環境変数でサーバーの動作をカスタマイズできます：

- `USE_HTTPS`: HTTPS を有効/無効にする（デフォルト: `true`）
- `HTTPS_PORT`: HTTPS ポート番号（デフォルト: `3443`）
- `PORT`: HTTP ポート番号（デフォルト: `3000`）
- `REDIRECT_HTTP`: HTTP から HTTPS への自動リダイレクト（デフォルト: `true`）

### 例：カスタムポートで起動

```bash
HTTPS_PORT=8443 npm start
```

### 例：HTTPS を無効化

```bash
USE_HTTPS=false npm start
```

### 例：リダイレクトを無効化

```bash
REDIRECT_HTTP=false npm start
```

## 本番環境での使用waroninnrudoragon

**重要**: 本番環境では自己署名証明書を使用しないでください。

本番環境では、信頼された認証局（CA）から発行された SSL 証明書を使用してください：

1. Let's Encrypt などの無料 CA サービスを利用
2. 有料の SSL 証明書を購入
3. クラウドプロバイダーが提供する証明書管理サービスを利用

証明書を取得したら、`ssl/server.key` と `ssl/server.cert` を置き換えてください。

## トラブルシューティング

### OpenSSL がインストールされていない

証明書生成スクリプトは OpenSSL を使用します。インストールされていない場合：

**Ubuntu/Debian:**

```bash
sudo apt-get install openssl
```

**macOS:**

```bash
brew install openssl
```

### ポートが既に使用されている

別のプロセスがポートを使用している場合、以下のコマンドで確認できます：

```bash
# ポート3443を使用しているプロセスを確認
lsof -i :3443

# プロセスを終了
kill -9 <PID>
```

または、別のポートを使用してください：

```bash
HTTPS_PORT=8443 npm start
```

## セキュリティについて

- 開発環境では自己署名証明書で十分です
- 本番環境では必ず信頼された CA から証明書を取得してください
- 秘密鍵（`server.key`）は絶対に Git リポジトリにコミットしないでください
- `.gitignore` に `ssl/*.key` が含まれていることを確認してください
