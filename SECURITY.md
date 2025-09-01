# NullTasker セキュリティ設定ガイド

## 本番環境での必須設定

### 1. 環境変数の設定
```bash
# JWT秘密鍵（256bit以上推奨）
export JWT_SECRET="your-super-secure-secret-key-minimum-256-bits-long"

# 本番環境フラグ
export NODE_ENV="production"

# 許可するドメイン（CORS）
export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# データベース暗号化キー（将来的に使用）
export DB_ENCRYPTION_KEY="your-database-encryption-key"
```

### 2. HTTPSの有効化
本番環境では必ずHTTPSを使用してください。

### 3. セキュリティヘッダーの確認
以下のヘッダーが適切に設定されているか確認：
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Content-Security-Policy`

### 4. ログ監視
以下のイベントを監視：
- 複数回のログイン失敗
- 異常なアクセスパターン
- エラー率の急激な増加

## セキュリティチェックリスト

### 認証・認可
- [x] パスワードの適切なハッシュ化 (bcrypt)
- [x] JWT秘密鍵の安全な管理
- [x] トークンの適切な有効期限設定
- [x] リフレッシュトークンの実装
- [x] レート制限の設定
- [x] 入力値の検証とサニタイズ

### データ保護
- [x] 機密情報のログ出力防止
- [x] HTTPSでのCookie送信（SameSite, Secure属性）
- [x] XSS対策（CSP設定）
- [x] CSRF対策（SameSite Cookie）

### 可用性
- [x] リクエスト制限（DoS対策）
- [x] エラーハンドリングの適切な実装
- [x] ログ監視体制

### インフラ
- [ ] HTTPSの有効化（本番環境）
- [ ] セキュリティヘッダーの設定確認
- [ ] 定期的なセキュリティ監査
- [ ] 依存関係の脆弱性チェック

## 推奨される追加対策

1. **2段階認証の実装**
2. **セッション管理の強化**
3. **API制限の細分化**
4. **監査ログの実装**
5. **定期的なペネトレーションテスト**
