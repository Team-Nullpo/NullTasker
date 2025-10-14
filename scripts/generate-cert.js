#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sslDir = path.join(__dirname, '..', 'ssl');

if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
  console.log('SSLディレクトリを作成しました:', sslDir);
}

const keyPath = path.join(sslDir, 'server.key');
const certPath = path.join(sslDir, 'server.cert');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('SSL証明書は既に存在します。');
  process.exit(0);
}

try {
  console.log('自己署名SSL証明書を生成しています...');
  
  execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Tokyo/O=NullTasker/CN=localhost"`, {
    stdio: 'inherit'
  });
  
  console.log('\nSSL証明書が正常に生成されました:');
  console.log('  秘密鍵:', keyPath);
  console.log('  証明書:', certPath);
  console.log('\n警告: これは開発用の自己署名証明書です。');
  console.log('本番環境では信頼された認証局から証明書を取得してください。');
  
} catch (error) {
  console.error('\nSSL証明書の生成に失敗しました:', error.message);
  console.error('\nOpenSSLがインストールされているか確認してください。');
  console.error('Ubuntu/Debian: sudo apt-get install openssl');
  console.error('macOS: brew install openssl');
  process.exit(1);
}
