import { Utils } from './utils.js';
import { SimpleAuth } from './simple-auth.js';

// タスク管理クラス
export class TaskManager {
  constructor() {
    this.tasks = [];
    this.settings = {};
    this.editingTaskId = null;
    this.deletingTaskId = null; // 削除対象のタスクID
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadUsers(); // ユーザーリストを読み込み
    await this.loadTasks();
    this.setupEventListeners();
    this.populateFormOptions();
    this.renderTasks();
  }

  async loadSettings() {
    try {
      const response = await fetch('/api/settings', {
        headers: SimpleAuth.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.settings = await response.json();
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      categories: ['企画', '開発', 'デザイン', 'テスト', 'ドキュメント', '会議', 'その他'],
      users: [], // 初期値を空配列に
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

  async loadUsers() {
    try {
      const response = await fetch('/api/users', {
        headers: SimpleAuth.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // ユーザーリストを設定に追加
      this.settings.users = data.users.map(user => ({
        value: user.id,
        label: user.displayName || user.loginId
      }));
      
    } catch (error) {
      console.error('ユーザーの読み込みに失敗しました:', error);
      // フォールバック：管理者と現在のユーザーのみ
      const currentUser = SimpleAuth.getCurrentUser();
      this.settings.users = [
        { value: 'admin', label: '管理者' },
        { value: currentUser?.id || 'current', label: currentUser?.displayName || 'あなた' }
      ];
    }
  }

  async loadTasks() {
    try {
      // APIからタスクデータを取得
      const response = await fetch('/api/tasks', {
        headers: SimpleAuth.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.tasks = data.tasks || [];
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      // フォールバック：ローカルストレージから読み込み
      this.tasks = Utils.getFromStorage('tasks', []);
    }
  }

  async saveTasks() {
    try {
      // APIにタスクデータを保存
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify({ tasks: this.tasks })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('タスク保存成功:', result.message);
    } catch (error) {
      console.error('タスクの保存に失敗しました:', error);
      // フォールバック：ローカルストレージに保存
      Utils.saveToStorage('tasks', this.tasks);
    }
  }

  setupEventListeners() {
    const elements = {
      addBtn: Utils.getElement('#addTaskBtn'), // 修正: IDに変更
      modals: Utils.getElements('.modal'),
      closeBtns: Utils.getElements('.close-modal-btn'),
      form: Utils.getElement('#taskForm'),
      taskList: Utils.getElement('#taskList'), // 修正: IDに変更
      filterSelect: Utils.getElement('#taskFilter'), // フィルター機能追加
      deleteTaskBtn: Utils.getElement("#deleteTask")
    };

    // デバッグ用ログ
    console.log('タスク要素:', {
      addBtn: !!elements.addBtn,
      modal: !!elements.modal,
      form: !!elements.form,
      taskList: !!elements.taskList
    });

    // モーダル関連のイベント
    this.setupModalEvents(elements);
    
    // フォーム送信
    if (elements.form) {
      elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
    }

    // タスクリストのイベント（イベントデリゲーション）
    if (elements.taskList) {
      elements.taskList.addEventListener('click', async (e) => await this.handleTaskListClick(e));
    }

    // フィルター機能
    if (elements.filterSelect) {
      elements.filterSelect.addEventListener('change', (e) => {
        this.filterTasks(e.target.value);
      });
    }
  }

  setupModalEvents(elements) {
    const { addBtn, modals, closeBtns, deleteTaskBtn } = elements;

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.resetEditState();
        const form = Utils.getElement('#taskForm');
        if (form) form.reset();
        this.openModal("#taskModal");
      });
    }

    if (closeBtns) closeBtns.forEach(closeBtn => closeBtn.addEventListener('click', () => this.closeModal()));

    // モーダル外クリック
    if (modals) {
      modals.forEach(modal =>
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      }));
    }

    if (deleteTaskBtn) deleteTaskBtn.addEventListener('click', async () => await this.deleteTask());
  }

  async handleTaskListClick(e) {
    const button = e.target.closest('button');
    if (!button) return;
    
    const container = button.closest('.task-item');
    const taskId = button.dataset.id || container?.dataset.id;
    if (!taskId) return;

    if (button.classList.contains('delete-task-btn')) {
      this.openModal("#taskDeleteModal");
      this.deletingTaskId = taskId;
    } else if (button.classList.contains('edit-task-btn')) {
      this.editTask(taskId);
    }
  }

  populateFormOptions() {
    const selectors = [
      { id: '#taskAssignee', options: this.settings.users, hasValue: true },
      { id: '#taskCategory', options: this.settings.categories },
      { id: '#taskPriority', options: this.settings.priorities, hasValue: true },
      { id: '#taskStatus', options: this.settings.statuses, hasValue: true }
    ];

    selectors.forEach(({ id, options, hasValue }) => {
      const select = Utils.getElement(id);
      if (select && options) {
        // 既存のオプション（"選択してください"以外）をクリア
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (firstOption) {
          select.appendChild(firstOption);
        }

        options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = hasValue ? option.value : option;
          optionElement.textContent = hasValue ? option.label : option;
          select.appendChild(optionElement);
        });
      }
    });
  }

  openModal(selector) {
    console.log('selector: ' + selector);
    const modal = Utils.getElement(selector);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    const modals = Utils.getElements(".modal");
    if (modals) {
      modals.forEach(modal => {
        modal.style.display = 'none';
      });
      document.body.style.overflow = 'auto';
      const form = Utils.getElement('#taskForm');
      if (form) form.reset();
    }
    this.resetEditState();
  }

  async handleFormSubmit() {
    const form = Utils.getElement('#taskForm');
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

    if (!this.validateTaskData(payload)) return;

    if (this.editingTaskId) {
      await this.updateTask(payload);
    } else {
      await this.addTask(payload);
    }
  }

  validateTaskData(payload) {
    const required = ['title', 'assignee', 'startDate', 'dueDate', 'priority', 'category', 'status'];
    const missing = required.filter(field => !payload[field]);
    
    if (missing.length > 0) {
      Utils.showNotification('必須項目を入力してください。', 'warning');
      return false;
    }

    if (!Utils.validateDates(payload.startDate, payload.dueDate)) {
      Utils.showNotification('開始日は期日より前に設定してください。', 'warning');
      return false;
    }

    return true;
  }

  async addTask(payload) {
    const task = {
      id: Utils.generateId('task'),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.push(task);
    await this.saveTasks();
    this.renderTasks();
    this.closeModal();
    Utils.showNotification('タスクが正常に追加されました。', 'success');
  }

  async updateTask(payload) {
    const index = this.tasks.findIndex(t => t.id === this.editingTaskId);
    if (index !== -1) {
      this.tasks[index] = { 
        ...this.tasks[index], 
        ...payload, 
        updatedAt: new Date().toISOString() 
      };
      await this.saveTasks();
      this.renderTasks();
      this.closeModal();
      Utils.showNotification('タスクを更新しました。', 'success');
    }
  }

  editTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    this.populateForm(task);
    this.updateModalForEdit();
    this.openModal("#taskModal");
  }

  populateForm(task) {
    const fields = [
      { id: '#taskTitle', value: task.title },
      { id: '#taskDescription', value: task.description },
      { id: '#taskAssignee', value: task.assignee },
      { id: '#taskStartDate', value: task.startDate },
      { id: '#taskDueDate', value: task.dueDate },
      { id: '#taskPriority', value: task.priority },
      { id: '#taskCategory', value: task.category },
      { id: '#taskStatus', value: task.status },
      { id: '#taskProgress', value: String(task.progress || 0) }
    ];

    fields.forEach(({ id, value }) => {
      const element = Utils.getElement(id);
      if (element) element.value = value || '';
    });
  }

  updateModalForEdit() {
    const form = Utils.getElement('#taskForm');
    if (form) {
      const modalTitle = form.closest('.modal-content')?.querySelector('.modal-header h2');
      const submitBtn = form.querySelector('.btn-primary');
      
      if (modalTitle) modalTitle.textContent = 'タスクを編集';
      if (submitBtn) submitBtn.textContent = '保存';
    }
  }

  resetEditState() {
    this.editingTaskId = null;
    const form = Utils.getElement('#taskForm');
    if (form) {
      const modalTitle = form.closest('.modal-content')?.querySelector('.modal-header h2');
      const submitBtn = form.querySelector('.btn-primary');
      
      if (modalTitle) modalTitle.textContent = '新しいタスクを追加';
      if (submitBtn) submitBtn.textContent = 'タスクを追加';
    }
  }

  async deleteTask() {
    if (!this.deletingTaskId) return;
    this.tasks = this.tasks.filter(t => t.id !== this.deletingTaskId);
    await this.saveTasks();
    this.renderTasks();
    this.deletingTaskId = null;
    this.closeModal();
    Utils.showNotification('タスクが削除されました。', 'success');
  }

  renderTasks(filter = 'all') {
    const taskList = Utils.getElement('#taskList'); // 修正: IDに変更
    if (!taskList) {
      console.warn('タスクリストが見つかりません');
      return;
    }

    // フィルターされたタスクを取得
    const filteredTasks = this.getFilteredTasks(filter);

    taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<div class="no-tasks">タスクが見つかりません</div>';
      return;
    }

    filteredTasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      taskList.appendChild(taskElement);
    });
  }

  getFilteredTasks(filter) {
    switch (filter) {
      case 'todo':
        return this.tasks.filter(task => task.status !== 'done');
      case 'in_progress':
        return this.tasks.filter(task => task.status === 'in_progress');
      case 'review':
        return this.tasks.filter(task => task.status === 'review');
      case 'done':
        return this.tasks.filter(task => task.status === 'done');
      default:
        return this.tasks;
    }
  }

  filterTasks(filter) {
    console.log('タスクフィルター適用:', filter);
    this.renderTasks(filter);
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
          <span class="task-due">期限: ${Utils.formatDate(task.dueDate)}</span>
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
    checkbox.addEventListener('change', async (e) => {
      await this.toggleTaskStatus(task.id, e.target.checked);
    });

    return taskDiv;
  }

  async toggleTaskStatus(taskId, isDone) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = isDone ? 'done' : 'todo';
      task.progress = isDone ? 100 : 0;
      await this.saveTasks();
      this.renderTasks();
    }
  }

  getProgressText(progress) {
    const progressMap = { 0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%' };
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
}