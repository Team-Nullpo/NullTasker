// admin-manager.js - システム管理機能
import { Utils } from './utils.js';
import { SimpleAuth } from './simple-auth.js';
import { ProjectManager } from './project-manager.js';
import { UserManager } from './user-manager.js';

export class AdminManager {
  constructor() {
    this.users = [];
    this.projects = [];
    this.currentSection = 'dashboard';
    this.editingProjectId = null;
    this.editingUserId = null;
    this.deletingUserId = null;
    this.init();
  }

  async init() {
    try {
      // 認証チェック（システム管理者のみ）
      if (!SimpleAuth.isLoggedIn() || !SimpleAuth.hasRole('system_admin')) {
        alert('システム管理者権限が必要です');
        window.location.href = '/index.html';
        return;
      }

      await this.loadData();
      this.setupEventListeners();
      this.updateDashboardStats();
      this.populateProjectForm();
    } catch (error) {
      console.error('初期化エラー:', error);
      this.showError('初期化に失敗しました');
    }
  }

  async loadData() {
    await ProjectManager.fetchProjectSettings(true);
    this.projects = ProjectManager.getProjectSettings();
    await UserManager.fetchUsers(true);
    this.users = UserManager.getUsers();
  }

  setupEventListeners() {
    const add = (selector, event, handler) => {
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) return;
      el.addEventListener(event, handler);
    };

    const mappings = [
      // ダッシュボード → 各セクション
      ['#dashboardUser', 'click', () => this.showSection('users')],
      ['#dashboardProject', 'click', () => this.showSection('projects')],
      ['#dashboardSystem', 'click', () => this.showSection('system')],
      ['#dashboardBackup', 'click', () => this.showSection('backup')],

      // 各フォーム送信
      ['#userForm', 'submit', this.handleUserSubmit.bind(this)],
      ['#projectForm', 'submit', this.handleProjectSubmit.bind(this)],
      ['#systemSettingsForm', 'submit', this.handleSystemSettingsSubmit.bind(this)],

      // ファイル復元
      ['#restoreFile', 'change', this.handleFileRestore.bind(this)],

      // プロジェクト遷移
      ['#projectSelect', 'change', this.changeProject.bind(this)],

      // ユーザー管理セクション
      ['#usersSection .section-actions .btn.btn-primary', 'click', () => this.showUserModal()],
      [
        '#usersSection .section-actions .btn.btn-secondary',
        'click',
        () => this.showSection('dashboard')
      ],

      // プロジェクト管理セクション
      [
        '#projectsSection .section-actions .btn.btn-primary',
        'click',
        () => this.showProjectModal()
      ],
      [
        '#projectsSection .section-actions .btn.btn-secondary',
        'click',
        () => this.showSection('dashboard')
      ],

      // システム設定セクション
      [
        '#systemSection .section-actions .btn.btn-secondary',
        'click',
        () => this.showSection('dashboard')
      ],

      // バックアップセクション
      ['#backupSection .section-actions .btn.btn-primary', 'click', () => this.createBackup()],
      [
        '#backupSection .section-actions .btn.btn-secondary',
        'click',
        () => this.showSection('dashboard')
      ],

      // データ/設定ダウンロード
      [
        '#backupSection .backup-card:nth-of-type(1) .btn.btn-primary',
        'click',
        () => this.downloadDataBackup()
      ],
      [
        '#backupSection .backup-card:nth-of-type(2) .btn.btn-primary',
        'click',
        () => this.downloadSettingsBackup()
      ],

      ['#deleteUser', 'click', () => this.deleteUser(this.deletingUserId)],

      // モーダルのクローズ（×ボタン）
      ['#userModal .modal-close', 'click', () => this.closeUserModal()],
      ['#projectModal .modal-close', 'click', () => this.closeProjectModal()],
      ['#userDeleteModal .close-btn', 'click', () => this.closeUserDeleteModal()],

      // モーダルのキャンセルボタン
      ['#userModal .btn.btn-secondary', 'click', () => this.closeUserModal()],
      ['#projectModal .btn.btn-secondary', 'click', () => this.closeProjectModal()],
      ['#userDeleteModal .btn.btn-secondary', 'click', () => this.closeUserDeleteModal()],

      //
      ['#usersTableBody', 'click', e => this.handleUserTableClick(e)],
      ['#projectsTableBody', 'click', e => this.handleProjectTableClick(e)]
    ];

