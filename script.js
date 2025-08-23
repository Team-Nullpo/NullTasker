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
