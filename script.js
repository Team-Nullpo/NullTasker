// サイドバーとトグルボタンの要素を取得（DOMContentLoaded後に実行）
let sidebar, toggleBtn, hideBtn;

// モバイル判定
const isMobile = () => window.innerWidth <= 768;

// サイドバーの表示状態を管理
let sidebarVisible = true;

// 要素の初期化
function initializeElements() {
  sidebar = document.getElementById('sidebar');
  toggleBtn = document.getElementById('sidebarToggle');
  hideBtn = document.getElementById('sidebarHideBtn');
}

// サイドバーの初期状態を設定
function initializeSidebar() {
  initializeElements(); // 要素を初期化
  
  if (!sidebar || !toggleBtn) {
    console.warn('サイドバーまたはトグルボタンが見つかりません');
    return;
  }

  if (isMobile()) {
    // モバイルではサイドバーを完全に非表示
    sidebar.style.display = 'none';
    toggleBtn.style.display = 'none';
  } else {
    // デスクトップではサイドバーを表示
    sidebar.style.display = 'flex';
    
    // 前回の表示状態を復元
    const savedState = localStorage.getItem('sidebarVisible');
    if (savedState !== null) {
      sidebarVisible = savedState === 'true';
    }
    
    applySidebarState();
  }
}

// サイドバーの表示状態を適用
function applySidebarState() {
  if (!sidebar || !toggleBtn) {
    console.warn('サイドバーまたはトグルボタンが見つかりません');
    return;
  }

  if (sidebarVisible) {
    sidebar.style.transform = 'translateX(0)';
    sidebar.style.visibility = 'visible';
    toggleBtn.style.display = 'none'; // 表示時は表示ボタンを隠す
    updateMainContentMargin(true);
  } else {
    sidebar.style.transform = 'translateX(-100%)';
    sidebar.style.visibility = 'hidden';
    toggleBtn.style.display = 'flex'; // 非表示時は表示ボタンを見せる
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.top = '15px';
    toggleBtn.style.left = '15px';
    toggleBtn.style.zIndex = '1001';
    updateMainContentMargin(false);
  }

  updateToggleIcon();
  
  // 状態を保存
  localStorage.setItem('sidebarVisible', sidebarVisible.toString());
}

// トグルアイコンを更新
function updateToggleIcon() {
  if (!toggleBtn) return;
  
  const icon = toggleBtn.querySelector('i');
  if (!icon) return;

  // 表示ボタンは常に右向き矢印
  icon.className = 'fas fa-chevron-right';
  toggleBtn.title = 'サイドバーを表示';
  toggleBtn.style.backgroundColor = '#2196f3';
  toggleBtn.style.color = 'white';
  toggleBtn.style.border = '1px solid #0d7377';
}

// メインコンテンツのマージンを更新
function updateMainContentMargin(visible) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  if (visible) {
    // サイドバー表示時：通常のマージンを設定
    mainContent.style.marginLeft = '380px';
    mainContent.classList.remove('expanded');
  } else {
    // サイドバー非表示時：マージンを0にしてexpandedクラスを追加
    mainContent.style.marginLeft = '0';
    mainContent.classList.add('expanded');
  }
  
  mainContent.style.transition = 'margin-left 0.3s ease';
}

// サイドバーの表示/非表示を切り替え
function toggleSidebar() {
  if (isMobile()) return; // モバイルでは何もしない

  sidebarVisible = !sidebarVisible;
  applySidebarState();
}

// 緊急リセット機能 - サイドバーを強制表示
function forceShowSidebar() {
  if (isMobile()) return;
  
  sidebarVisible = true;
  applySidebarState();
  console.log('サイドバー強制表示実行');
  
  // 視覚的なフィードバック
  if (toggleBtn) {
    toggleBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
      toggleBtn.style.transform = 'scale(1)';
    }, 200);
  }
}

