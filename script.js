const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebarToggle');

// モバイル判定
const isMobile = () => window.innerWidth <= 768;

// サイドバーの初期状態を設定
function initializeSidebar() {
  if (isMobile()) {
    // モバイルではサイドバーを完全に非表示
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    if (toggleBtn) {
      toggleBtn.style.display = 'none';
    }
  } else {
    // デスクトップではサイドバーを表示
    if (sidebar) {
      sidebar.style.display = 'flex';
      sidebar.classList.remove('hidden');
      sidebar.classList.remove('show');
    }
    if (toggleBtn) {
      toggleBtn.style.display = 'flex';
    }
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', initializeSidebar);
window.addEventListener('load', initializeSidebar);

// サイドバートグル（デスクトップのみ）
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    if (!isMobile()) {
      // デスクトップでのみサイドバーを切り替え
      sidebar.classList.toggle('hidden');
      
      // アイコンを状態に応じて変更
      const icon = toggleBtn.querySelector('i');
      if (sidebar.classList.contains('hidden')) {
        icon.className = 'fas fa-bars';
      } else {
        icon.className = 'fas fa-times';
      }
    }
  });
}

// 画面サイズ変更時の処理
window.addEventListener('resize', () => {
  if (isMobile()) {
    // モバイルになった時はサイドバーを非表示
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    if (toggleBtn) {
      toggleBtn.style.display = 'none';
    }
  } else {
    // デスクトップに戻った時はサイドバーを表示
    if (sidebar) {
      sidebar.style.display = 'flex';
      sidebar.classList.remove('show');
      if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
      }
    }
    if (toggleBtn) {
      toggleBtn.style.display = 'flex';
      const icon = toggleBtn.querySelector('i');
      icon.className = 'fas fa-bars';
    }
  }
});

// プロジェクト選択時のイベント
const projectSelect = document.getElementById('projectSelect');
if (projectSelect) {
  projectSelect.addEventListener('change', function () {
    alert('選択されたプロジェクト: ' + this.value);
  });
}

// タスク管理機能
class TaskManager {
  constructor() {
    this.tasks = [];
    this.settings = {};
    this.editingTaskId = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadTasks();
    this.setupEventListeners();
    this.populateFormOptions();
    this.renderTasks();
  }

  async loadSettings() {
    try {
      const response = await fetch('settings.json');
      this.settings = await response.json();
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      // デフォルト設定
      this.settings = {
        categories: ['企画', '開発', 'デザイン', 'テスト', 'ドキュメント', '会議', 'その他'],
        users: ['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲', '高橋健一'],
        priorities: [
          { value: 'high', label: '高優先度', color: '#c62828' },
          { value: 'medium', label: '中優先度', color: '#ef6c00' },
          { value: 'low', label: '低優先度', color: '#2e7d32' }
        ],
        statuses: [
          { value: 'todo', label: '未着手', color: '#666' },
          { value: 'in_progress', label: '進行中', color: '#1976d2' },
          { value: 'review', label: 'レビュー中', color: '#f57c00' },
          { value: 'done', label: '完了', color: '#388e3c' }
        ]
      };
    }
  }

  async loadTasks() {
    // まずローカルストレージから読み込む
    const stored = localStorage.getItem('tasks');
    if (stored) {
      try {
        this.tasks = JSON.parse(stored) || [];
        return;
      } catch (e) {
        console.warn('ローカルストレージのタスク読み込みに失敗しました。tickets.jsonから読み込みます。');
      }
    }

    // ローカルストレージに無い場合はtickets.jsonから初期データを読み込む
    try {
      const response = await fetch('tickets.json');
      if (!response.ok) throw new Error('Failed to fetch tickets.json');
      const data = await response.json();
      this.tasks = data.tasks || [];
      // 初回読み込み時にローカルストレージへ保存
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      this.tasks = [];
    }
  }

  async saveTasks() {
    // 常にローカルストレージへ保存（静的環境での永続化）
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  setupEventListeners() {
    // モーダル関連
    const addTaskBtn = document.querySelector('.add-task-btn');
    const modal = document.getElementById('taskModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelTask');
    const taskForm = document.getElementById('taskForm');

    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => {
        this.resetEditState();
        const form = document.getElementById('taskForm');
        if (form) form.reset();
        this.openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal();
        this.resetEditState();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
        this.resetEditState();
      });
    }

