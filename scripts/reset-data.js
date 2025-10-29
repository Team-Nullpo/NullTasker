#!/usr/bin/env node

/**
 * データリセット用スクリプト (SQLite版)
 * データベースを初期状態にリセットする
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const DatabaseManager = require('../db/database');
const { DEFAULT_PROJECT } = require("../server-constants")

// データベースパス
const DB_PATH = path.join(__dirname, '..', 'db', 'nulltasker.db');
const BACKUP_DIR = path.join(__dirname, '..', 'db', 'backups');

// 初期データ
const INITIAL_ADMIN_PASSWORD = 'admin123';

// コマンドライン引数の処理
const args = process.argv.slice(2);
const options = {
  users: args.includes('--users'),
  tasks: args.includes('--tasks') || args.includes('--tickets'),
  settings: args.includes('--settings'),
  projects: args.includes('--projects'),
  noBackup: args.includes('--no-backup'),
  all: args.length === 0 || args.includes('--all')
};

// すべてのオプションが指定されていない場合は全リセット
if (!options.users && !options.tasks && !options.settings && !options.projects) {
  options.all = true;
}

/**
 * バックアップディレクトリを作成
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * データベースをバックアップ
 */
function backupDatabase() {
  if (options.noBackup) {
    console.log('バックアップをスキップします');
    return;
  }

  if (!fs.existsSync(DB_PATH)) {
    console.log('データベースファイルが存在しません');
    return;
  }

  ensureBackupDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(BACKUP_DIR, `nulltasker_${timestamp}.db`);
  
  try {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`バックアップを作成しました: ${backupPath}`);
  } catch (error) {
    console.error('バックアップの作成に失敗しました:', error.message);
    process.exit(1);
  }
}

/**
 * テーブルをリセット
 */
function resetTables(db) {
  console.log('\nデータベースをリセットしています...');
  
  try {
    // トランザクション開始
    db.db.prepare('BEGIN TRANSACTION').run();
    
    if (options.all || options.tasks) {
      console.log('- タスクをリセット中...');
      db.db.prepare('DELETE FROM tasks').run();
    }
    
    if (options.all || options.projects) {
      console.log('- プロジェクトメンバーをリセット中...');
      db.db.prepare('DELETE FROM project_members').run();
      console.log('- プロジェクトをリセット中...');
      db.db.prepare('DELETE FROM projects').run();
    }
    
    if (options.all || options.users) {
      console.log('- ユーザーをリセット中...');
      db.db.prepare('DELETE FROM users').run();
    }
    
    if (options.all || options.settings) {
      console.log('- 設定をリセット中...');
      db.db.prepare('DELETE FROM settings').run();
    }
    
    // コミット
    db.db.prepare('COMMIT').run();
    console.log('リセット完了');
  } catch (error) {
    db.db.prepare('ROLLBACK').run();
    throw error;
  }
}

/**
 * 初期データを挿入
 */
async function insertInitialData(db) {
  console.log('\n初期データを挿入しています...');
  
  try {
    // トランザクション開始
    db.db.prepare('BEGIN TRANSACTION').run();
    
    if (options.all || options.users) {
      console.log('- 管理者ユーザーを作成中...');
      const hashedPassword = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);
      
      db.createUser({
        id: 'admin',
        loginId: 'admin',
        displayName: '管理者',
        email: 'admin@nulltasker.com',
        password: hashedPassword,
        role: 'system_admin',
        createdAt: '2025-09-01T00:00:00.000Z',
        lastLogin: null
      });
      
      console.log('  ✓ 管理者ユーザー作成完了 (ID: admin, パスワード: admin123)');
    }
    
    if (options.all || options.projects) {
      console.log('- デフォルトプロジェクトを作成中...');
      db.createProject(DEFAULT_PROJECT);
      
      // プロジェクトメンバーとして管理者を追加
      db.addProjectMember('default', 'admin', true);
      
      console.log('  ✓ デフォルトプロジェクト作成完了 (ID: default)');
    }
    
    if (options.all || options.settings) {
      console.log('- システム設定を作成中...');
      
      const settings = [
        { key: 'app_name', value: 'NullTasker' },
        { key: 'version', value: '1.1.0' },
        { key: 'theme', value: 'light' },
        { key: 'language', value: 'ja' },
        { key: 'timezone', value: 'Asia/Tokyo' },
        { key: 'features', value: {
          notifications: true,
          emailNotifications: false,
          taskReminders: true
        }}
      ];
      
      settings.forEach(setting => {
        db.setSetting(setting.key, setting.value);
      });
      
      console.log(`  ✓ システム設定作成完了 (${settings.length}件)`);
    }
    
    // コミット
    db.db.prepare('COMMIT').run();
    console.log('初期データの挿入完了');
  } catch (error) {
    db.db.prepare('ROLLBACK').run();
    throw error;
  }
}

/**
 * データベースの状態を表示
 */
function showDatabaseStatus(db) {
  console.log('\n=== データベースの状態 ===');
  
  const userCount = db.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const projectCount = db.db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  const taskCount = db.db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const settingCount = db.db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  
  console.log(`ユーザー数: ${userCount}`);
  console.log(`プロジェクト数: ${projectCount}`);
  console.log(`タスク数: ${taskCount}`);
  console.log(`設定数: ${settingCount}`);
  console.log('========================\n');
}

/**
 * メイン処理
 */
async function main() {
  console.log('NullTasker データベースリセットツール');
  console.log('=====================================\n');
  
  // リセット対象を表示
  console.log('リセット対象:');
  if (options.all) {
    console.log('  - すべてのデータ');
  } else {
    if (options.users) console.log('  - ユーザー');
    if (options.projects) console.log('  - プロジェクト');
    if (options.tasks) console.log('  - タスク');
    if (options.settings) console.log('  - 設定');
  }
  
  // バックアップ作成
  backupDatabase();
  
  // データベース接続
  let db;
  try {
    db = new DatabaseManager(DB_PATH);
    
    // リセット前の状態を表示
    console.log('\n--- リセット前 ---');
    showDatabaseStatus(db);
    
    // テーブルをリセット
    resetTables(db);
    
    // 初期データを挿入
    await insertInitialData(db);
    
    // リセット後の状態を表示
    console.log('\n--- リセット後 ---');
    showDatabaseStatus(db);
    
    console.log('✓ データベースのリセットが完了しました\n');
    
    if (options.all || options.users) {
      console.log('デフォルトのログイン情報:');
      console.log('  ユーザーID: admin');
      console.log('  パスワード: admin123\n');
    }
    
  } catch (error) {
    console.error('\nエラーが発生しました:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
    }
  }
}

// ヘルプメッセージ
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
NullTasker データベースリセットツール

使用方法:
  npm run reset              # すべてのデータをリセット
  npm run reset:users        # ユーザーのみリセット
  npm run reset:projects     # プロジェクトのみリセット
  npm run reset:tasks        # タスクのみリセット
  npm run reset:settings     # 設定のみリセット
  npm run reset:clean        # バックアップなしでリセット

オプション:
  --all                      すべてのデータをリセット（デフォルト）
  --users                    ユーザーのみリセット
  --projects                 プロジェクトのみリセット
  --tasks, --tickets         タスクのみリセット
  --settings                 設定のみリセット
  --no-backup                バックアップを作成しない
  --help, -h                 このヘルプメッセージを表示

例:
  node scripts/reset-data.js
  node scripts/reset-data.js --users --projects
  node scripts/reset-data.js --tasks --no-backup
`);
  process.exit(0);
}

// 実行
main().catch(error => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