// キーボードショートカット（Ctrl+Bのみ）
function handleKeyboardShortcut(event) {
  // Ctrl+B でサイドバー切り替え
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault();
    toggleSidebar();
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM読み込み完了 - サイドバー初期化開始');
  initializeSidebar();
  setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners() {
  initializeElements(); // 要素を再確認
  
  // サイドバートグル（デスクトップのみ）
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
    
    // 緊急時のリセット機能：ダブルクリックで強制表示
    toggleBtn.addEventListener('dblclick', (e) => {
      e.preventDefault();
      forceShowSidebar();
    });
    
    // 右クリックで強制表示（予備機能）
    toggleBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      forceShowSidebar();
    });
    
    console.log('トグルボタンのイベントリスナー設定完了');
  } else {
    console.warn('トグルボタンが見つかりません');
  }

  // サイドバー内の非表示ボタン
  if (hideBtn) {
    hideBtn.addEventListener('click', () => {
      console.log('非表示ボタンがクリックされました');
      if (!isMobile()) {
        sidebarVisible = false;
        applySidebarState();
      }
    });
    console.log('非表示ボタンのイベントリスナー設定完了');
  } else {
    console.warn('非表示ボタンが見つかりません');
  }

  // キーボードショートカットの設定
  document.addEventListener('keydown', handleKeyboardShortcut);

  // 画面サイズ変更時の処理
  window.addEventListener('resize', handleResize);
}