    mappings.forEach(([selector, event, handler]) => add(selector, event, handler));

    // モーダル外クリックで閉じる（ウィンドウ全体）
    window.addEventListener('click', event => {
      if (event.target && event.target.classList && event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
      }
    });
  }

  handleUserTableClick(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const container = button.closest('tr');
    const userId = container?.dataset.user;
    if (!userId) return;

    if (button.classList.contains('btn-edit')) this.editUser(userId);
    else if (button.classList.contains('btn-delete')) this.showUserDeleteModal(userId);
  }

  handleProjectTableClick(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const container = button.closest('tr');
    const projectId = container?.dataset.project;
    if (!projectId) return;

    if (button.classList.contains('btn-edit')) this.editProject(projectId);
    else if (button.classList.contains('btn-delete')) this.deleteProject(projectId);
  }

  async changeProject() {
    const projectChange = document.getElementById('projectSelect');
    const destination = projectChange.value;
    if (!this.projects.find(project => project.id === destination)) {
      console.error('指定のプロジェクトが見つかりません');
      return;
    }
    ProjectManager.setCurrentProject(destination);
    await ProjectManager.fetchProjectSettings();
  }

  populateProjectForm() {
    const projectForm = document.getElementById('projectSelect');
    if (!projectForm) {
      console.error('プロジェクト移動メニューが見つかりません');
      return;
    }
    console.log(this.projects);
    projectForm.innerHTML = '';
    this.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.label = project.name;
      option.selected = project.id === ProjectManager.getCurrentProjectId();
      projectForm.appendChild(option);
    });
  }

  updateDashboardStats() {
    const userCountEl = document.getElementById('userCount');
    const projectCountEl = document.getElementById('projectCount');

    if (userCountEl) {
      userCountEl.textContent = `${this.users.length} ユーザー`;
    }

    if (projectCountEl) {
      projectCountEl.textContent = `${this.projects.length} プロジェクト`;
    }
  }

  // セクション切り替え
  showSection(section) {
    // 全セクションを非表示
    document.querySelectorAll('.admin-section').forEach(el => {
      el.style.display = 'none';
    });

    this.currentSection = section;

    switch (section) {
      case 'users':
        document.getElementById('usersSection').style.display = 'block';
        this.loadUsersTable();
        break;
      case 'projects':
        document.getElementById('projectsSection').style.display = 'block';
        this.loadProjectsTable();
        break;
      case 'system':
        document.getElementById('systemSection').style.display = 'block';
        this.loadSystemSettings();
        break;
      case 'backup':
        document.getElementById('backupSection').style.display = 'block';
        break;
      case 'dashboard':
      default:
        // ダッシュボードは常に表示されている
        break;
    }
  }

  // ユーザーテーブル読み込み
  loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    this.users.forEach(user => {
      const row = document.createElement('tr');
      row.setAttribute('data-user', user.id);
      row.innerHTML = `
        <td>${user.loginId || user.id}</td>
        <td>${user.displayName}</td>
        <td>${user.email}</td>
        <td><span class="role-badge role-${user.role}">${this.getRoleDisplayName(
        user.role
      )}</span></td>
        <td>${user.projects ? user.projects.join(', ') : '-'}</td>
        <td>${
          user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ja-JP') : '未ログイン'
        }</td>
        <td>
          <button class="btn btn-sm btn-primary btn-edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // プロジェクトテーブル読み込み
  loadProjectsTable() {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    this.projects.forEach(project => {
      const row = document.createElement('tr');
      row.setAttribute('data-project', project.id);
      const ownerUser = this.users.find(u => u.id === project.owner);

      row.innerHTML = `
        <td>${project.name}</td>
        <td>${project.description || '-'}</td>
        <td>${ownerUser ? ownerUser.displayName : project.owner}</td>
        <td>${project.members ? project.members.length : 0}</td>
        <td>${new Date(project.createdAt).toLocaleDateString('ja-JP')}</td>
        <td>${new Date(project.lastUpdated).toLocaleDateString('ja-JP')}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // ユーザーモーダル表示
  showUserModal(userId = null) {
    this.editingUserId = userId;
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    const passwordGroup = document.getElementById('passwordGroup');

    if (userId) {
      // 編集モード
      const user = this.users.find(u => u.id === userId);
      if (!user) return;

      title.textContent = 'ユーザー編集';
      document.getElementById('userLoginId').value = user.loginId;
      document.getElementById('userDisplayName').value = user.displayName;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userRole').value = user.role;
      document.getElementById('userPassword').value = '';
      document.getElementById('userPassword').required = false;

      // 編集時はログインIDを変更不可
      document.getElementById('userLoginId').readOnly = true;
    } else {
      // 新規作成モード
      title.textContent = '新規ユーザー';
      form.reset();
      document.getElementById('userPassword').required = true;
      document.getElementById('userLoginId').readOnly = false;
    }

    modal.style.display = 'block';
  }

  closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
  }

  // プロジェクトモーダル表示
  showProjectModal(projectId = null) {
    this.editingProjectId = projectId;
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    const form = document.getElementById('projectForm');
    const ownerSelect = document.getElementById('projectOwner');

    // オーナー選択肢を設定
    ownerSelect.innerHTML = '';
    this.users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.displayName} (${user.loginId || user.id})`;
      ownerSelect.appendChild(option);
    });

    if (projectId) {
      // 編集モード
      const project = this.projects.find(p => p.id === projectId);
      if (!project) return;

      title.textContent = 'プロジェクト編集';
      document.getElementById('projectName').value = project.name;
      document.getElementById('projectDescription').value = project.description || '';
      document.getElementById('projectOwner').value = project.owner;
    } else {
      // 新規作成モード
      title.textContent = '新規プロジェクト';
      form.reset();
    }

    modal.style.display = 'block';
  }

  closeProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
  }

  showUserDeleteModal(userId) {
    this.deletingUserId = userId;
    const modal = document.getElementById('userDeleteModal');
    if (!modal) {
      console.log("ユーザー削除モーダルが存在しません");
      return;
    }
    modal.classList.add("show");
  }

  closeUserDeleteModal() {
    const modal = document.getElementById('userDeleteModal');
    if (!modal) {
      console.log("ユーザー削除モーダルが存在しません");
      return;
    }
    modal.classList.remove("show");
  }

  // ユーザーフォーム送信
  async handleUserSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const userData = {
      loginId: formData.get('loginId'),
      displayName: formData.get('displayName'),
      email: formData.get('email'),
      role: formData.get('role'),
      password: formData.get('password')
    };

    // パスワードが空の場合は除外（編集時）
    if (!userData.password) {
      delete userData.password;
    }

    if (this.editingUserId) {
      if (!await UserManager.updateUser(userData, this.editingUserId)) {
        Utils.showNotification('ユーザー更新に失敗しました');
        return;
      }
    } else {
      if (!await UserManager.addUser(userData, true)) {
        Utils.showNotification('ユーザー作成に失敗しました');
        return;
      }
    }

    this.showSuccess(this.editingUserId ? 'ユーザーを更新しました' : 'ユーザーを作成しました');
    this.closeUserModal();
    await this.loadData();
    this.loadUsersTable();
  }

  // プロジェクトフォーム送信
  async handleProjectSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const projectData = {
      name: formData.get('name'),
      description: formData.get('description'),
      owner: formData.get('owner')
    };

    if (this.editingProjectId) {
      if (!(await ProjectManager.updateProject(projectData, this.editingProjectId))) {
        Utils.showNotification('プロジェクト更新に失敗しました');
        return;
      }
    } else {
      if (!(await ProjectManager.addProject(projectData))) {
        Utils.showNotification('プロジェクト作成に失敗しました');
        return;
      }
    }
    this.showSuccess(
      this.editingProjectId ? 'プロジェクトを更新しました' : 'プロジェクトを作成しました'
    );
    this.closeProjectModal();
    await this.loadData();
    this.loadProjectsTable();
    this.updateDashboardStats();
  }

  // システム設定フォーム送信
  async handleSystemSettingsSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const settingsData = {
      systemName: formData.get('systemName'),
      defaultLanguage: formData.get('defaultLanguage'),
      allowUserRegistration: formData.has('allowUserRegistration'),
      enableNotifications: formData.has('enableNotifications')
    };

    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(settingsData)
      });

      if (!response.ok) {
        throw new Error('システム設定の保存に失敗しました');
      }

      this.showSuccess('システム設定を保存しました');
    } catch (error) {
      console.error('システム設定エラー:', error);
      this.showError(error.message);
    }
  }

  // ユーザー編集
  editUser(userId) {
    this.showUserModal(userId);
  }

  // ユーザー削除
  async deleteUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    await UserManager.removeUser(userId);
    this.showSuccess('ユーザーを削除しました');
    await this.loadData();
    this.loadUsersTable();
    this.updateDashboardStats();
  }

  // プロジェクト編集
  editProject(projectId) {
    this.showProjectModal(projectId);
  }

  // プロジェクト削除
  async deleteProject(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    if (!confirm(`プロジェクト「${project.name}」を削除しますか？`)) {
      return;
    }
    await ProjectManager.removeProject(projectId);
    this.showSuccess('プロジェクトを削除しました');
    await this.loadData();
    this.loadProjectsTable();
    this.updateDashboardStats();
  }

  // バックアップ作成
  async createBackup() {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: SimpleAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('バックアップの作成に失敗しました');
      }

      const result = await response.json();
      this.showSuccess(`バックアップを作成しました: ${result.filename}`);
    } catch (error) {
      console.error('バックアップエラー:', error);
      this.showError(error.message);
    }
  }

  // データバックアップダウンロード
  async downloadDataBackup() {
    try {
      const response = await fetch('/api/admin/backup/download/data', {
        headers: SimpleAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('データバックアップの取得に失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nulltasker-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('データバックアップエラー:', error);
      this.showError(error.message);
    }
  }

  // 設定バックアップダウンロード
  async downloadSettingsBackup() {
    try {
      const response = await fetch('/api/admin/backup/download/settings', {
        headers: SimpleAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('設定バックアップの取得に失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nulltasker-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('設定バックアップエラー:', error);
      this.showError(error.message);
    }
  }

  // ファイル復元処理
  async handleFileRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('このファイルからデータを復元しますか？現在のデータは上書きされます。')) {
      event.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('restoreFile', file);

      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          Authorization: SimpleAuth.getAuthHeaders().Authorization
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'データの復元に失敗しました');
      }

      this.showSuccess('データを復元しました。ページをリロードします。');

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('データ復元エラー:', error);
      this.showError(error.message);
    } finally {
      event.target.value = '';
    }
  }

  // ユーティリティメソッド
  getRoleDisplayName(role) {
    const roleNames = {
      system_admin: 'システム管理者',
      project_admin: 'プロジェクト管理者',
      member: 'メンバー'
    };
    return roleNames[role] || 'ゲスト';
  }

  generateProjectId(name) {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
        .substring(0, 20) +
      '_' +
      Date.now()
    );
  }

  loadSystemSettings() {
    // システム設定をロード（今後実装）
  }

  showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    successText.textContent = message;
    successDiv.style.display = 'block';

    // エラーメッセージを隠す
    document.getElementById('errorMessage').style.display = 'none';

    // 3秒後に自動で隠す
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);

    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    errorText.textContent = message;
    errorDiv.style.display = 'block';

    // 成功メッセージを隠す
    document.getElementById('successMessage').style.display = 'none';

    // 5秒後に自動で隠す
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);

    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// グローバル関数（HTMLから呼び出し用）
window.showSection = section => {
  if (window.adminManager) {
    window.adminManager.showSection(section);
  }
};

window.showUserModal = userId => {
  if (window.adminManager) {
    window.adminManager.showUserModal(userId);
  }
};

window.closeUserModal = () => {
  if (window.adminManager) {
    window.adminManager.closeUserModal();
  }
};

window.showProjectModal = projectId => {
  if (window.adminManager) {
    window.adminManager.showProjectModal(projectId);
  }
};

window.closeProjectModal = () => {
  if (window.adminManager) {
    window.adminManager.closeProjectModal();
  }
};

window.createBackup = () => {
  if (window.adminManager) {
    window.adminManager.createBackup();
  }
};

window.downloadDataBackup = () => {
  if (window.adminManager) {
    window.adminManager.downloadDataBackup();
  }
};

window.downloadSettingsBackup = () => {
  if (window.adminManager) {
    window.adminManager.downloadSettingsBackup();
  }
};

// ページ読み込み時に初期化
// document.addEventListener('DOMContentLoaded', () => {
//   window.adminManager = new AdminManager();
// });

// export { AdminManager };
