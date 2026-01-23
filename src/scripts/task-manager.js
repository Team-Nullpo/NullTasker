import { Utils } from "./utils.js";
import { SimpleAuth } from "./simple-auth.js";
import {
  TASK_PROGRESS,
  TASK_PROGRESS_OPTIONS,
  TASK_PRIORITY,
  TASK_STATUS,
} from "./constants.js";
import { AppConfig } from "./config.js";
import { ProjectManager } from "./project-manager.js";
import { UserManager } from "./user-manager.js";
import { TicketManager } from "./ticket-manager.js";

// タスク管理クラス
export class TaskManager {
  constructor() {
    this.tasks = [];
    this.projectUsers = [];
    this.projectId = null;
    this.settings = {};
    this.editingTaskId = null;
    this.deletingTaskId = null; // 削除対象のタスクID
    this.init();
  }

  init() {
    this.loadSettings();
    this.loadUsers(); // ユーザーリストを読み込み
    this.loadTasks();
    this.setupEventListeners();
    this.populateFormOptions();
    this.renderTasks();
  }

  loadSettings() {
    this.projectId = ProjectManager.getCurrentProjectId();
    this.settings = ProjectManager.getProjectSettings(this.projectId);
    Utils.debugLog("プロジェクト設定:", this.settings);
  }

  loadUsers() {
    this.projectUsers = UserManager.getUsers(this.projectId);
  }

  loadTasks() {
    this.tasks = TicketManager.tasks.filter(
      (ticket) => ticket.project === this.projectId
    );
  }

  setupEventListeners() {
    const elements = {
      addBtn: Utils.getElement("#addTaskBtn"),
      modals: Utils.getElements(".modal"),
      closeBtns: Utils.getElements(".close-modal-btn"),
      form: Utils.getElement("#taskForm"),
      taskList: Utils.getElement("#taskList"),
      filterSelect: Utils.getElement("#taskFilter"),
      sortSelect: Utils.getElement("#taskSort"),
      searchInput: Utils.getElement("#taskSearch"),
      viewBtns: Utils.getElements(".view-btn"),
      deleteTaskBtn: Utils.getElement("#deleteTask"),
    };

    // デバッグ用ログ
    Utils.debugLog("タスク要素:", {
      addBtn: !!elements.addBtn,
      modals: elements.modals?.length || 0,
      form: !!elements.form,
      taskList: !!elements.taskList,
    });

    // モーダル関連のイベント
    this.setupModalEvents(elements);

    // フォーム送信
    if (elements.form) {
      elements.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
    }

    // タスクリストのイベント（イベントデリゲーション）
    if (elements.taskList) {
      elements.taskList.addEventListener(
        "click",
        async (e) => await this.handleTaskListClick(e)
      );
    }

    // フィルター機能
    if (elements.filterSelect) {
      elements.filterSelect.addEventListener("change", (e) => {
        this.renderTasks();
      });
    }

    // ソート機能
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener("change", (e) => {
        this.renderTasks();
      });
    }

    // 検索機能
    if (elements.searchInput) {
      elements.searchInput.addEventListener("input", (e) => {
        this.renderTasks();
      });
    }

