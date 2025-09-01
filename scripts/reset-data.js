#!/usr/bin/env node

/**
 * データリセット用スクリプト
 * Git にコミットする前に実行することで、開発用データを初期状態にリセットする
 */

const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

// ファイルパス
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const USERS_FILE = path.join(CONFIG_DIR, 'users.json');
const TICKETS_FILE = path.join(CONFIG_DIR, 'tickets.json');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

// 初期データ
const INITIAL_DATA = {
  users: {
    users: [
      {
        id: "admin",
        displayName: "管理者",
        email: "admin@nulltasker.com",
        password: "", // 後でハッシュ化
        createdAt: "2025-09-01T00:00:00.000Z",
        lastLogin: null
      }
    ],
    lastUpdated: new Date().toISOString()
  },
  
  tickets: {
    tasks: [],
    lastUpdated: new Date().toISOString()
  },
  
  settings: {
    appName: "NullTasker",
    version: "1.0.0",
    theme: "light",
    language: "ja",
    timezone: "Asia/Tokyo",
    features: {
      notifications: true,
      autoSave: true,
      backupEnabled: true
    },
    lastUpdated: new Date().toISOString()
  }
};

async function resetUsers() {
  console.log('📄 ユーザーデータをリセット中...');
  
  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash('admin123', 10);
  INITIAL_DATA.users.users[0].password = hashedPassword;
  
  await fs.writeFile(USERS_FILE, JSON.stringify(INITIAL_DATA.users, null, 2));
  console.log('✅ ユーザーデータをリセットしました');
  console.log('   - 管理者アカウント: admin / admin123');
}

async function resetTickets() {
  console.log('📋 タスクデータをリセット中...');
  
  await fs.writeFile(TICKETS_FILE, JSON.stringify(INITIAL_DATA.tickets, null, 2));
  console.log('✅ タスクデータをリセットしました');
}

async function resetSettings() {
  console.log('⚙️  設定データをリセット中...');
  
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(INITIAL_DATA.settings, null, 2));
  console.log('✅ 設定データをリセットしました');
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(CONFIG_DIR, 'backups');
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
    
    // 既存ファイルのバックアップ
    const files = ['users.json', 'tickets.json', 'settings.json'];
    for (const file of files) {
      const sourcePath = path.join(CONFIG_DIR, file);
      const backupPath = path.join(backupDir, `${file}.backup.${timestamp}`);
      
      try {
        await fs.copyFile(sourcePath, backupPath);
      } catch (error) {
        // ファイルが存在しない場合はスキップ
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    
    console.log(`📦 バックアップを作成しました: config/backups/*backup.${timestamp}`);
  } catch (error) {
    console.warn('⚠️  バックアップの作成に失敗しました:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    users: args.includes('--users') || args.includes('-u'),
    tickets: args.includes('--tickets') || args.includes('-t'),
    settings: args.includes('--settings') || args.includes('-s'),
    backup: !args.includes('--no-backup'),
    help: args.includes('--help') || args.includes('-h')
  };
  
  // ヘルプ表示
  if (options.help) {
    console.log(`
NullTasker データリセットスクリプト

使用方法:
  node scripts/reset-data.js [オプション]

オプション:
  --users, -u      ユーザーデータのみリセット
  --tickets, -t    タスクデータのみリセット  
  --settings, -s   設定データのみリセット
  --no-backup      バックアップを作成しない
  --help, -h       このヘルプを表示

例:
  node scripts/reset-data.js                # 全データをリセット
  node scripts/reset-data.js --users        # ユーザーデータのみリセット
  node scripts/reset-data.js -u -t          # ユーザーとタスクデータをリセット
  node scripts/reset-data.js --no-backup    # バックアップなしでリセット
    `);
    return;
  }
  
  // 全てのオプションが false の場合は全リセット
  const resetAll = !options.users && !options.tickets && !options.settings;
  
  console.log('🔄 NullTasker データリセット開始\n');
  
  try {
    // config ディレクトリが存在しない場合は作成
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    
    // バックアップ作成
    if (options.backup) {
      await createBackup();
      console.log();
    }
    
    // リセット実行
    if (resetAll || options.users) {
      await resetUsers();
    }
    
    if (resetAll || options.tickets) {
      await resetTickets();
    }
    
    if (resetAll || options.settings) {
      await resetSettings();
    }
    
    console.log('\n🎉 データリセットが完了しました！');
    
    if (resetAll || options.users) {
      console.log('\nログイン情報:');
      console.log('  ID: admin');
      console.log('  パスワード: admin123');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ main を呼び出し
if (require.main === module) {
  main();
}

module.exports = { resetUsers, resetTickets, resetSettings, createBackup };