    // モーダル外クリックで閉じる
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
          this.resetEditState();
        }
      });
    }

    // フォーム送信
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // タスクの編集/削除（イベントデリゲーション）
    const taskList = document.querySelector('.task-list');
    if (taskList) {
      taskList.addEventListener('click', (e) => {
        const button = e.target.closest('button.task-btn');
        if (!button) return;
        const container = button.closest('.task-item');
        const taskId = button.dataset.id || container?.dataset.id || container?.querySelector('input[type="checkbox"]')?.id;
        if (!taskId) return;

        if (button.classList.contains('delete-task-btn')) {
          this.deleteTask(taskId);
        } else if (button.classList.contains('edit-task-btn')) {
          this.editTask(taskId);
        }
      });
    }
  }

  populateFormOptions() {
    // 担当者オプション
    const assigneeSelect = document.getElementById('taskAssignee');
    if (assigneeSelect && this.settings.users) {
      this.settings.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        assigneeSelect.appendChild(option);
      });
    }

    // 分類オプション
    const categorySelect = document.getElementById('taskCategory');
    if (categorySelect && this.settings.categories) {
      this.settings.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    }

    // 優先度オプション
    const prioritySelect = document.getElementById('taskPriority');
    if (prioritySelect && this.settings.priorities) {
      this.settings.priorities.forEach(priority => {
        const option = document.createElement('option');
        option.value = priority.value;
        option.textContent = priority.label;
        prioritySelect.appendChild(option);
      });
    }

    // ステータスオプション
    const statusSelect = document.getElementById('taskStatus');
    if (statusSelect && this.settings.statuses) {
      this.settings.statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.value;
        option.textContent = status.label;
        statusSelect.appendChild(option);
      });
    }
  }

  openModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      // フォームをリセット
      const form = document.getElementById('taskForm');
      if (form) {
        form.reset();
      }
    }
  }

  addTask() {
    const form = document.getElementById('taskForm');
    if (!form) return;

    const formData = new FormData(form);
    const taskData = {
      id: this.generateTaskId(),
      title: formData.get('title'),
      description: formData.get('description') || '',
      assignee: formData.get('assignee'),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
      category: formData.get('category'),
      status: formData.get('status'),
      progress: parseInt(formData.get('progress')) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // バリデーション
    if (!taskData.title || !taskData.assignee || !taskData.dueDate || !taskData.priority || !taskData.category || !taskData.status) {
      alert('必須項目を入力してください。');
      return;
    }

    this.tasks.push(taskData);
    this.saveTasks();
    this.renderTasks();
    this.closeModal();
    alert('タスクが正常に追加されました。');
  }

  generateTaskId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `task_${timestamp}_${random}`;
  }

  renderTasks() {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    this.tasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      taskList.appendChild(taskElement);
    });
  }

  createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.dataset.id = task.id;
    
    const progressText = this.getProgressText(task.progress);
    const priorityText = this.getPriorityText(task.priority);
    const statusText = this.getStatusText(task.status);
    
    taskDiv.innerHTML = `
      <div class="task-checkbox">
        <input type="checkbox" id="${task.id}" ${task.status === 'done' ? 'checked' : ''}>
        <label for="${task.id}"></label>
      </div>
      <div class="task-content">
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <div class="task-meta">
          <span class="task-priority ${task.priority}">${priorityText}</span>
          <span class="task-status ${task.status}">${statusText}</span>
          <span class="task-due">期限: ${this.formatDate(task.dueDate)}</span>
          <span class="task-assignee">担当: ${task.assignee}</span>
          <span class="task-category">分類: ${task.category}</span>
          <span class="task-progress">進捗: ${progressText}</span>
        </div>
      </div>
      <div class="task-actions">
        <button type="button" class="task-btn edit-task-btn" data-id="${task.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="task-btn delete-task-btn" data-id="${task.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // チェックボックスのイベント
    const checkbox = taskDiv.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      this.toggleTaskStatus(task.id, e.target.checked);
    });

    return taskDiv;
  }

  getProgressText(progress) {
    const progressMap = {
      0: '0%',
      25: '25%',
      50: '50%',
      75: '75%',
      100: '100%'
    };
    return progressMap[progress] || '0%';
  }

  getPriorityText(priority) {
    const priorityObj = this.settings.priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.label : '中優先度';
  }

  getStatusText(statusValue) {
    const status = this.settings.statuses.find(s => s.value === statusValue);
    return status ? status.label : '不明';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  }

  toggleTaskStatus(taskId, isDone) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = isDone ? 'done' : 'todo';
      task.progress = isDone ? 100 : 0;
      this.saveTasks();
      this.renderTasks();
    }
  }

  editTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;

    // フォームへ値を反映
    const form = document.getElementById('taskForm');
    if (form) {
      const titleInput = document.getElementById('taskTitle');
      const descInput = document.getElementById('taskDescription');
      const assigneeSelect = document.getElementById('taskAssignee');
      const dueDateInput = document.getElementById('taskDueDate');
      const prioritySelect = document.getElementById('taskPriority');
      const categorySelect = document.getElementById('taskCategory');
      const statusSelect = document.getElementById('taskStatus');
      const progressSelect = document.getElementById('taskProgress');

      if (titleInput) titleInput.value = task.title || '';
      if (descInput) descInput.value = task.description || '';
      if (assigneeSelect) assigneeSelect.value = task.assignee || '';
      if (dueDateInput) dueDateInput.value = task.dueDate || '';
      if (prioritySelect) prioritySelect.value = task.priority || '';
      if (categorySelect) categorySelect.value = task.category || '';
      if (statusSelect) statusSelect.value = task.status || '';
      if (progressSelect) progressSelect.value = String(task.progress || 0);

      // ラベルとボタンの文言を編集用に変更
      const modalTitle = form.closest('.modal-content')?.querySelector('.modal-header h2');
      if (modalTitle) modalTitle.textContent = 'タスクを編集';
      const submitBtn = form.querySelector('.btn-primary');
      if (submitBtn) submitBtn.textContent = '保存';
    }

    this.openModal();
  }

  handleFormSubmit() {
    const form = document.getElementById('taskForm');
    if (!form) return;

    const formData = new FormData(form);
    const payload = {
      title: formData.get('title'),
      description: formData.get('description') || '',
      assignee: formData.get('assignee'),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
      category: formData.get('category'),
      status: formData.get('status'),
      progress: parseInt(formData.get('progress')) || 0
    };

    // バリデーション
    if (!payload.title || !payload.assignee || !payload.dueDate || !payload.priority || !payload.category || !payload.status) {
      alert('必須項目を入力してください。');
      return;
    }

    if (this.editingTaskId) {
      // 更新
      const idx = this.tasks.findIndex(t => t.id === this.editingTaskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...payload };
      }
      this.saveTasks();
      this.renderTasks();
      this.closeModal();
      this.resetEditState();
      alert('タスクを更新しました。');
    } else {
      // 追加
      this.addTask();
    }
  }

  resetEditState() {
    this.editingTaskId = null;
    const form = document.getElementById('taskForm');
    if (form) {
      const modalTitle = form.closest('.modal-content')?.querySelector('.modal-header h2');
      if (modalTitle) modalTitle.textContent = '新しいタスクを追加';
      const submitBtn = form.querySelector('.btn-primary');
      if (submitBtn) submitBtn.textContent = 'タスクを追加';
    }
  }

  deleteTask(taskId) {
    if (confirm('このタスクを削除しますか？')) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.saveTasks();
      this.renderTasks();
      alert('タスクが削除されました。');
    }
  }
}

// タスクマネージャーの初期化
let taskManager;
if (document.querySelector('.task-container')) {
  taskManager = new TaskManager();
}

// 設定管理機能
class SettingsManager {
  constructor() {
    this.settings = {
      users: ['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲', '高橋健一'],
      categories: ['企画', '開発', 'デザイン', 'テスト', 'ドキュメント', '会議', 'その他'],
      projectName: 'NullTasker Project',
      projectDescription: 'チームでのタスク管理を効率化するプロジェクトです。',
      notifications: {
        email: true,
        desktop: false,
        taskReminder: true
      },
      display: {
        theme: 'light',
        language: 'ja',
        tasksPerPage: 20
      }
    };
    this.init();
  }

  init() {
    // ローカルストレージから設定を読み込み
    this.loadSettings();
    
    // 設定ページの場合のみ初期化
    if (document.querySelector('.settings-container')) {
      this.renderSettings();
      this.setupSettingsEventListeners();
    }
  }

  loadSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved);
        this.settings = { ...this.settings, ...savedSettings };
      } catch (e) {
        console.warn('設定の読み込みに失敗しました:', e);
      }
    }
  }

  saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
    this.updateGlobalSettings();
  }

  updateGlobalSettings() {
    // グローバルのsettings.jsonの内容も更新
    const globalSettings = {
      categories: this.settings.categories,
      users: this.settings.users,
      priorities: [
        { value: 'high', label: '高優先度', color: '#c62828' },
        { value: 'medium', label: '中優先度', color: '#ef6c00' },
        { value: 'low', label: '低優先度', color: '#2e7d32' }
      ],
      statuses: [
        { value: 'todo', label: '未着手', color: '#666' },
        { value: 'in_progress', label: '進行中', color: '#1976d2' },
        { value: 'review', label: 'レビュー中', color: '#f57c00' },
        { value: 'done', label: '完了', color: '#388e3c' }
      ]
    };
    
    // TaskManagerが存在する場合は設定を更新
    if (window.taskManager) {
      window.taskManager.settings = globalSettings;
    }
  }

  renderSettings() {
    this.renderProjectSettings();
    this.renderUsers();
    this.renderCategories();
    this.renderNotificationSettings();
    this.renderDisplaySettings();
    this.updateStorageInfo();
  }

  renderProjectSettings() {
    const projectName = document.getElementById('projectName');
    const projectDescription = document.getElementById('projectDescription');
    
    if (projectName) projectName.value = this.settings.projectName;
    if (projectDescription) projectDescription.value = this.settings.projectDescription;
  }

  renderUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    usersList.innerHTML = '';
    this.settings.users.forEach((user, index) => {
      const userItem = document.createElement('div');
      userItem.className = 'list-item';
      userItem.innerHTML = `
        <span>${user}</span>
        <button class="remove-btn" onclick="settingsManager.removeUser(${index})">
          <i class="fas fa-times"></i> 削除
        </button>
      `;
      usersList.appendChild(userItem);
    });
  }

  renderCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;

    categoriesList.innerHTML = '';
    this.settings.categories.forEach((category, index) => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'list-item';
      categoryItem.innerHTML = `
        <span>${category}</span>
        <button class="remove-btn" onclick="settingsManager.removeCategory(${index})">
          <i class="fas fa-times"></i> 削除
        </button>
      `;
      categoriesList.appendChild(categoryItem);
    });
  }

  renderNotificationSettings() {
    const emailNotification = document.getElementById('emailNotification');
    const desktopNotification = document.getElementById('desktopNotification');
    const taskReminder = document.getElementById('taskReminder');

    if (emailNotification) emailNotification.checked = this.settings.notifications.email;
    if (desktopNotification) desktopNotification.checked = this.settings.notifications.desktop;
    if (taskReminder) taskReminder.checked = this.settings.notifications.taskReminder;
  }

  renderDisplaySettings() {
    const theme = document.getElementById('theme');
    const language = document.getElementById('language');
    const tasksPerPage = document.getElementById('tasksPerPage');

    if (theme) theme.value = this.settings.display.theme;
    if (language) language.value = this.settings.display.language;
    if (tasksPerPage) tasksPerPage.value = this.settings.display.tasksPerPage;
  }

  updateStorageInfo() {
    const storageUsed = this.calculateStorageUsage();
    const storageBar = document.querySelector('.storage-used');
    const storageText = document.querySelector('.storage-info p');
    
    if (storageBar && storageText) {
      const percentage = Math.min((storageUsed / (10 * 1024 * 1024)) * 100, 100);
      storageBar.style.width = `${percentage}%`;
      storageText.textContent = `使用量: ${this.formatBytes(storageUsed)} / 10MB`;
    }
  }

  calculateStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    return total;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  setupSettingsEventListeners() {
    // プロジェクト設定の変更を監視
    const projectName = document.getElementById('projectName');
    const projectDescription = document.getElementById('projectDescription');
    
    if (projectName) {
      projectName.addEventListener('change', (e) => {
        this.settings.projectName = e.target.value;
      });
    }
    
    if (projectDescription) {
      projectDescription.addEventListener('change', (e) => {
        this.settings.projectDescription = e.target.value;
      });
    }

    // 通知設定の変更を監視
    const notifications = ['emailNotification', 'desktopNotification', 'taskReminder'];
    notifications.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => {
          const settingKey = id.replace('Notification', '').replace('taskReminder', 'taskReminder');
          this.settings.notifications[settingKey] = e.target.checked;
        });
      }
    });

    // 表示設定の変更を監視
    const displaySettings = ['theme', 'language', 'tasksPerPage'];
    displaySettings.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => {
          this.settings.display[id] = e.target.value;
        });
      }
    });
  }

  addUser() {
    const newUserInput = document.getElementById('newUser');
    if (!newUserInput) return;

    const userName = newUserInput.value.trim();
    if (userName && !this.settings.users.includes(userName)) {
      this.settings.users.push(userName);
      this.renderUsers();
      newUserInput.value = '';
      this.showNotification('ユーザーが追加されました', 'success');
    } else if (this.settings.users.includes(userName)) {
      this.showNotification('このユーザーは既に存在します', 'warning');
    }
  }

  removeUser(index) {
    if (confirm('このユーザーを削除しますか？')) {
      this.settings.users.splice(index, 1);
      this.renderUsers();
      this.showNotification('ユーザーが削除されました', 'success');
    }
  }

  addCategory() {
    const newCategoryInput = document.getElementById('newCategory');
    if (!newCategoryInput) return;

    const categoryName = newCategoryInput.value.trim();
    if (categoryName && !this.settings.categories.includes(categoryName)) {
      this.settings.categories.push(categoryName);
      this.renderCategories();
      newCategoryInput.value = '';
      this.showNotification('カテゴリが追加されました', 'success');
    } else if (this.settings.categories.includes(categoryName)) {
      this.showNotification('このカテゴリは既に存在します', 'warning');
    }
  }

  removeCategory(index) {
    if (confirm('このカテゴリを削除しますか？')) {
      this.settings.categories.splice(index, 1);
      this.renderCategories();
      this.showNotification('カテゴリが削除されました', 'success');
    }
  }

  exportData() {
    const data = {
      settings: this.settings,
      tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
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

    this.showNotification('データがエクスポートされました', 'success');
  }

  importData() {
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
      fileInput.click();
    }
  }

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (confirm('現在のデータを上書きしますか？この操作は元に戻せません。')) {
          if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
            this.renderSettings();
          }
          
          if (data.tasks) {
            localStorage.setItem('tasks', JSON.stringify(data.tasks));
          }
          
          this.saveSettings();
          this.showNotification('データがインポートされました', 'success');
          
          // ページをリロードして変更を反映
          setTimeout(() => {
            location.reload();
          }, 1500);
        }
      } catch (error) {
        this.showNotification('ファイルの読み込みに失敗しました', 'error');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  }

  clearAllData() {
    if (confirm('全てのデータを削除しますか？この操作は元に戻せません。')) {
      if (confirm('本当にすべてのデータを削除しますか？')) {
        localStorage.clear();
        this.showNotification('全データが削除されました', 'success');
        
        // デフォルト設定に戻す
        setTimeout(() => {
          location.reload();
        }, 1500);
      }
    }
  }

  saveAllSettings() {
    this.saveSettings();
    this.showNotification('設定が保存されました', 'success');
  }

  resetSettings() {
    if (confirm('設定をリセットしますか？')) {
      localStorage.removeItem('appSettings');
      this.settings = {
        users: ['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲', '高橋健一'],
        categories: ['企画', '開発', 'デザイン', 'テスト', 'ドキュメント', '会議', 'その他'],
        projectName: 'NullTasker Project',
        projectDescription: 'チームでのタスク管理を効率化するプロジェクトです。',
        notifications: {
          email: true,
          desktop: false,
          taskReminder: true
        },
        display: {
          theme: 'light',
          language: 'ja',
          tasksPerPage: 20
        }
      };
      this.renderSettings();
      this.showNotification('設定がリセットされました', 'success');
    }
  }

  showNotification(message, type = 'info') {
    // 通知要素を作成
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // スタイルを設定
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#007bff'};
      color: ${type === 'warning' ? '#212529' : 'white'};
      padding: 15px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 3秒後に自動削除
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// 設定管理の初期化
let settingsManager;
if (document.querySelector('.settings-container')) {
  settingsManager = new SettingsManager();
}

// グローバル関数として設定関数を公開
function addUser() {
  if (settingsManager) settingsManager.addUser();
}

function addCategory() {
  if (settingsManager) settingsManager.addCategory();
}

function exportData() {
  if (settingsManager) settingsManager.exportData();
}

function importData() {
  if (settingsManager) settingsManager.importData();
}

function handleFileImport(event) {
  if (settingsManager) settingsManager.handleFileImport(event);
}

function clearAllData() {
  if (settingsManager) settingsManager.clearAllData();
}

function saveSettings() {
  if (settingsManager) settingsManager.saveAllSettings();
}

function resetSettings() {
  if (settingsManager) settingsManager.resetSettings();
}

// 通知アニメーションのCSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(300px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(300px);
    }
  }
`;
document.head.appendChild(notificationStyles);
