#!/usr/bin/env node
/**
 * NullTasker JSON to SQLite Migration Script
 * 
 * このスクリプトはJSONファイルからSQLiteデータベースへデータを移行します
 */

const fs = require('fs');
const path = require('path');
const DatabaseManager = require('../db/database');

// JSONファイルのパス
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const USERS_FILE = path.join(CONFIG_DIR, 'users.json');
const PROJECTS_FILE = path.join(CONFIG_DIR, 'projects.json');
const TICKETS_FILE = path.join(CONFIG_DIR, 'tickets.json');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

// データベースパス
const DB_PATH = path.join(__dirname, '..', 'db', 'nulltasker.db');

// データベースファイルが既に存在する場合はバックアップ
function backupExistingDatabase() {
  if (fs.existsSync(DB_PATH)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '..', 'db', `nulltasker.backup-${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`既存のデータベースをバックアップしました: ${backupPath}`);
    fs.unlinkSync(DB_PATH);
  }
}

// JSONファイルを読み込む
function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`ファイル読み込みエラー (${filePath}):`, error.message);
    return null;
  }
}

// ユーザーデータを移行
function migrateUsers(db, usersData) {
  if (!usersData || !usersData.users) {
    console.warn('ユーザーデータが見つかりません');
    return;
  }

  console.log('\nユーザーデータを移行中...');
  let count = 0;

  for (const user of usersData.users) {
    try {
      db.createUser({
        id: user.id,
        loginId: user.loginId || user.id,
        displayName: user.displayName || user.id,
        email: user.email || `${user.id}@example.com`,
        password: user.password,
        role: user.role || 'user',
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || null
      });
      count++;
    } catch (error) {
      console.error(`ユーザー移行エラー (${user.id}):`, error.message);
    }
  }

  console.log(`✓ ${count}件のユーザーを移行しました`);
}

// プロジェクトデータを移行
function migrateProjects(db, projectsData) {
  if (!projectsData || !projectsData.projects) {
    console.warn('プロジェクトデータが見つかりません');
    return;
  }

  console.log('\nプロジェクトデータを移行中...');
  let count = 0;

  for (const project of projectsData.projects) {
    try {
      // プロジェクトを作成
      db.createProject({
        id: project.id,
        name: project.name,
        description: project.description || '',
        owner: project.owner,
        settings: project.settings || {},
        createdAt: project.createdAt || new Date().toISOString(),
        lastUpdated: project.lastUpdated || new Date().toISOString()
      });

      // メンバーを追加
      if (project.members && Array.isArray(project.members)) {
        for (const memberId of project.members) {
          const isAdmin = project.admins && project.admins.includes(memberId);
          try {
            db.addProjectMember(project.id, memberId, isAdmin);
          } catch (error) {
            console.error(`メンバー追加エラー (project: ${project.id}, user: ${memberId}):`, error.message);
          }
        }
      }

      count++;
    } catch (error) {
      console.error(`プロジェクト移行エラー (${project.id}):`, error.message);
    }
  }

  console.log(`✓ ${count}件のプロジェクトを移行しました`);
}

// タスクデータを移行
function migrateTasks(db, tasksData) {
  if (!tasksData || !tasksData.tasks) {
    console.warn('タスクデータが見つかりません');
    return;
  }

  console.log('\nタスクデータを移行中...');
  let count = 0;

  for (const task of tasksData.tasks) {
    try {
      db.createTask({
        id: task.id,
        project: task.project || 'default',
        title: task.title,
        description: task.description || null,
        assignee: task.assignee || null,
        category: task.category || null,
        priority: task.priority || null,
        status: task.status || 'todo',
        progress: task.progress || 0,
        startDate: task.startDate || null,
        dueDate: task.dueDate || null,
        estimatedHours: task.estimatedHours || null,
        actualHours: task.actualHours || null,
        tags: task.tags || [],
        parentTask: task.parentTask || null,
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString()
      });
      count++;
    } catch (error) {
      console.error(`タスク移行エラー (${task.id}):`, error.message);
    }
  }

  console.log(`✓ ${count}件のタスクを移行しました`);
}

// 設定データを移行
function migrateSettings(db, settingsData) {
  if (!settingsData) {
    console.warn('設定データが見つかりません');
    return;
  }

  console.log('\n設定データを移行中...');
  let count = 0;

  // lastUpdated以外の全てのプロパティを設定として保存
  for (const [key, value] of Object.entries(settingsData)) {
    if (key === 'lastUpdated') continue;
    
    try {
      db.setSetting(key, value);
      count++;
    } catch (error) {
      console.error(`設定移行エラー (${key}):`, error.message);
    }
  }

  console.log(`✓ ${count}件の設定を移行しました`);
}

// メイン処理
function main() {
  console.log('='.repeat(60));
  console.log('NullTasker データベース移行スクリプト');
  console.log('JSON → SQLite');
  console.log('='.repeat(60));

  // 既存のデータベースをバックアップ
  backupExistingDatabase();

  // データベースマネージャーを初期化
  const db = new DatabaseManager(DB_PATH);
  
  try {
    // スキーマを初期化
    console.log('\nデータベーススキーマを初期化中...');
    db.initializeSchema();
    console.log('✓ スキーマの初期化が完了しました');

    // JSONファイルを読み込み
    const usersData = loadJSON(USERS_FILE);
    const projectsData = loadJSON(PROJECTS_FILE);
    const tasksData = loadJSON(TICKETS_FILE);
    const settingsData = loadJSON(SETTINGS_FILE);

    // トランザクション内でデータを移行
    const migrate = db.transaction(() => {
      migrateUsers(db, usersData);
      migrateProjects(db, projectsData);
      migrateTasks(db, tasksData);
      migrateSettings(db, settingsData);
    });

    migrate();

    console.log('\n' + '='.repeat(60));
    console.log('✓ データ移行が完了しました!');
    console.log(`データベース: ${DB_PATH}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ 移行中にエラーが発生しました:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { main };
