#!/usr/bin/env node#!/usr/bin/env node



/**/**

 * データリセット用スクリプト (SQLite版) * データリセット用スクリプト

 * データベースを初期状態にリセットする * Git にコミットする前に実行することで、開発用データを初期状態にリセットする

 */ */



const fs = require('fs');const fs = require('fs').promises;

const path = require('path');const path = require('path');

const bcrypt = require('bcrypt');const bcrypt = require('bcrypt');

const DatabaseManager = require('../db/database');const { CONNREFUSED } = require('dns');



// データベースパス// ファイルパス

const DB_PATH = path.join(__dirname, '..', 'db', 'nulltasker.db');const CONFIG_DIR = path.join(__dirname, '..', 'config');

const BACKUP_DIR = path.join(__dirname, '..', 'db', 'backups');const USERS_FILE = path.join(CONFIG_DIR, 'users.json');

const TICKETS_FILE = path.join(CONFIG_DIR, 'tickets.json');

// 初期データconst SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

const INITIAL_DATA = {const PROJECTS_FILE = path.join(CONFIG_DIR, 'projects.json')

  admin: {

    id: "admin",// 初期データ

    loginId: "admin",const INITIAL_DATA = {

    displayName: "管理者",  users: {

    email: "admin@nulltasker.com",    users: [

    password: "admin123", // プレーンテキスト（後でハッシュ化）      {

    role: "system_admin",        id: "admin",

    createdAt: "2025-09-01T00:00:00.000Z",        loginId: "admin",

    lastLogin: null        displayName: "管理者",

  },        email: "admin@nulltasker.com",

          password: "", // 後でハッシュ化

  defaultProject: {        role: "system_admin",

    id: "default",        projects: ["default"],

    name: "デフォルトプロジェクト",        createdAt: "2025-09-01T00:00:00.000Z",

    description: "初期プロジェクト",        lastLogin: null

    owner: "admin",      }

    settings: {    ],

      categories: [    lastUpdated: new Date().toISOString()

        '企画',  },

        '開発',  

        'デザイン',  tickets: {

        'テスト',    tasks: [],

        'ドキュメント',    lastUpdated: new Date().toISOString()

        '会議',  },

        'その他'  

      ],  settings: {

      priorities: [    appName: "NullTasker",

        {    version: "1.0.0",

          value: "high",    theme: "light",

          label: "高優先度",    language: "ja",

          color: "#c62828"    timezone: "Asia/Tokyo",

        },    features: {

        {      notifications: true,

          value: "medium",      autoSave: true,

          label: "中優先度",      backupEnabled: true

          color: "#ef6c00"    },

        },    lastUpdated: new Date().toISOString()

        {  },

          value: "low",

          label: "低優先度",  projects: {

          color: "#2e7d32"    projects: [

        }        {

      ],          id: "default",

      statuses: [          name: "デフォルトプロジェクト",

        {          description: "初期プロジェクト",

          value: "todo",          owner: "admin",

          label: "未着手",          members: ["admin"],

          color: "#666"          admins: ["admin"],

        },          settings: {

        {            "categories": [

          value: "in_progress",            '企画',

          label: "進行中",            '開発',

          color: "#1976d2"            'デザイン',

        },            'テスト',

        {            'ドキュメント',

          value: "review",            '会議',

          label: "レビュー中",            'その他'

          color: "#f57c00"          ],

        },          "priorities": [

        {            {

          value: "done",              "value": "high",

          label: "完了",              "label": "高優先度",

          color: "#388e3c"              "color": "#c62828"

        }            },

      ],            {

      notifications: true,              "value": "medium",

      autoAssign: false              "label": "中優先度",

    },              "color": "#ef6c00"

    createdAt: "2025-09-01T00:00:00.000Z",            },

    lastUpdated: "2025-09-07T00:00:00.000Z"            {

  },              "value": "low",

              "label": "低優先度",

  settings: {              "color": "#2e7d32"

    appName: "NullTasker",            }

    version: "1.0.0",          ],

    theme: "light",          "statuses": [

    language: "ja",            {

    timezone: "Asia/Tokyo",              "value": "todo",

    features: {              "label": "未着手",

      notifications: true,              "color": "#666"

      autoSave: true,            },

      backupEnabled: true            {

    }              "value": "in_progress",

  }              "label": "進行中",

};              "color": "#1976d2"

            },

/**            {

 * バックアップを作成              "value": "review",

 */              "label": "レビュー中",

async function createBackup() {              "color": "#f57c00"

  if (!fs.existsSync(DB_PATH)) {            },

    console.log('⚠️  データベースファイルが存在しません（スキップ）');            {

    return;              "value": "done",

  }              "label": "完了",

              "color": "#388e3c"

  try {            }

    if (!fs.existsSync(BACKUP_DIR)) {          ],

      fs.mkdirSync(BACKUP_DIR, { recursive: true });          "notifications": true,

    }          "autoAssign": false

          },

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');          createdAt: "2025-09-01T00:00:00.000Z",

    const backupPath = path.join(BACKUP_DIR, `nulltasker.backup-${timestamp}.db`);          lastUpdated: "2025-09-07T00:00:00.000Z"

            },

    fs.copyFileSync(DB_PATH, backupPath);      ],

    console.log(`📦 バックアップを作成しました: ${path.relative(path.join(__dirname, '..'), backupPath)}`);      lastUpdated: new Date().toISOString()

  } catch (error) {  }

    console.warn('⚠️  バックアップの作成に失敗しました:', error.message);};

  }

}async function resetUsers() {

  console.log('📄 ユーザーデータをリセット中...');

/**  

 * データベースを削除して再作成  // パスワードをハッシュ化

 */  const hashedPassword = await bcrypt.hash('admin123', 10);

function recreateDatabase() {  INITIAL_DATA.users.users[0].password = hashedPassword;

  if (fs.existsSync(DB_PATH)) {  

    fs.unlinkSync(DB_PATH);  await fs.writeFile(USERS_FILE, JSON.stringify(INITIAL_DATA.users, null, 2));

    console.log('🗑️  既存のデータベースを削除しました');  console.log('✅ ユーザーデータをリセットしました');

  }  console.log('   - 管理者アカウント: admin / admin123');

  }

  // WALファイルも削除

  const walPath = DB_PATH + '-wal';async function resetTickets() {

  const shmPath = DB_PATH + '-shm';  console.log('📋 タスクデータをリセット中...');

  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);  

  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);  await fs.writeFile(TICKETS_FILE, JSON.stringify(INITIAL_DATA.tickets, null, 2));

}  console.log('✅ タスクデータをリセットしました');

}

