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
  }

  loadUsers() {
    console.log(this.settings);
    const projectUsers = UserManager.users.filter((user) =>
      this.settings.members.includes(user.id)
    );
    this.settings.users = projectUsers.map((user) => ({
      value: user.id,
      label: user.displayName || user.loginId,
    }));
  }

  loadTasks() {
    this.tasks = TicketManager.tasks.filter(
      (ticket) => ticket.project === this.projectId
    );
  }

  setupEventListeners() {
    const elements = {
      addBtn: Utils.getElement("#addTaskBtn"), // 修正: IDに変更
      modals: Utils.getElements(".modal"),
      closeBtns: Utils.getElements(".close-modal-btn"),
      form: Utils.getElement("#taskForm"),
      taskList: Utils.getElement("#taskList"), // 修正: IDに変更
      filterSelect: Utils.getElement("#taskFilter"), // フィルター機能追加
      deleteTaskBtn: Utils.getElement("#deleteTask"),
    };

    // デバッグ用ログ
    Utils.debugLog("タスク要素:", {
      addBtn: !!elements.addBtn,
      modal: !!elements.modal,
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
        this.filterTasks(e.target.value);
      });
    }
  }

  setupModalEvents(elements) {
    const { addBtn, modals, closeBtns, deleteTaskBtn } = elements;

    if (addBtn) {
      addBtn.addEventListener("click", () => {
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

    const selectors = [
      { id: "#taskAssignee", options: this.settings.users, hasValue: true },
      { id: "#taskCategory", options: this.settings.settings.categories },
      {
        id: "#taskPriority",
        options: this.settings.settings.priorities,
        hasValue: true,
      },
      {
        id: "#taskStatus",
        options: this.settings.settings.statuses,
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

    if (!Utils.validateDates(payload.startDate, payload.dueDate)) {
      Utils.showNotification(
        "開始日は期日より前に設定してください。",
        "warning"
      );
      return false;
    }

    return true;
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

  renderTasks(filter = "all") {
    this.loadTasks();
    const taskList = Utils.getElement("#taskList"); // 修正: IDに変更
    if (!taskList) {
      console.warn("タスクリストが見つかりません");
      return;
    }

    // フィルターされたタスクを取得
    const filteredTasks = this.getFilteredTasks(filter);

    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<div class="no-tasks">タスクが見つかりません</div>';
      return;
    }

    filteredTasks.forEach((task) => {
      const taskElement = this.createTaskElement(task);
      taskList.appendChild(taskElement);
    });
  }

  getFilteredTasks(filter) {
    const tasks = this.tasks.filter(
      (task) => task.project === this.projectId
    );
    switch (filter) {
      case "todo":
        return tasks.filter((task) => task.status !== "done");
      case "in_progress":
        return tasks.filter((task) => task.status === "in_progress");
      case "review":
        return tasks.filter((task) => task.status === "review");
      case "done":
        return tasks.filter((task) => task.status === "done");
      default:
        return tasks;
    }
  }

  filterTasks(filter) {
    Utils.debugLog("タスクフィルター適用:", filter);
    this.renderTasks(filter);
  }

  createTaskElement(task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task-item";
    taskDiv.dataset.id = task.id;

    const progressText = this.getProgressText(task.progress);
    const priorityText = this.getPriorityText(task.priority);
    const statusText = this.getStatusText(task.status);
    const assigneeText = this.getAssigneeText(task.assignee);

    taskDiv.innerHTML = `
      <div class="task-checkbox">
        <input type="checkbox" id="${task.id}" ${
      task.status === "done" ? "checked" : ""
    }>
        <label for="${task.id}"></label>
      </div>
      <div class="task-content">
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <div class="task-meta">
          <span class="task-priority ${task.priority}">${priorityText}</span>
          <span class="task-status ${task.status}">${statusText}</span>
          <span class="task-due">期限: ${Utils.formatDate(task.dueDate)}</span>
          <span class="task-assignee">担当: ${assigneeText}</span>
          <span class="task-category">分類: ${task.category}</span>
          <span class="task-progress">進捗: ${progressText}</span>
        </div>
      </div>
      <div class="task-actions">
        <button type="button" class="task-btn edit-task-btn" data-id="${
          task.id
        }">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="task-btn delete-task-btn" data-id="${
          task.id
        }">
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
    const assignee = this.settings.users.find((u) => u.value === assigneeValue);
    return assignee ? assignee.label : assigneeValue;
  }
}