// リサイズ処理を関数として分離
function handleResize() {
  if (isMobile()) {
    // モバイルになった時はサイドバーを非表示
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    if (toggleBtn) {
      toggleBtn.style.display = 'none';
    }
  } else {
    // デスクトップに戻った時はサイドバーを表示し、状態を復元
    if (sidebar) {
      sidebar.style.display = 'flex';
      applySidebarState();
    }
  }
}

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

    // タスク詳細モーダル関連
    const taskDetailModal = document.getElementById('taskDetailModal');
    const closeTaskDetailBtn = document.getElementById('closeTaskDetail');

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

    // タスク詳細モーダルのクローズイベント
    if (closeTaskDetailBtn) {
      closeTaskDetailBtn.addEventListener('click', () => {
        if (taskDetailModal) {
          taskDetailModal.style.display = 'none';
        }
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

    // タスク詳細モーダル外クリックで閉じる
    if (taskDetailModal) {
      taskDetailModal.addEventListener('click', (e) => {
        if (e.target === taskDetailModal) {
          taskDetailModal.style.display = 'none';
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
      startDate: formData.get('startDate'),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
      category: formData.get('category'),
      status: formData.get('status'),
      progress: parseInt(formData.get('progress')) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // バリデーション
    if (!taskData.title || !taskData.assignee || !taskData.startDate || !taskData.dueDate || !taskData.priority || !taskData.category || !taskData.status) {
      alert('必須項目を入力してください。');
      return;
    }

    // 開始日が期日より後でないかチェック
    if (new Date(taskData.startDate) > new Date(taskData.dueDate)) {
      alert('開始日は期日より前に設定してください。');
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
      const startDateInput = document.getElementById('taskStartDate');
      const dueDateInput = document.getElementById('taskDueDate');
      const prioritySelect = document.getElementById('taskPriority');
      const categorySelect = document.getElementById('taskCategory');
      const statusSelect = document.getElementById('taskStatus');
      const progressSelect = document.getElementById('taskProgress');

      if (titleInput) titleInput.value = task.title || '';
      if (descInput) descInput.value = task.description || '';
      if (assigneeSelect) assigneeSelect.value = task.assignee || '';
      if (startDateInput) startDateInput.value = task.startDate || '';
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
      startDate: formData.get('startDate'),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
      category: formData.get('category'),
      status: formData.get('status'),
      progress: parseInt(formData.get('progress')) || 0
    };

    // バリデーション
    if (!payload.title || !payload.assignee || !payload.startDate || !payload.dueDate || !payload.priority || !payload.category || !payload.status) {
      alert('必須項目を入力してください。');
      return;
    }

    // 開始日が期日より後でないかチェック
    if (new Date(payload.startDate) > new Date(payload.dueDate)) {
      alert('開始日は期日より前に設定してください。');
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

// ガントチャート管理機能
class GanttManager {
  constructor() {
    this.tasks = [];
    this.currentDate = new Date();
    this.timeScale = 'week';
    this.isExpanded = false;
    this.init();
  }

  init() {
    if (document.querySelector('.gantt-container')) {
      this.loadTasks();
      this.setupEventListeners();
      this.renderGantt();
    }
  }

  loadTasks() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
      try {
        this.tasks = JSON.parse(stored) || [];
      } catch (e) {
        this.tasks = [];
      }
    }
  }

  setupEventListeners() {
    const timeScaleSelect = document.getElementById('timeScale');
    const prevBtn = document.getElementById('prevPeriod');
    const nextBtn = document.getElementById('nextPeriod');

    // タスク詳細モーダル関連
    const taskDetailModal = document.getElementById('taskDetailModal');
    const closeTaskDetailBtn = document.getElementById('closeTaskDetail');

    if (timeScaleSelect) {
      timeScaleSelect.addEventListener('change', (e) => {
        this.timeScale = e.target.value;
        this.renderGantt();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigatePeriod(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigatePeriod(1);
      });
    }

    // タスク詳細モーダルのクローズイベント
    if (closeTaskDetailBtn) {
      closeTaskDetailBtn.addEventListener('click', () => {
        if (taskDetailModal) {
          taskDetailModal.style.display = 'none';
        }
      });
    }

    // タスク詳細モーダル外クリックで閉じる
    if (taskDetailModal) {
      taskDetailModal.addEventListener('click', (e) => {
        if (e.target === taskDetailModal) {
          taskDetailModal.style.display = 'none';
        }
      });
    }
  }

  navigatePeriod(direction) {
    const period = this.timeScale === 'month' ? 'Month' : this.timeScale === 'week' ? 'Date' : 'Date';
    const amount = this.timeScale === 'month' ? 1 : this.timeScale === 'week' ? 7 : 1;

    if (direction > 0) {
      this.currentDate[`set${period}`](this.currentDate[`get${period}`]() + amount);
    } else {
      this.currentDate[`set${period}`](this.currentDate[`get${period}`]() - amount);
    }

    this.renderGantt();
  }

  renderGantt() {
    this.updatePeriodDisplay();
    this.renderTimeline();
    this.renderTaskList();
    this.renderGanttBars();
  }

  updatePeriodDisplay() {
    const periodElement = document.getElementById('currentPeriod');
    if (!periodElement) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;

    if (this.timeScale === 'month') {
      periodElement.textContent = `${year}年${month}月`;
    } else if (this.timeScale === 'week') {
      const weekStart = new Date(this.currentDate);
      weekStart.setDate(this.currentDate.getDate() - this.currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      periodElement.textContent = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
    } else {
      periodElement.textContent = `${year}年${month}月${this.currentDate.getDate()}日`;
    }
  }

  renderTimeline() {
    const header = document.getElementById('ganttTimelineHeader');
    if (!header) return;

    header.innerHTML = '';
    const dates = this.getTimelineDates();

    dates.forEach(date => {
      const cell = document.createElement('div');
      cell.className = 'gantt-date-cell';
      cell.textContent = this.formatTimelineDate(date);
      header.appendChild(cell);
    });
  }

  getTimelineDates() {
    const dates = [];
    const startDate = new Date(this.currentDate);
    
    if (this.timeScale === 'month') {
      startDate.setDate(1);
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(startDate);
        date.setDate(i + 1);
        dates.push(date);
      }
    } else if (this.timeScale === 'week') {
      startDate.setDate(this.currentDate.getDate() - this.currentDate.getDay());
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
      }
    } else {
      for (let i = -3; i <= 3; i++) {
        const date = new Date(this.currentDate);
        date.setDate(this.currentDate.getDate() + i);
        dates.push(date);
      }
    }
    
    return dates;
  }

  formatTimelineDate(date) {
    if (this.timeScale === 'month') {
      return date.getDate();
    } else if (this.timeScale === 'week') {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      return `${date.getDate()} (${days[date.getDay()]})`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  renderTaskList() {
    const taskRows = document.getElementById('ganttTaskRows');
    if (!taskRows) return;

    taskRows.innerHTML = '';

    this.tasks.forEach(task => {
      const row = document.createElement('div');
      row.className = 'gantt-task-row';
      row.dataset.taskId = task.id;
      
      const taskName = document.createElement('div');
      taskName.className = 'task-name-column';
      taskName.textContent = task.title;
      taskName.title = task.title;
      
      const taskAssignee = document.createElement('div');
      taskAssignee.className = 'task-assignee-column';
      taskAssignee.textContent = task.assignee;
      
      const taskDuration = document.createElement('div');
      taskDuration.className = 'task-duration-column';
      taskDuration.textContent = this.calculateDuration(task);
      
      row.appendChild(taskName);
      row.appendChild(taskAssignee);
      row.appendChild(taskDuration);
      
      row.addEventListener('click', () => {
        this.showTaskDetail(task);
      });
      
      taskRows.appendChild(row);
    });
  }

  renderGanttBars() {
    const timelineBody = document.getElementById('ganttTimelineBody');
    if (!timelineBody) return;

    timelineBody.innerHTML = '';
    const dates = this.getTimelineDates();
    const cellWidth = 60; // ピクセル

    this.tasks.forEach(task => {
      const row = document.createElement('div');
      row.className = 'gantt-bar-row';
      
      // 開始日と終了日のインデックスを取得
      const startDate = new Date(task.startDate || task.createdAt);
      const endDate = new Date(task.dueDate);
      const startIndex = this.findDateIndex(dates, startDate);
      const endIndex = this.findDateIndex(dates, endDate);
      
      if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
        // タスクバーのコンテナ
        const barContainer = document.createElement('div');
        barContainer.className = 'gantt-bar-container';
        barContainer.style.position = 'absolute';
        barContainer.style.left = `${startIndex * cellWidth}px`;
        barContainer.style.width = `${(endIndex - startIndex + 1) * cellWidth - 4}px`;
        barContainer.style.height = '20px';
        barContainer.style.top = '10px';
        
        // ベースとなるタスクバー
        const bar = document.createElement('div');
        bar.className = `gantt-bar ${task.priority}`;
        if (task.status === 'done') {
          bar.classList.add('completed');
        }
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.position = 'relative';
        bar.style.borderRadius = '10px';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.padding = '0 8px';
        bar.style.boxSizing = 'border-box';
        
        // 進捗バー
        if (task.progress > 0) {
          const progressBar = document.createElement('div');
          progressBar.className = 'gantt-progress-bar';
          progressBar.style.position = 'absolute';
          progressBar.style.left = '0';
          progressBar.style.top = '0';
          progressBar.style.height = '100%';
          progressBar.style.width = `${task.progress}%`;
          progressBar.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          progressBar.style.borderRadius = '10px';
          progressBar.style.transition = 'width 0.3s ease';
          bar.appendChild(progressBar);
        }
        
        // タスクタイトル
        const titleSpan = document.createElement('span');
        titleSpan.textContent = task.title;
        titleSpan.style.position = 'relative';
        titleSpan.style.zIndex = '2';
        titleSpan.style.fontSize = '11px';
        titleSpan.style.whiteSpace = 'nowrap';
        titleSpan.style.overflow = 'hidden';
        titleSpan.style.textOverflow = 'ellipsis';
        titleSpan.style.color = task.priority === 'medium' ? '#212529' : 'white';
        bar.appendChild(titleSpan);
        
        // 進捗率表示
        if (task.progress > 0) {
          const progressText = document.createElement('div');
          progressText.textContent = `${task.progress}%`;
          progressText.style.position = 'absolute';
          progressText.style.right = '8px';
          progressText.style.top = '50%';
          progressText.style.transform = 'translateY(-50%)';
          progressText.style.fontSize = '10px';
          progressText.style.fontWeight = 'bold';
          progressText.style.color = task.priority === 'medium' ? '#212529' : 'white';
          progressText.style.zIndex = '3';
          bar.appendChild(progressText);
        }
        
        barContainer.appendChild(bar);
        
        // ホバーエフェクト
        barContainer.title = `${task.title} - ${task.assignee}\n開始日: ${this.formatDate(startDate)}\n期日: ${this.formatDate(endDate)}\n進捗: ${task.progress}%`;
        
        barContainer.addEventListener('click', () => {
          this.showTaskDetail(task);
        });
        
        barContainer.addEventListener('mouseenter', () => {
          barContainer.style.transform = 'translateY(-2px)';
          barContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          barContainer.style.zIndex = '10';
        });
        
        barContainer.addEventListener('mouseleave', () => {
          barContainer.style.transform = 'translateY(0)';
          barContainer.style.boxShadow = 'none';
          barContainer.style.zIndex = '1';
        });
        
        row.appendChild(barContainer);
      } else if (endIndex >= 0) {
        // 開始日が範囲外の場合、期日のみ表示
        const bar = document.createElement('div');
        bar.className = `gantt-bar ${task.priority}`;
        if (task.status === 'done') {
          bar.classList.add('completed');
        }
        
        bar.style.position = 'absolute';
        bar.style.left = `${endIndex * cellWidth}px`;
        bar.style.width = `${cellWidth - 4}px`;
        bar.style.height = '20px';
        bar.style.top = '10px';
        bar.textContent = task.title;
        bar.title = `${task.title} - ${task.assignee}`;
        
        bar.addEventListener('click', () => {
          this.showTaskDetail(task);
        });
        
        row.appendChild(bar);
      }
      
      timelineBody.appendChild(row);
    });
  }

  findDateIndex(dates, targetDate) {
    return dates.findIndex(date => 
      date.getFullYear() === targetDate.getFullYear() &&
      date.getMonth() === targetDate.getMonth() &&
      date.getDate() === targetDate.getDate()
    );
  }

  calculateDuration(task) {
    const created = new Date(task.createdAt);
    const due = new Date(task.dueDate);
    const days = Math.ceil((due - created) / (1000 * 60 * 60 * 24));
    return `${days}日`;
  }

  showTaskDetail(task) {
    const modal = document.getElementById('taskDetailModal');
    const content = document.getElementById('taskDetailContent');
    
    if (modal && content) {
      content.innerHTML = `
        <div class="task-detail-info">
          <h3>${task.title}</h3>
          <p><strong>説明:</strong> ${task.description || 'なし'}</p>
          <p><strong>担当者:</strong> ${task.assignee}</p>
          <p><strong>期限:</strong> ${new Date(task.dueDate).toLocaleDateString('ja-JP')}</p>
          <p><strong>優先度:</strong> ${this.getPriorityText(task.priority)}</p>
          <p><strong>ステータス:</strong> ${this.getStatusText(task.status)}</p>
          <p><strong>進捗:</strong> ${task.progress}%</p>
          <p><strong>分類:</strong> ${task.category}</p>
        </div>
      `;
      modal.style.display = 'block';
    }
  }

  getPriorityText(priority) {
    const map = { high: '高優先度', medium: '中優先度', low: '低優先度' };
    return map[priority] || '中優先度';
  }

  getStatusText(status) {
    const map = { 
      todo: '未着手', 
      in_progress: '進行中', 
      review: 'レビュー中', 
      done: '完了' 
    };
    return map[status] || '未着手';
  }
}

// カレンダー管理機能
class CalendarManager {
  constructor() {
    this.tasks = [];
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.viewMode = 'month';
    this.init();
  }

  init() {
    if (document.querySelector('.calendar-container')) {
      this.loadTasks();
      this.setupEventListeners();
      this.renderCalendar();
      this.updateSelectedDate();
    }
  }

  loadTasks() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
      try {
        this.tasks = JSON.parse(stored) || [];
      } catch (e) {
        this.tasks = [];
      }
    }
  }

  setupEventListeners() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    const quickForm = document.getElementById('quickAddForm');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateMonth(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateMonth(1);
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.renderCalendar();
        this.updateSelectedDate();
      });
    }

    if (quickForm) {
      quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.quickAddTask();
      });
    }

    // モーダルクローズ
    const closeBtn = document.getElementById('closeTaskDetail');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('taskDetailModal').style.display = 'none';
      });
    }
  }

  navigateMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.renderCalendar();
  }

  renderCalendar() {
    this.updateMonthDisplay();
    this.renderCalendarDays();
  }

  updateMonthDisplay() {
    const monthElement = document.getElementById('currentMonth');
    if (monthElement) {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth() + 1;
      monthElement.textContent = `${year}年 ${month}月`;
    }
  }

  renderCalendarDays() {
    const daysContainer = document.getElementById('calendarDays');
    if (!daysContainer) return;

    daysContainer.innerHTML = '';

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // 6週間分の日付を生成
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayElement = this.createDayElement(date, month);
      daysContainer.appendChild(dayElement);
    }
  }

  createDayElement(date, currentMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    // 日付の分類
    if (date.getMonth() !== currentMonth) {
      dayDiv.classList.add('other-month');
    }
    
    if (this.isToday(date)) {
      dayDiv.classList.add('today');
    }
    
    if (this.isSameDate(date, this.selectedDate)) {
      dayDiv.classList.add('selected');
    }

    // 日付番号
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayDiv.appendChild(dayNumber);

    // タスク表示エリア
    const tasksDiv = document.createElement('div');
    tasksDiv.className = 'day-tasks';
    
    const dayTasks = this.getTasksForDate(date);
    dayTasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = `calendar-task ${task.priority}`;
      if (task.status === 'done') {
        taskElement.classList.add('completed');
      }
      taskElement.textContent = task.title;
      taskElement.title = `${task.title} - ${task.assignee}`;
      
      taskElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showTaskDetail(task);
      });
      
      tasksDiv.appendChild(taskElement);
    });
    
    dayDiv.appendChild(tasksDiv);

    // 日付クリックイベント
    dayDiv.addEventListener('click', () => {
      this.selectDate(date);
    });

    return dayDiv;
  }

  getTasksForDate(date) {
    return this.tasks.filter(task => {
      const taskStartDate = new Date(task.startDate || task.createdAt);
      const taskEndDate = new Date(task.dueDate);
      
      // 指定された日付がタスクの期間内にあるかチェック
      return date >= taskStartDate && date <= taskEndDate;
    });
  }

  isToday(date) {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  selectDate(date) {
    this.selectedDate = new Date(date);
    this.renderCalendar();
    this.updateSelectedDate();
    this.renderDailyTasks();
  }

  updateSelectedDate() {
    const selectedDateElement = document.getElementById('selectedDate');
    if (selectedDateElement) {
      selectedDateElement.textContent = this.selectedDate.toLocaleDateString('ja-JP');
    }
  }

  renderDailyTasks() {
    const dailyTasksContainer = document.getElementById('dailyTasks');
    if (!dailyTasksContainer) return;

    dailyTasksContainer.innerHTML = '';
    const tasks = this.getTasksForDate(this.selectedDate);

    if (tasks.length === 0) {
      dailyTasksContainer.innerHTML = '<p>この日にタスクはありません。</p>';
      return;
    }

    tasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'daily-task';
      
      taskElement.innerHTML = `
        <div class="task-info">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">${task.assignee} - ${task.category}</div>
        </div>
        <div class="task-priority-badge ${task.priority}">
          ${this.getPriorityText(task.priority)}
        </div>
      `;
      
      taskElement.addEventListener('click', () => {
        this.showTaskDetail(task);
      });
      
      dailyTasksContainer.appendChild(taskElement);
    });
  }

  quickAddTask() {
    const titleInput = document.getElementById('quickTaskTitle');
    if (!titleInput || !titleInput.value.trim()) return;

    const newTask = {
      id: this.generateTaskId(),
      title: titleInput.value.trim(),
      description: '',
      assignee: '未割り当て',
      dueDate: this.selectedDate.toISOString().split('T')[0],
      priority: 'medium',
      category: 'その他',
      status: 'todo',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.push(newTask);
    this.saveTasks();
    titleInput.value = '';
    this.renderCalendar();
    this.renderDailyTasks();
    
    this.showNotification('タスクが追加されました', 'success');
  }

  generateTaskId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `task_${timestamp}_${random}`;
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  showTaskDetail(task) {
    const modal = document.getElementById('taskDetailModal');
    const content = document.getElementById('taskDetailContent');
    
    if (modal && content) {
      content.innerHTML = `
        <div class="task-detail-info">
          <h3>${task.title}</h3>
          <p><strong>説明:</strong> ${task.description || 'なし'}</p>
          <p><strong>担当者:</strong> ${task.assignee}</p>
          <p><strong>期限:</strong> ${new Date(task.dueDate).toLocaleDateString('ja-JP')}</p>
          <p><strong>優先度:</strong> ${this.getPriorityText(task.priority)}</p>
          <p><strong>ステータス:</strong> ${this.getStatusText(task.status)}</p>
          <p><strong>進捗:</strong> ${task.progress}%</p>
          <p><strong>分類:</strong> ${task.category}</p>
        </div>
      `;
      modal.style.display = 'block';
    }
  }

  getPriorityText(priority) {
    const map = { high: '高優先度', medium: '中優先度', low: '低優先度' };
    return map[priority] || '中優先度';
  }

  getStatusText(status) {
    const map = { 
      todo: '未着手', 
      in_progress: '進行中', 
      review: 'レビュー中', 
      done: '完了' 
    };
    return map[status] || '未着手';
  }

  showNotification(message, type = 'info') {
    // SettingsManagerと同じ通知システムを使用
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
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
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// ガントチャートとカレンダーマネージャーの初期化
let ganttManager;
let calendarManager;

if (document.querySelector('.gantt-container')) {
  ganttManager = new GanttManager();
}

if (document.querySelector('.calendar-container')) {
  calendarManager = new CalendarManager();
}

// グローバル関数として公開
function toggleExpand() {
  if (ganttManager) {
    ganttManager.isExpanded = !ganttManager.isExpanded;
    const chart = document.querySelector('.gantt-chart');
    if (chart) {
      chart.style.height = ganttManager.isExpanded ? '600px' : '400px';
    }
  }
}

function exportGantt() {
  if (ganttManager) {
    const data = {
      tasks: ganttManager.tasks,
      period: ganttManager.currentDate.toISOString(),
      timeScale: ganttManager.timeScale,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function toggleCalendarView() {
  if (calendarManager) {
    const monthView = document.getElementById('monthView');
    const weekView = document.getElementById('weekView');
    
    if (calendarManager.viewMode === 'month') {
      calendarManager.viewMode = 'week';
      monthView.style.display = 'none';
      weekView.style.display = 'block';
    } else {
      calendarManager.viewMode = 'month';
      monthView.style.display = 'block';
      weekView.style.display = 'none';
    }
  }
}