/**

 * ユーザーをリセットasync function resetSettings() {

 */  console.log('⚙️  設定データをリセット中...');

async function resetUsers(db) {  

  console.log('👤 ユーザーデータをリセット中...');  await fs.writeFile(SETTINGS_FILE, JSON.stringify(INITIAL_DATA.settings, null, 2));

    console.log('✅ 設定データをリセットしました');

  // 既存ユーザーを全削除}

  const users = db.getAllUsers();

  users.forEach(user => db.deleteUser(user.id));async function resetProjects() {

      console.log('プロジェクトデータをリセット中...');

  // 管理者ユーザーを作成    

  const hashedPassword = await bcrypt.hash(INITIAL_DATA.admin.password, 10);    await fs.writeFile(PROJECTS_FILE, JSON.stringify(INITIAL_DATA.projects, null, 2));

  db.createUser({}

    ...INITIAL_DATA.admin,

    password: hashedPasswordasync function createBackup() {

  });  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const backupDir = path.join(CONFIG_DIR, 'backups');

  console.log('✅ ユーザーデータをリセットしました');  

  console.log('   - 管理者アカウント: admin / admin123');  try {

}    await fs.mkdir(backupDir, { recursive: true });

    

/**    // 既存ファイルのバックアップ

 * プロジェクトをリセット    const files = ['users.json', 'tickets.json', 'settings.json', 'projects.json'];

 */    for (const file of files) {

function resetProjects(db) {      const sourcePath = path.join(CONFIG_DIR, file);

  console.log('📁 プロジェクトデータをリセット中...');      const backupPath = path.join(backupDir, `${file}.backup.${timestamp}`);

        

  // 既存プロジェクトを全削除（defaultを除く）      try {

  const projects = db.getAllProjects();        await fs.copyFile(sourcePath, backupPath);

  projects.forEach(project => {      } catch (error) {

    if (project.id !== 'default') {        // ファイルが存在しない場合はスキップ

      db.deleteProject(project.id);        if (error.code !== 'ENOENT') {

    }          throw error;

  });        }

        }

  // デフォルトプロジェクトが存在する場合は更新、なければ作成    }

  const existingDefault = db.getProjectById('default');    

  if (existingDefault) {    console.log(`📦 バックアップを作成しました: config/backups/*backup.${timestamp}`);

    db.updateProject('default', {  } catch (error) {

      name: INITIAL_DATA.defaultProject.name,    console.warn('⚠️  バックアップの作成に失敗しました:', error.message);

      description: INITIAL_DATA.defaultProject.description,  }

      owner: INITIAL_DATA.defaultProject.owner,}

      settings: INITIAL_DATA.defaultProject.settings,

      lastUpdated: INITIAL_DATA.defaultProject.lastUpdatedasync function main() {

    });  const args = process.argv.slice(2);

      const options = {

    // メンバーをリセット    users: args.includes('--users') || args.includes('-u'),

    const members = db.getProjectMembers('default');    tickets: args.includes('--tickets') || args.includes('-t'),

    members.forEach(member => db.removeProjectMember('default', member.id));    settings: args.includes('--settings') || args.includes('-s'),

  } else {    projects: args.includes('--projects') || args.includes('-p'),

    db.createProject(INITIAL_DATA.defaultProject);    backup: !args.includes('--no-backup'),

  }    help: args.includes('--help') || args.includes('-h')

    };

  // 管理者をメンバーとして追加  

  db.addProjectMember('default', 'admin', true);  // ヘルプ表示

    if (options.help) {

  console.log('✅ プロジェクトデータをリセットしました');    console.log(`

}NullTasker データリセットスクリプト



/**使用方法:

 * タスクをリセット  node scripts/reset-data.js [オプション]

 */

function resetTasks(db) {オプション:

  console.log('📋 タスクデータをリセット中...');  --users, -u      ユーザーデータのみリセット

    --tickets, -t    タスクデータのみリセット  

  // 全タスクを削除  --settings, -s   設定データのみリセット

  const tasks = db.getAllTasks();  --projects, -p   プロジェクトデータのみリセット

  tasks.forEach(task => db.deleteTask(task.id));  --no-backup      バックアップを作成しない

    --help, -h       このヘルプを表示

  console.log('✅ タスクデータをリセットしました');

}例:

  node scripts/reset-data.js                # 全データをリセット

/**  node scripts/reset-data.js --users        # ユーザーデータのみリセット

 * 設定をリセット  node scripts/reset-data.js -u -t          # ユーザーとタスクデータをリセット

 */  node scripts/reset-data.js --no-backup    # バックアップなしでリセット

function resetSettings(db) {    `);

  console.log('⚙️  設定データをリセット中...');    return;

    }

  // 既存設定を削除してから新しい設定を保存  

  const existingSettings = db.getAllSettings();  // 全てのオプションが false の場合は全リセット

  Object.keys(existingSettings).forEach(key => db.deleteSetting(key));  const resetAll = !options.users && !options.tickets && !options.settings;

    

  Object.entries(INITIAL_DATA.settings).forEach(([key, value]) => {  console.log('🔄 NullTasker データリセット開始\n');

    db.setSetting(key, value);  

  });  try {

      // config ディレクトリが存在しない場合は作成

  console.log('✅ 設定データをリセットしました');    await fs.mkdir(CONFIG_DIR, { recursive: true });

}    

    // バックアップ作成

/**    if (options.backup) {

 * メイン処理      await createBackup();

 */      console.log();

async function main() {    }

  const args = process.argv.slice(2);    

  const options = {    // リセット実行

    users: args.includes('--users') || args.includes('-u'),    if (resetAll || options.users) {

    tasks: args.includes('--tasks') || args.includes('-t'),      await resetUsers();

    settings: args.includes('--settings') || args.includes('-s'),    }

    projects: args.includes('--projects') || args.includes('-p'),    

    backup: !args.includes('--no-backup'),    if (resetAll || options.tickets) {

    clean: args.includes('--clean'),      await resetTickets();

    help: args.includes('--help') || args.includes('-h')    }

  };    

      if (resetAll || options.settings) {

  // ヘルプ表示      await resetSettings();

  if (options.help) {    }

    console.log(`

NullTasker データリセットスクリプト (SQLite版)    if (resetAll || options.projects) {

        await resetProjects();

使用方法:    }

  node scripts/reset-data.js [オプション]    

    console.log('\n🎉 データリセットが完了しました！');

オプション:    

  --users, -u      ユーザーデータのみリセット    if (resetAll || options.users) {

  --tasks, -t      タスクデータのみリセット        console.log('\nログイン情報:');

  --settings, -s   設定データのみリセット      console.log('  ID: admin');

  --projects, -p   プロジェクトデータのみリセット      console.log('  パスワード: admin123');

  --clean          データベースを完全に再作成    }

  --no-backup      バックアップを作成しない    

  --help, -h       このヘルプを表示  } catch (error) {

    console.error('❌ エラーが発生しました:', error.message);

例:    process.exit(1);

  npm run reset                    # 全データをリセット  }

  npm run reset:users              # ユーザーデータのみリセット}

  npm run reset:tasks              # タスクデータのみリセット

  node scripts/reset-data.js --clean   # データベースを完全再作成// スクリプトが直接実行された場合のみ main を呼び出し

    `);if (require.main === module) {

    return;  main();

  }}

  

  // 全てのオプションが false の場合は全リセットmodule.exports = { resetUsers, resetTickets, resetSettings, resetProjects, createBackup };

  const resetAll = !options.users && !options.tasks && !options.settings && !options.projects;
  
  console.log('🔄 NullTasker データリセット開始\n');
  
  try {
    // バックアップ作成
    if (options.backup && !options.clean) {
      await createBackup();
      console.log();
    }
    
    let db;
    
    if (options.clean || resetAll) {
      // データベースを完全に再作成
      if (options.backup) {
        await createBackup();
        console.log();
      }
      recreateDatabase();
      db = new DatabaseManager(DB_PATH);
      console.log('🆕 新しいデータベースを作成中...');
      db.initializeSchema();
      console.log('✅ スキーマを初期化しました\n');
      
      // トランザクション内で初期データを作成
      const initialize = db.transaction(async () => {
        await resetUsers(db);
        resetProjects(db);
        resetTasks(db);
        resetSettings(db);
      });
      
      initialize();
    } else {
      // 部分的なリセット
      db = new DatabaseManager(DB_PATH);
      
      const reset = db.transaction(async () => {
        if (options.users) await resetUsers(db);
        if (options.projects) resetProjects(db);
        if (options.tasks) resetTasks(db);
        if (options.settings) resetSettings(db);
      });
      
      reset();
    }
    
    db.close();
    
    console.log('\n🎉 データリセットが完了しました！');
    
    if (resetAll || options.users || options.clean) {
      console.log('\nログイン情報:');
      console.log('  ID: admin');
      console.log('  パスワード: admin123');
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ main を呼び出し
if (require.main === module) {
  main();
}

module.exports = { resetUsers, resetTasks, resetSettings, resetProjects, createBackup };
