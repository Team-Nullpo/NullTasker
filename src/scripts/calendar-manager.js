import { Utils } from "./utils.js";
import { ProjectManager } from "./project-manager.js";
import { TicketManager } from "./ticket-manager.js";
import { SimpleAuth } from "./simple-auth.js";

// カレンダー管理クラス
export class CalendarManager {
  constructor() {
    this.tasks = [];
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.viewMode = "month";
    this.projectId = null;
    this.init();
  }

  init() {
    if (Utils.getElement(".calendar-container")) {
      this.loadTasks();
      this.setupEventListeners();
      this.renderCalendar();
      this.updateSelectedDate();
    }
  }

  loadTasks() {
    this.projectId = ProjectManager.getCurrentProjectId();
    this.tasks = TicketManager.tasks.filter(
      (ticket) => ticket.project === this.projectId
    );
  }

  setupEventListeners() {
    const elements = {
      prevBtn: Utils.getElement("#prevMonth"),
      nextBtn: Utils.getElement("#nextMonth"),
      todayBtn: Utils.getElement("#todayBtn"),
      quickInput: Utils.getElement("#quickTaskInput"), // 修正: HTMLのIDに合わせる
      quickAddBtn: Utils.getElement("#quickAddBtn"), // 修正: HTMLのIDに合わせる
      addEventBtn: Utils.getElement("#addEventBtn"),
      dailyTaskList: Utils.getElement("#dailyTaskList"), // 追加
    };

    Utils.debugLog("カレンダー要素:", {
      prevBtn: !!elements.prevBtn,
      nextBtn: !!elements.nextBtn,
      quickInput: !!elements.quickInput,
      quickAddBtn: !!elements.quickAddBtn,
    });

    if (elements.prevBtn) {
      elements.prevBtn.addEventListener("click", () => this.navigateMonth(-1));
    }

    if (elements.nextBtn) {
      elements.nextBtn.addEventListener("click", () => this.navigateMonth(1));
    }

    if (elements.todayBtn) {
      elements.todayBtn.addEventListener("click", () => this.goToToday());
    }

    // クイック追加ボタンのイベント
    if (elements.quickAddBtn) {
      elements.quickAddBtn.addEventListener("click", () => this.quickAddTask());
    }

    // クイック追加入力欄でのエンターキー
    if (elements.quickInput) {
      elements.quickInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.quickAddTask();
        }
      });
    }

    // イベント追加ボタン
    if (elements.addEventBtn) {
      elements.addEventBtn.addEventListener("click", () => {
        // タスク追加モーダルを開く（存在する場合）
        const taskModal = Utils.getElement("#taskModal");
        if (taskModal) {
          taskModal.style.display = "block";
        } else {
          Utils.showNotification(
            "タスク追加機能は、タスクページで利用できます。",
            "info"
          );
        }
      });
    }
  }

  navigateMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.renderCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.renderCalendar();
    this.updateSelectedDate();
  }

  renderCalendar() {
    this.updateMonthDisplay();
    this.renderCalendarDays();
  }

  updateMonthDisplay() {
    const monthElement = Utils.getElement("#currentMonth");
    if (monthElement) {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth() + 1;
      monthElement.textContent = `${year}年 ${month}月`;
    }
  }

  renderCalendarDays() {
    const daysContainer = Utils.getElement("#calendarDays");
    if (!daysContainer) return;

    daysContainer.innerHTML = "";

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
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
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";

    // 日付の分類
    this.addDateClasses(dayDiv, date, currentMonth);

    // 日付番号
    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = date.getDate();
    dayDiv.appendChild(dayNumber);

    // タスク表示エリア
    const tasksDiv = this.createTasksDiv(date);
    dayDiv.appendChild(tasksDiv);

    // 日付クリックイベント
    dayDiv.addEventListener("click", () => this.selectDate(date));

    return dayDiv;
  }

  addDateClasses(dayDiv, date, currentMonth) {
    if (date.getMonth() !== currentMonth) {
      dayDiv.classList.add("other-month");
    }

    if (Utils.isToday(date)) {
      dayDiv.classList.add("today");
    }

    if (Utils.isSameDate(date, this.selectedDate)) {
      dayDiv.classList.add("selected");
    }
  }

  createTasksDiv(date) {
    const tasksDiv = document.createElement("div");
    tasksDiv.className = "day-tasks";

    const dayTasks = this.getTasksForDate(date);
    dayTasks.forEach((task) => {
      const taskElement = this.createTaskElement(task);
      tasksDiv.appendChild(taskElement);
    });

    return tasksDiv;
  }

  createTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = `calendar-task ${task.priority}`;
    if (task.status === "done") {
      taskElement.classList.add("completed");
    }
    taskElement.textContent = task.title;
    const assigneeName = this.getAssigneeDisplayName(task);
    taskElement.title = `${task.title} - ${assigneeName}`;

    taskElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showTaskDetail(task);
    });

    return taskElement;
  }

  getTasksForDate(date) {
    return this.tasks.filter((task) => {
      const taskStartDate = new Date(task.startDate || task.createdAt);
      const taskEndDate = new Date(task.dueDate);

      // 指定された日付がタスクの期間内にあるかチェック
      return date >= taskStartDate && date <= taskEndDate;
    });
  }

  selectDate(date) {
    this.selectedDate = new Date(date);
    this.renderCalendar();
    this.updateSelectedDate();
    this.renderDailyTasks();
  }

  updateSelectedDate() {
    const selectedDateElement = Utils.getElement("#selectedDate");
    if (selectedDateElement) {
      selectedDateElement.textContent =
        this.selectedDate.toLocaleDateString("ja-JP");
    }
  }

  renderDailyTasks() {
    const dailyTasksContainer = Utils.getElement("#dailyTaskList"); // 修正: HTMLのIDに合わせる
    if (!dailyTasksContainer) return;

    dailyTasksContainer.innerHTML = "";
    const tasks = this.getTasksForDate(this.selectedDate);

    if (tasks.length === 0) {
      dailyTasksContainer.innerHTML = "<p>この日にタスクはありません。</p>";
      return;
    }

    tasks.forEach((task) => {
      const taskElement = this.createDailyTaskElement(task);
      dailyTasksContainer.appendChild(taskElement);
    });
  }

  createDailyTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = "daily-task";
    
    const assigneeName = this.getAssigneeDisplayName(task);

    taskElement.innerHTML = `
      <div class="task-info">
        <div class="task-title">${task.title}</div>
        <div class="task-meta">${assigneeName} - ${task.category}</div>
      </div>
      <div class="task-priority-badge ${task.priority}">
        ${this.getPriorityText(task.priority)}
      </div>
    `;

    taskElement.addEventListener("click", () => this.showTaskDetail(task));
    return taskElement;
  }

  async quickAddTask() {
    const titleInput = Utils.getElement("#quickTaskInput"); // 修正: HTMLのIDに合わせる
    if (!titleInput || !titleInput.value.trim()) return;

    const payload = {
      title: titleInput.value.trim(),
      description: "Added from Calendar",
      assignee: SimpleAuth.getCurrentUser().id,
      startDate: this.selectedDate.toISOString().split("T")[0], // 開始日も設定
      dueDate: this.selectedDate.toISOString().split("T")[0],
      priority: "medium",
      category: "その他",
      status: "todo",
      progress: 0,
      project: this.projectId
    };

    if (!(await TicketManager.createTicket(payload))) {
      Utils.showNotification("タスク追加に失敗しました", "error");
      return;
    }
    titleInput.value = "";
    this.renderCalendar();
    this.renderDailyTasks();

    Utils.showNotification("タスクが追加されました", "success");
  }

  saveTasks() {
    Utils.saveToStorage("tasks", this.tasks);
  }

  showTaskDetail(task) {
    const modal = Utils.getElement("#taskDetailModal");
    const content = Utils.getElement("#taskDetailContent");

    if (modal && content) {
      content.innerHTML = this.createTaskDetailHTML(task);
      modal.style.display = "block";
    }
  }

  createTaskDetailHTML(task) {
    const assigneeName = this.getAssigneeDisplayName(task);
    
    return `
      <div class="task-detail-info">
        <h3>${task.title}</h3>
        <p><strong>説明:</strong> ${task.description || "なし"}</p>
        <p><strong>担当者:</strong> ${assigneeName}</p>
        <p><strong>期限:</strong> ${Utils.formatDate(task.dueDate)}</p>
        <p><strong>優先度:</strong> ${this.getPriorityText(task.priority)}</p>
        <p><strong>ステータス:</strong> ${this.getStatusText(task.status)}</p>
        <p><strong>進捗:</strong> ${task.progress}%</p>
        <p><strong>分類:</strong> ${task.category}</p>
      </div>
    `;
  }

  getPriorityText(priority) {
    const map = { high: "高優先度", medium: "中優先度", low: "低優先度" };
    return map[priority] || "中優先度";
  }

  getStatusText(status) {
    const map = {
      todo: "未着手",
      in_progress: "進行中",
      review: "レビュー中",
      done: "完了",
    };
    return map[status] || "未着手";
  }

  // タスクオブジェクトから担当者名を取得（assigneeInfo対応）
  getAssigneeDisplayName(task) {
    // サーバーから返されたassigneeInfo情報を優先的に使用
    if (task.assigneeInfo?.name) {
      return task.assigneeInfo.name;
    }
    
    // フォールバック: assigneeをそのまま表示（IDまたは名前）
    if (task.assignee) {
      return task.assignee;
    }
    
    return "未割り当て";
  }

  toggleView() {
    const monthView = Utils.getElement("#monthView");
    const weekView = Utils.getElement("#weekView");

    if (this.viewMode === "month") {
      this.viewMode = "week";
      if (monthView) monthView.style.display = "none";
      if (weekView) weekView.style.display = "block";
    } else {
      this.viewMode = "month";
      if (monthView) monthView.style.display = "block";
      if (weekView) weekView.style.display = "none";
    }
  }
}

export const calendarFunctions = {
  toggleCalendarView: () => window.calendarManager?.toggleView(),
};
