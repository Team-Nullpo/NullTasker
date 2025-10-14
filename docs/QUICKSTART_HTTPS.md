# HTTPS サーバーのクイックスタート

## 🚀 はじめに

NullTasker は HTTPS サーバーとして動作します。初回起動時は以下の手順で設定してください。

## 📋 初回セットアップ（必須）

### ステップ 1: SSL 証明書の生成

```bash
npm run generate-cert
```

### ステップ 2: サーバー起動

```bash
npm start
```

これで完了です！サーバーは以下の URL でアクセスできます：

- **HTTPS**: https://localhost:3443
- **HTTP**: http://localhost:3000 （自動的に HTTPS へリダイレクト）

## ⚠️ ブラウザの証明書警告について

初回アクセス時、ブラウザに証明書の警告が表示されます。これは**正常な動作**です。

### Chrome/Edge

1. 「詳細設定」をクリック
2. 「localhost にアクセスする（安全ではありません）」をクリック

### Firefox

1. 「詳細設定」をクリック
2. 「危険性を承知で続行」をクリック

## 💡 その他のコマンド

### HTTP モードで起動（HTTPS を無効化）

```bash
npm run start:http
```

→ http://localhost:3000 でアクセス

### 開発モード（ホットリロード）

```bash
npm run dev
```

→ ファイル変更時に自動再起動

### 証明書の再生成

```bash
rm -rf ssl/
npm run generate-cert
```

## 🔧 ポート変更

デフォルトのポートを変更する場合：

```bash
# HTTPSポートを8443に変更
HTTPS_PORT=8443 npm start

# HTTPポートを8080に変更
PORT=8080 npm start
```

## 📖 詳細なドキュメント

詳しい設定方法や本番環境での使用方法については、[HTTPS_SETUP.md](./HTTPS_SETUP.md) を参照してください。