    // ビュー切り替え
    if (elements.viewBtns) {
      elements.viewBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
          elements.viewBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const view = btn.dataset.view;
          if (elements.taskList) {
            elements.taskList.dataset.view = view;
          }
        });
      });
    }

    // 日付入力のバリデーション（Chrome対策）
    this.setupDateInputValidation();
  }

  setupDateInputValidation() {
    const startDateInput = Utils.getElement("#taskStartDate");
    const dueDateInput = Utils.getElement("#taskDueDate");

    // 入力完了時（フォーカスが外れた時）のみバリデーションを実行
    if (startDateInput) {
      startDateInput.addEventListener("blur", (e) => this.validateDateInput(e.target));
    }

    if (dueDateInput) {
      dueDateInput.addEventListener("blur", (e) => this.validateDateInput(e.target));
    }
  }

  validateDateInput(input) {
    const value = input.value;
    if (!value) {
      input.setCustomValidity("");
      return true;
    }

    // 日付フォーマットをチェック (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(value)) {
      input.setCustomValidity("日付形式が正しくありません（YYYY-MM-DD）");
      Utils.showNotification("日付形式が正しくありません（YYYY-MM-DD）", "warning");
      return false;
    }

    // 年が4桁であることを確認
    const parts = value.split("-");
    const year = parseInt(parts[0], 10);

    if (year < 1900 || year > 9999) {
      input.setCustomValidity("年は1900から9999の範囲で入力してください");
      Utils.showNotification("年は1900から9999の範囲で入力してください", "warning");
      return false;
    }

    input.setCustomValidity("");
    return true;
  }

  setupModalEvents(elements) {
    const { addBtn, modals, closeBtns, deleteTaskBtn } = elements;

    Utils.debugLog("setupModalEvents - addBtn:", addBtn);

    if (addBtn) {
      Utils.debugLog("タスク追加ボタンにイベントリスナーを設定します");
      addBtn.addEventListener("click", () => {
        Utils.debugLog("タスク追加ボタンがクリックされました");
        this.resetEditState();
        const form = Utils.getElement("#taskForm");
        if (form) {
          form.reset();
          // デフォルト値を設定
          const progressSelect = Utils.getElement("#taskProgress");
          if (progressSelect)
            progressSelect.value = String(TASK_PROGRESS.NOT_STARTED);
        }
        this.openModal("#taskModal");
      });
    } else {
      console.error("タスク追加ボタン(#addTaskBtn)が見つかりません");
    }

    if (closeBtns)
      closeBtns.forEach((closeBtn) =>
        closeBtn.addEventListener("click", () => this.closeModal())
      );

    // モーダル外クリック
    if (modals) {
      modals.forEach((modal) =>
        modal.addEventListener("click", (e) => {
          if (e.target === modal) this.closeModal();
        })
      );
    }

    if (deleteTaskBtn)
      deleteTaskBtn.addEventListener(
        "click",
        async () => await this.deleteTask()
      );
  }

  async handleTaskListClick(e) {
    const button = e.target.closest("button");
    if (!button) return;

    const container = button.closest(".task-item");
    const taskId = button.dataset.id || container?.dataset.id;
    if (!taskId) return;

    if (button.classList.contains("delete-task-btn")) {
      this.openModal("#taskDeleteModal");
      this.deletingTaskId = taskId;
    } else if (button.classList.contains("edit-task-btn")) {
      this.editTask(taskId);
    }
  }

  populateFormOptions() {
    // 進捗率の選択肢を動的に生成
    const progressSelect = Utils.getElement("#taskProgress");
    if (progressSelect) {
      progressSelect.innerHTML = "";
      TASK_PROGRESS_OPTIONS.forEach((progress) => {
        const option = document.createElement("option");
        option.value = String(progress.value);
        option.textContent = progress.label;
        progressSelect.appendChild(option);
      });
    }

    // settingsが存在しない場合は警告してスキップ
    if (!this.settings) {
      console.warn("プロジェクト設定が読み込まれていません");
      return;
    }

    const usernames = this.projectUsers.map(u => {
      return {
        value: u.id,
        label: u.displayName
      }
    });

    // settingsオブジェクトの構造を確認
    const projectSettings = this.settings?.settings || this.settings;

    Utils.debugLog("projectSettings:", projectSettings);

    const selectors = [
      { id: "#taskAssignee", options: usernames, hasValue: true },
      { id: "#taskCategory", options: projectSettings?.categories || [] },
      {
        id: "#taskPriority",
        options: projectSettings?.priorities || [],
        hasValue: true,
      },
      {
        id: "#taskStatus",
        options: projectSettings?.statuses || [],
        hasValue: true,
      },
    ];

    selectors.forEach(({ id, options, hasValue }) => {
      const select = Utils.getElement(id);
      if (select && options) {
        // 既存のオプション("選択してください"以外)をクリア
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = "";
        if (firstOption) {
          select.appendChild(firstOption);
        }

        options.forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = hasValue ? option.value : option;
          optionElement.textContent = hasValue ? option.label : option;
          select.appendChild(optionElement);
        });
      }
    });
  }

  openModal(selector) {
    Utils.debugLog("selector: " + selector);
    const modal = Utils.getElement(selector);
    if (modal) {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    }
  }

  closeModal() {
    const modals = Utils.getElements(".modal");
    if (modals) {
      modals.forEach((modal) => {
        modal.style.display = "none";
      });
      document.body.style.overflow = "auto";
      const form = Utils.getElement("#taskForm");
      if (form) form.reset();
    }
    this.resetEditState();
  }

  async handleFormSubmit() {
    try {
      const form = Utils.getElement("#taskForm");
      if (!form) {
        console.error("フォームが見つかりません");
        return;
      }

      const formData = new FormData(form);
      const payload = {
        title: formData.get("title"),
        description: formData.get("description") || "",
        assignee: formData.get("assignee"),
        startDate: formData.get("startDate"),
        dueDate: formData.get("dueDate"),
        priority: formData.get("priority"),
        category: formData.get("category"),
        status: formData.get("status"),
        progress: parseInt(formData.get("progress")) || 0,
        project: this.projectId,
      };

      Utils.debugLog("フォーム送信データ:", payload);

      if (!this.validateTaskData(payload)) return;

      if (this.editingTaskId) {
        if (!(await TicketManager.updateTicket(payload, this.editingTaskId))) {
          Utils.showNotification("タスク更新に失敗しました", "error");
          return;
        }
      } else {
        if (!(await TicketManager.createTicket(payload))) {
          Utils.showNotification("タスク追加に失敗しました", "error");
          return;
        }
      }
      this.renderTasks();
      this.closeModal();
      Utils.showNotification("タスクが正常に更新されました。", "success");
    } catch (error) {
      console.error("フォーム送信エラー:", error);
      Utils.showNotification("フォームの送信に失敗しました。", "error");
    }
  }

  validateTaskData(payload) {
    const required = [
      "title",
      "assignee",
      "startDate",
      "dueDate",
      "priority",
      "category",
      "status",
    ];
    const missing = required.filter((field) => !payload[field]);

    if (missing.length > 0) {
      Utils.showNotification("必須項目を入力してください。", "warning");
      return false;
    }

    // 日付の形式と範囲をチェック
    const startDateValidation = this.isValidDateFormat(payload.startDate);
    if (!startDateValidation.valid) {
      Utils.showNotification(startDateValidation.message, "warning");
      return false;
    }

    const dueDateValidation = this.isValidDateFormat(payload.dueDate);
    if (!dueDateValidation.valid) {
      Utils.showNotification(dueDateValidation.message, "warning");
      return false;
    }

    if (!Utils.validateDates(payload.startDate, payload.dueDate)) {
      Utils.showNotification(
        "開始日は期日より前に設定してください。",
        "warning"
      );
      return false;
    }

    return true;
  }

  isValidDateFormat(dateString) {
    if (!dateString) {
      return { valid: false, message: "日付を入力してください" };
    }

    // 日付フォーマットをチェック (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dateString)) {
      return { valid: false, message: "日付形式が正しくありません（YYYY-MM-DD）" };
    }

    // 年が4桁で1900-9999の範囲内であることを確認
    const parts = dateString.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (year < 1900 || year > 9999) {
      return { valid: false, message: "年は1900から9999の範囲で入力してください" };
    }

    // 月と日の妥当性チェック
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { valid: false, message: "日付が無効です" };
    }

    // 実際の日付として有効かチェック
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return { valid: false, message: "日付が無効です" };
    }

    return { valid: true };
  }

  editTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    this.populateForm(task);
    this.updateModalForEdit();
    this.openModal("#taskModal");
  }

  populateForm(task) {
    const fields = [
      { id: "#taskTitle", value: task.title },
      { id: "#taskDescription", value: task.description },
      { id: "#taskAssignee", value: task.assignee },
      { id: "#taskStartDate", value: task.startDate },
      { id: "#taskDueDate", value: task.dueDate },
      { id: "#taskPriority", value: task.priority },
      { id: "#taskCategory", value: task.category },
      { id: "#taskStatus", value: task.status },
      { id: "#taskProgress", value: String(task.progress || 0) },
    ];

    fields.forEach(({ id, value }) => {
      const element = Utils.getElement(id);
      if (element) element.value = value || "";
    });
  }

  updateModalForEdit() {
    const form = Utils.getElement("#taskForm");
    if (form) {
      const modalTitle = form
        .closest(".modal-content")
        ?.querySelector(".modal-header h2");
      const submitBtn = form.querySelector(".btn-primary");

      if (modalTitle) modalTitle.textContent = "タスクを編集";
      if (submitBtn) submitBtn.textContent = "保存";
    }
  }

  resetEditState() {
    this.editingTaskId = null;
    const form = Utils.getElement("#taskForm");
    if (form) {
      const modalTitle = form
        .closest(".modal-content")
        ?.querySelector(".modal-header h2");
      const submitBtn = form.querySelector(".btn-primary");

      if (modalTitle) modalTitle.textContent = "新しいタスクを追加";
      if (submitBtn) submitBtn.textContent = "タスクを追加";
    }
  }

  async deleteTask() {
    try {
      if (!this.deletingTaskId) return;
      if (!(await TicketManager.removeTicket(this.deletingTaskId))) return;
      this.renderTasks();
      this.deletingTaskId = null;
      this.closeModal();
      Utils.showNotification("タスクが削除されました。", "success");
    } catch (error) {
      console.error("タスク削除エラー:", error);
      Utils.showNotification("タスクの削除に失敗しました。", "error");
    }
  }

  renderTasks() {
    this.loadTasks();
    const taskList = Utils.getElement("#taskList");
    if (!taskList) {
      console.warn("タスクリストが見つかりません");
      return;
    }

    // フィルター、検索、ソートを適用
    let filteredTasks = this.getFilteredTasks();

    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<div class="no-tasks">タスクが見つかりません</div>';
      this.updateStats([]);
      return;
    }

    filteredTasks.forEach((task) => {
      const taskElement = this.createTaskElement(task);
      taskList.appendChild(taskElement);
    });

    // 統計を更新
    this.updateStats(this.tasks.filter(task => task.project === this.projectId));
  }

  getFilteredTasks() {
    let tasks = this.tasks.filter(
      (task) => task.project === this.projectId
    );

    // フィルター適用
    const filterValue = Utils.getElement("#taskFilter")?.value || "all";
    switch (filterValue) {
      case "todo":
        tasks = tasks.filter((task) => task.status === "todo");
        break;
      case "in_progress":
        tasks = tasks.filter((task) => task.status === "in_progress");
        break;
      case "review":
        tasks = tasks.filter((task) => task.status === "review");
        break;
      case "done":
        tasks = tasks.filter((task) => task.status === "done");
        break;
    }

    // 検索適用
    const searchValue = Utils.getElement("#taskSearch")?.value.toLowerCase() || "";
    if (searchValue) {
      tasks = tasks.filter((task) =>
        task.title.toLowerCase().includes(searchValue) ||
        task.description.toLowerCase().includes(searchValue) ||
        task.category.toLowerCase().includes(searchValue)
      );
    }

    // ソート適用
    const sortValue = Utils.getElement("#taskSort")?.value || "dueDate";
    tasks.sort((a, b) => {
      switch (sortValue) {
        case "dueDate":
          return new Date(a.dueDate) - new Date(b.dueDate);
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "status":
          const statusOrder = { todo: 0, in_progress: 1, review: 2, done: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return tasks;
  }

  updateStats(tasks) {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const completed = tasks.filter(t => t.status === "done").length;
    const overdue = tasks.filter(t => {
      if (t.status === "done") return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const totalEl = Utils.getElement("#totalTasks");
    const inProgressEl = Utils.getElement("#inProgressTasks");
    const completedEl = Utils.getElement("#completedTasks");
    const overdueEl = Utils.getElement("#overdueTasks");

    if (totalEl) totalEl.textContent = total;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (completedEl) completedEl.textContent = completed;
    if (overdueEl) overdueEl.textContent = overdue;
  }

  filterTasks(filter) {
    Utils.debugLog("タスクフィルター適用:", filter);
    this.renderTasks();
  }

  createTaskElement(task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task-item priority-${task.priority}`;
    taskDiv.dataset.id = task.id;

    const progressText = this.getProgressText(task.progress);
    const priorityText = this.getPriorityText(task.priority);
    const statusText = this.getStatusText(task.status);
    const assigneeText = this.getAssigneeDisplayName(task);

    // 期限が過ぎているかチェック
    const isOverdue = task.status !== "done" && new Date(task.dueDate) < new Date();
    const dueDateClass = isOverdue ? "task-due overdue" : "task-due";

    // 優先度アイコン
    const priorityIcons = {
      high: '🔥',
      medium: '⚡',
      low: '🌱'
    };

    taskDiv.innerHTML = `
      <div class="task-checkbox">
        <input type="checkbox" id="${task.id}" ${task.status === "done" ? "checked" : ""
      }>
        <label for="${task.id}"></label>
      </div>
      <div class="task-content">
        <h3>
          ${priorityIcons[task.priority] || ''} ${task.title}
        </h3>
        <p>${task.description || '<em>説明なし</em>'}</p>
        <div class="task-meta">
          <span class="task-priority ${task.priority}">${priorityText}</span>
          <span class="task-status ${task.status}">${statusText}</span>
          <span class="${dueDateClass}">
            <i class="fas fa-calendar"></i> ${Utils.formatDate(task.dueDate)}
          </span>
          <span class="task-assignee">
            <i class="fas fa-user"></i> ${assigneeText}
          </span>
          <span class="task-category">
            <i class="fas fa-tag"></i> ${task.category}
          </span>
          <span class="task-progress">
            <i class="fas fa-chart-line"></i> ${progressText}
          </span>
        </div>
      </div>
      <div class="task-actions">
        <button type="button" class="task-btn edit-task-btn" data-id="${task.id
      }" title="編集">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="task-btn delete-task-btn" data-id="${task.id
      }" title="削除">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // チェックボックスのイベント
    const checkbox = taskDiv.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", async (e) => {
      await this.toggleTaskStatus(task.id, e.target.checked);
    });

    return taskDiv;
  }

  async toggleTaskStatus(taskId, isDone) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      const cp = structuredClone(task);
      cp.status = isDone ? TASK_STATUS.DONE : TASK_STATUS.TODO;
      cp.progress = isDone
        ? TASK_PROGRESS.COMPLETED
        : TASK_PROGRESS.NOT_STARTED;
      if (!(await TicketManager.updateTicket(cp, taskId))) {
        Utils.showNotification("タスク更新に失敗しました", "error");
        return;
      }
      this.renderTasks();
      Utils.showNotification("タスクが正常に更新されました。", "success");
    }
  }

  getProgressText(progress) {
    // 定数から進捗テキストを取得
    const progressEntry = TASK_PROGRESS_OPTIONS.find(
      (p) => p.value === progress
    );
    return progressEntry ? progressEntry.label : "0%";
  }

  getPriorityText(priority) {
    const priorityObj = this.settings.settings.priorities.find(
      (p) => p.value === priority
    );
    return priorityObj ? priorityObj.label : "中優先度";
  }

  getStatusText(statusValue) {
    const status = this.settings.settings.statuses.find(
      (s) => s.value === statusValue
    );
    return status ? status.label : "不明";
  }

  getAssigneeText(assigneeValue) {
    // まずローカルのprojectUsersから検索
    const assignee = this.projectUsers.find((u) => u.id === assigneeValue);
    if (assignee) {
      return assignee.displayName;
    }

    // assigneeValueがない場合は「未割り当て」を返す
    if (!assigneeValue) {
      return "未割り当て";
    }

    // IDをそのまま返す（フォールバック）
    return assigneeValue;
  }

  // タスクオブジェクトから担当者名を取得（assigneeInfo対応）
  getAssigneeDisplayName(task) {
    // サーバーから返されたassigneeInfo情報を優先的に使用
    if (task.assigneeInfo?.name) {
      return task.assigneeInfo.name;
    }

    // フォールバック: assigneeIDから検索
    return this.getAssigneeText(task.assignee);
  }
}
