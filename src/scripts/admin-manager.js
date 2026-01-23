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
      ['#dashboardCategories', 'click', () => this.showSection('categories')],
      ['#dashboardPriorities', 'click', () => this.showSection('priorities')],
      ['#dashboardStatuses', 'click', () => this.showSection('statuses')],

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
      ['#backToDashboard4', 'click', () => this.showSection('dashboard')],
      ['#exportDataBtn', 'click', () => this.exportData()],
      ['#exportSettingsBtn', 'click', () => this.downloadSettingsBackup()],
      ['#importDataBtn', 'click', () => this.importData()],
      ['#clearDataBtn', 'click', () => this.clearAllData()],

      // 分類管理セクション
      ['#backToDashboard6', 'click', () => this.showSection('dashboard')],
      ['#addCategoryBtn', 'click', () => this.addCategory()],

      // 優先度管理セクション
      ['#backToDashboard7', 'click', () => this.showSection('dashboard')],
      ['#addPriorityBtn', 'click', () => this.addPriority()],

      // ステータス管理セクション
      ['#backToDashboard8', 'click', () => this.showSection('dashboard')],
      ['#addStatusBtn', 'click', () => this.addStatus()],

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

    // Enterキーでメンバー/カテゴリー追加
    const memberInput = document.getElementById('memberInput');
    const categoryInput = document.getElementById('categoryInput');
    if (memberInput) {
      memberInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.addMember();
      });
    }
    if (categoryInput) {
      categoryInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.addCategory();
      });
    }

    // ファイル入力のセットアップ
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', e => this.handleFileImport(e));
    }

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

    // 設定を読み込み
    const settings = Utils.getFromStorage('appSettings') || { users: [], categories: [], priorities: [], statuses: [] };
    const categoryCountEl = document.getElementById('categoryCount');
    const priorityCountEl = document.getElementById('priorityCount');
    const statusCountEl = document.getElementById('statusCount');

    if (userCountEl) {
      userCountEl.textContent = `${this.users.length} ユーザー`;
    }

    if (projectCountEl) {
      projectCountEl.textContent = `${this.projects.length} プロジェクト`;
    }

    if (categoryCountEl) {
      categoryCountEl.textContent = `${settings.categories?.length || 0} 分類`;
    }

    if (priorityCountEl) {
      priorityCountEl.textContent = `${settings.priorities?.length || 0} 優先度`;
    }

    if (statusCountEl) {
      statusCountEl.textContent = `${settings.statuses?.length || 0} ステータス`;
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
        this.updateStorageInfo();
        break;
      case 'categories':
        document.getElementById('categoriesSection').style.display = 'block';
        this.loadCategories();
        break;
      case 'priorities':
        document.getElementById('prioritiesSection').style.display = 'block';
        this.loadPriorities();
        break;
      case 'statuses':
        document.getElementById('statusesSection').style.display = 'block';
        this.loadStatuses();
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
        <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ja-JP') : '未ログイン'
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

  // メンバー管理
  // ========================================
  // 分類管理
  // ========================================

  loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;

    const settings = Utils.getFromStorage('appSettings') || { categories: [] };
    categoriesList.innerHTML = '';

    if (!settings.categories || settings.categories.length === 0) {
      categoriesList.innerHTML = '<div class="empty-message">分類がありません</div>';
      return;
    }

    settings.categories.forEach((category, index) => {
      const item = this.createListItem(category, () => this.removeCategory(index));
      categoriesList.appendChild(item);
    });
  }

  addCategory() {
    const categoryInput = document.getElementById('categoryInput');
    if (!categoryInput || !categoryInput.value.trim()) return;

    const categoryName = categoryInput.value.trim();
    const settings = Utils.getFromStorage('appSettings') || { users: [], categories: [] };

    if (!settings.categories) settings.categories = [];

    if (settings.categories.includes(categoryName)) {
      this.showError('この分類は既に存在します');
      return;
    }

    settings.categories.push(categoryName);
    Utils.saveToStorage('appSettings', settings);
    this.loadCategories();
    this.updateDashboardStats();
    categoryInput.value = '';
    this.showSuccess('分類が追加されました');
  }

  removeCategory(index) {
    if (!confirm('この分類を削除しますか？')) return;

    const settings = Utils.getFromStorage('appSettings') || { users: [], categories: [] };
    settings.categories.splice(index, 1);
    Utils.saveToStorage('appSettings', settings);
    this.loadCategories();
    this.updateDashboardStats();
    this.showSuccess('分類が削除されました');
  }

  // 優先度管理
  loadPriorities() {
    const prioritiesList = document.getElementById('prioritiesList');
    if (!prioritiesList) return;

    const settings = Utils.getFromStorage('appSettings') || { priorities: [] };
    if (!settings.priorities) settings.priorities = [];

    prioritiesList.innerHTML = '';

    if (settings.priorities.length === 0) {
      prioritiesList.innerHTML = '<div class="empty-message">優先度が登録されていません</div>';
      return;
    }

    settings.priorities.forEach((priority, index) => {
      const item = this.createPriorityListItem(priority, () => this.removePriority(index));
      prioritiesList.appendChild(item);
    });
  }

  addPriority() {
    const nameInput = document.getElementById('priorityNameInput');
    const valueInput = document.getElementById('priorityValueInput');
    const colorInput = document.getElementById('priorityColorInput');

    if (!nameInput || !valueInput || !colorInput) return;

    const name = nameInput.value.trim();
    const value = valueInput.value.trim();
    const color = colorInput.value;

    if (!name || !value) {
      this.showError('優先度名と値を入力してください');
      return;
    }

    const settings = Utils.getFromStorage('appSettings') || { priorities: [] };
    if (!settings.priorities) settings.priorities = [];

    // 値の重複チェック
    if (settings.priorities.some(p => p.value === value)) {
      this.showError('この値は既に使用されています');
      return;
    }

    settings.priorities.push({ name, value, color });
    Utils.saveToStorage('appSettings', settings);
    this.loadPriorities();
    this.updateDashboardStats();

    // 入力フィールドをクリア
    nameInput.value = '';
    valueInput.value = '';
    this.showSuccess('優先度が追加されました');
  }

  removePriority(index) {
    if (!confirm('この優先度を削除しますか？')) return;

    const settings = Utils.getFromStorage('appSettings') || { priorities: [] };
    settings.priorities.splice(index, 1);
    Utils.saveToStorage('appSettings', settings);
    this.loadPriorities();
    this.updateDashboardStats();
    this.showSuccess('優先度が削除されました');
  }

  createPriorityListItem(priority, removeCallback) {
    const item = document.createElement('div');
    item.className = 'list-item priority-item';
    item.innerHTML = `
      <div class="item-preview">
        <div class="item-color-box" style="background-color: ${priority.color}"></div>
        <div class="item-details">
          <div class="item-name">${priority.name}</div>
          <div class="item-value">${priority.value}</div>
        </div>
      </div>
      <button class="remove-btn">
        <i class="fas fa-times"></i> 削除
      </button>
    `;

    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', removeCallback);

    return item;
  }

  // ステータス管理
  loadStatuses() {
    const statusesList = document.getElementById('statusesList');
    if (!statusesList) return;

    const settings = Utils.getFromStorage('appSettings') || { statuses: [] };
    if (!settings.statuses) settings.statuses = [];

    statusesList.innerHTML = '';

    if (settings.statuses.length === 0) {
      statusesList.innerHTML = '<div class="empty-message">ステータスが登録されていません</div>';
      return;
    }

    settings.statuses.forEach((status, index) => {
      const item = this.createStatusListItem(status, () => this.removeStatus(index));
      statusesList.appendChild(item);
    });
  }

  addStatus() {
    const nameInput = document.getElementById('statusNameInput');
    const valueInput = document.getElementById('statusValueInput');
    const typeInput = document.getElementById('statusTypeInput');
    const colorInput = document.getElementById('statusColorInput');

    if (!nameInput || !valueInput || !typeInput || !colorInput) return;

    const name = nameInput.value.trim();
    const value = valueInput.value.trim();
    const type = typeInput.value;
    const color = colorInput.value;

    if (!name || !value) {
      this.showError('ステータス名と値を入力してください');
      return;
    }

    const settings = Utils.getFromStorage('appSettings') || { statuses: [] };
    if (!settings.statuses) settings.statuses = [];

    // 値の重複チェック
    if (settings.statuses.some(s => s.value === value)) {
      this.showError('この値は既に使用されています');
      return;
    }

    settings.statuses.push({ name, value, type, color });
    Utils.saveToStorage('appSettings', settings);
    this.loadStatuses();
    this.updateDashboardStats();

    // 入力フィールドをクリア
    nameInput.value = '';
    valueInput.value = '';
    typeInput.value = 'in_progress';
    this.showSuccess('ステータスが追加されました');
  }

  removeStatus(index) {
    if (!confirm('このステータスを削除しますか？')) return;

    const settings = Utils.getFromStorage('appSettings') || { statuses: [] };
    settings.statuses.splice(index, 1);
    Utils.saveToStorage('appSettings', settings);
    this.loadStatuses();
    this.updateDashboardStats();
    this.showSuccess('ステータスが削除されました');
  }

  createStatusListItem(status, removeCallback) {
    const typeLabels = {
      todo: '未着手',
      in_progress: '進行中',
      review: 'レビュー',
      done: '完了'
    };

    const item = document.createElement('div');
    item.className = 'list-item status-item';
    item.innerHTML = `
      <div class="item-preview">
        <div class="item-color-box" style="background-color: ${status.color}"></div>
        <div class="item-details">
          <div class="item-name">${status.name}</div>
          <div class="item-value">${status.value} (${typeLabels[status.type] || status.type || '未設定'})</div>
        </div>
      </div>
      <button class="remove-btn">
        <i class="fas fa-times"></i> 削除
      </button>
    `;

    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', removeCallback);

    return item;
  }

  createListItem(text, removeCallback) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span>${text}</span>
      <button class="remove-btn">
        <i class="fas fa-times"></i> 削除
      </button>
    `;

    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', removeCallback);

    return item;
  }

  // データ管理
  exportData() {
    const data = {
      settings: Utils.getFromStorage('appSettings'),
      tasks: Utils.getFromStorage('tasks', []),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nulltasker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showSuccess('データがエクスポートされました');
  }

  importData() {
    const fileInput = document.getElementById('importFileInput');
    if (fileInput) fileInput.click();
  }

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);

        if (confirm('現在のデータを上書きしますか？この操作は元に戻せません。')) {
          if (data.settings) {
            Utils.saveToStorage('appSettings', data.settings);
          }

          if (data.tasks) {
            Utils.saveToStorage('tasks', data.tasks);
          }

          this.showSuccess('データがインポートされました');
          setTimeout(() => location.reload(), 1500);
        }
      } catch (error) {
        this.showError('ファイルの読み込みに失敗しました');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  }

  clearAllData() {
    if (confirm('全てのデータを削除しますか？この操作は元に戻せません。')) {
      if (confirm('本当にすべてのデータを削除しますか？')) {
        localStorage.clear();
        this.showSuccess('全データが削除されました');
        setTimeout(() => location.reload(), 1500);
      }
    }
  }

  updateStorageInfo() {
    const storageUsed = document.querySelector('.storage-used');
    const storageText = document.querySelector('.storage-text');

    if (storageUsed && storageText) {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length;
        }
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      const percentage = Math.min((total / maxSize) * 100, 100);
      storageUsed.style.width = `${percentage}%`;
      storageText.textContent = `${percentage.toFixed(0)}% 使用中 (${Utils.formatBytes(
        total
      )} / 10MB)`;
    }
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
