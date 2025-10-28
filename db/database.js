const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nulltasker.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

class DatabaseManager {
  constructor(dbPath = DB_PATH) {
    this.db = new Database(dbPath, { verbose: console.log });
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON'); // 外部キー制約を有効化
  }

  /**
   * データベーススキーマを初期化
   */
  initializeSchema() {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    this.db.exec(schema);
    console.log('データベーススキーマを初期化しました');
  }

  /**
   * データベースを閉じる
   */
  close() {
    this.db.close();
  }

  // ========== ユーザー関連 ==========

  /**
   * 全ユーザーを取得
   */
  getAllUsers() {
    const stmt = this.db.prepare('SELECT * FROM users');
    return stmt.all();
  }

  /**
   * ユーザーをIDで取得
   */
  getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * ユーザーをログインIDで取得
   */
  getUserByLoginId(loginId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE login_id = ?');
    return stmt.get(loginId);
  }

  /**
   * ユーザーをメールアドレスで取得
   */
  getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  /**
   * ユーザーを作成
   */
  createUser(user) {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, login_id, display_name, email, password, role, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      user.id,
      user.loginId,
      user.displayName,
      user.email,
      user.password,
      user.role,
      user.createdAt,
      user.lastLogin
    );
    
    return info.changes > 0;
  }

  /**
   * ユーザーを更新
   */
  updateUser(id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(updates.displayName);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.password !== undefined) {
      fields.push('password = ?');
      values.push(updates.password);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.lastLogin !== undefined) {
      fields.push('last_login = ?');
      values.push(updates.lastLogin);
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    const info = stmt.run(...values);
    
    return info.changes > 0;
  }

  /**
   * ユーザーを削除
   */
  deleteUser(id) {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  // ========== プロジェクト関連 ==========

  /**
   * 全プロジェクトを取得
   */
  getAllProjects() {
    const stmt = this.db.prepare('SELECT * FROM projects');
    const projects = stmt.all();
    return projects.map(p => ({
      ...p,
      settings: JSON.parse(p.settings)
    }));
  }

  /**
   * プロジェクトをIDで取得
   */
  getProjectById(id) {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = stmt.get(id);
    if (project) {
      project.settings = JSON.parse(project.settings);
    }
    return project;
  }

  /**
   * ユーザーが所属するプロジェクトを取得
   */
  getProjectsByUserId(userId) {
    const stmt = this.db.prepare(`
      SELECT p.* FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
    `);
    const projects = stmt.all(userId);
    return projects.map(p => ({
      ...p,
      settings: JSON.parse(p.settings)
    }));
  }

  /**
   * プロジェクトを作成
   */
  createProject(project) {
    const createProjectStmt = this.db.prepare(`
      INSERT INTO projects (id, name, description, owner, settings, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = createProjectStmt.run(
      project.id,
      project.name,
      project.description || '',
      project.owner,
      JSON.stringify(project.settings),
      project.createdAt,
      project.lastUpdated
    );
    
    return info.changes > 0;
  }

  /**
   * プロジェクトを更新
   */
  updateProject(id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.owner !== undefined) {
      fields.push('owner = ?');
      values.push(updates.owner);
    }
    if (updates.settings !== undefined) {
      fields.push('settings = ?');
      values.push(JSON.stringify(updates.settings));
    }
    if (updates.lastUpdated !== undefined) {
      fields.push('last_updated = ?');
      values.push(updates.lastUpdated);
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const stmt = this.db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    const info = stmt.run(...values);
    
    return info.changes > 0;
  }

  /**
   * プロジェクトを削除
   */
  deleteProject(id) {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  // ========== プロジェクトメンバー関連 ==========

  /**
   * プロジェクトのメンバーを取得
   */
  getProjectMembers(projectId) {
    const stmt = this.db.prepare(`
      SELECT u.id, u.login_id, u.display_name, u.email, u.role, 
             pm.is_admin, pm.joined_at
      FROM users u
      INNER JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
    `);
    return stmt.all(projectId);
  }

  /**
   * プロジェクトの管理者を取得
   */
  getProjectAdmins(projectId) {
    const stmt = this.db.prepare(`
      SELECT u.id FROM users u
      INNER JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ? AND pm.is_admin = 1
    `);
    return stmt.all(projectId).map(row => row.id);
  }

  /**
   * メンバーをプロジェクトに追加
   */
  addProjectMember(projectId, userId, isAdmin = false) {
    const stmt = this.db.prepare(`
      INSERT INTO project_members (project_id, user_id, is_admin, joined_at)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(projectId, userId, isAdmin ? 1 : 0, new Date().toISOString());
    return info.changes > 0;
  }

  /**
   * メンバーをプロジェクトから削除
   */
  removeProjectMember(projectId, userId) {
    const stmt = this.db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?');
    const info = stmt.run(projectId, userId);
    return info.changes > 0;
  }

  /**
   * メンバーの管理者権限を更新
   */
  updateProjectMemberAdmin(projectId, userId, isAdmin) {
    const stmt = this.db.prepare('UPDATE project_members SET is_admin = ? WHERE project_id = ? AND user_id = ?');
    const info = stmt.run(isAdmin ? 1 : 0, projectId, userId);
    return info.changes > 0;
  }

  // ========== タスク関連 ==========

  /**
   * 全タスクを取得
   */
  getAllTasks() {
    const stmt = this.db.prepare('SELECT * FROM tasks');
    const tasks = stmt.all();
    return tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : []
    }));
  }

  /**
   * タスクをIDで取得
   */
  getTaskById(id) {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const task = stmt.get(id);
    if (task && task.tags) {
      task.tags = JSON.parse(task.tags);
    }
    return task;
  }

  /**
   * プロジェクトのタスクを取得
   */
  getTasksByProject(projectId) {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE project = ?');
    const tasks = stmt.all(projectId);
    return tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : []
    }));
  }

  /**
   * ユーザーに割り当てられたタスクを取得
   */
  getTasksByAssignee(assignee) {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE assignee = ?');
    const tasks = stmt.all(assignee);
    return tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : []
    }));
  }

  /**
   * タスクを作成
   */
  createTask(task) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (
        id, project, title, description, assignee, category, priority, 
        status, progress, start_date, due_date, estimated_hours, 
        actual_hours, tags, parent_task, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      task.id,
      task.project,
      task.title,
      task.description || null,
      task.assignee || null,
      task.category || null,
      task.priority || null,
      task.status || 'todo',
      task.progress || 0,
      task.startDate || null,
      task.dueDate || null,
      task.estimatedHours || null,
      task.actualHours || null,
      task.tags ? JSON.stringify(task.tags) : null,
      task.parentTask || null,
      task.createdAt,
      task.updatedAt
    );
    
    return info.changes > 0;
  }

  /**
   * タスクを更新
   */
  updateTask(id, updates) {
    const fields = [];
    const values = [];
    
    const fieldMapping = {
      title: 'title',
      description: 'description',
      assignee: 'assignee',
      category: 'category',
      priority: 'priority',
      status: 'status',
      progress: 'progress',
      startDate: 'start_date',
      dueDate: 'due_date',
      estimatedHours: 'estimated_hours',
      actualHours: 'actual_hours',
      parentTask: 'parent_task',
      updatedAt: 'updated_at'
    };
    
    Object.keys(fieldMapping).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${fieldMapping[key]} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    
    if (fields.length === 0) return false;
    
    // 常にupdated_atを更新
    if (!updates.updatedAt) {
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
    }
    
    values.push(id);
    const stmt = this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
    const info = stmt.run(...values);
    
    return info.changes > 0;
  }

  /**
   * タスクを削除
   */
  deleteTask(id) {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  // ========== 設定関連 ==========

  /**
   * 設定を取得
   */
  getSetting(key) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key);
    return result ? JSON.parse(result.value) : null;
  }

  /**
   * 全設定を取得
   */
  getAllSettings() {
    const stmt = this.db.prepare('SELECT key, value FROM settings');
    const results = stmt.all();
    const settings = {};
    results.forEach(row => {
      settings[row.key] = JSON.parse(row.value);
    });
    return settings;
  }

  /**
   * 設定を保存
   */
  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, last_updated)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, last_updated = ?
    `);
    const now = new Date().toISOString();
    const jsonValue = JSON.stringify(value);
    const info = stmt.run(key, jsonValue, now, jsonValue, now);
    return info.changes > 0;
  }

  /**
   * 設定を削除
   */
  deleteSetting(key) {
    const stmt = this.db.prepare('DELETE FROM settings WHERE key = ?');
    const info = stmt.run(key);
    return info.changes > 0;
  }

  // ========== トランザクション ==========

  /**
   * トランザクションを実行
   */
  transaction(fn) {
    return this.db.transaction(fn);
  }
}

module.exports = DatabaseManager;
