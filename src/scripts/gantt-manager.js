import { Utils } from "./utils.js";
import { ProjectManager } from "./project-manager.js";
import { TicketManager } from "./ticket-manager.js";

// ガントチャート管理クラス
export class GanttManager {
  constructor() {
    this.tasks = [];
    this.currentDate = new Date();
    this.timeScale = "week";
    this.isExpanded = false;
    this.init();
  }

  init() {
    if (Utils.getElement(".gantt-container")) {
      this.loadTasks();
      this.setupEventListeners();
      this.renderGantt();
    }
  }

  loadTasks() {
    this.tasks = TicketManager.tasks.filter(
      (ticket) => ticket.project === ProjectManager.currentProject
    );
  }

  setupEventListeners() {
    const elements = {
      timeScaleSelect: Utils.getElement("#timeScale"),
      prevBtn: Utils.getElement("#prevPeriod"),
      nextBtn: Utils.getElement("#nextPeriod"),
      taskDetailModal: Utils.getElement("#taskDetailModal"),
      closeTaskDetailBtn: Utils.getElement("#closeTaskDetail"),
    };

    if (elements.timeScaleSelect) {
      elements.timeScaleSelect.addEventListener("change", (e) => {
        this.timeScale = e.target.value;
        this.renderGantt();
      });
    }

    if (elements.prevBtn) {
      elements.prevBtn.addEventListener("click", () => this.navigatePeriod(-1));
    }

    if (elements.nextBtn) {
      elements.nextBtn.addEventListener("click", () => this.navigatePeriod(1));
    }

    this.setupModalEvents(elements);
  }

  setupModalEvents({ taskDetailModal, closeTaskDetailBtn }) {
    if (closeTaskDetailBtn) {
      closeTaskDetailBtn.addEventListener("click", () => {
        if (taskDetailModal) taskDetailModal.style.display = "none";
      });
    }

    if (taskDetailModal) {
      taskDetailModal.addEventListener("click", (e) => {
        if (e.target === taskDetailModal) {
          taskDetailModal.style.display = "none";
        }
      });
    }
  }

  navigatePeriod(direction) {
    const adjustments = {
      month: { method: "setMonth", amount: 1 },
      week: { method: "setDate", amount: 7 },
      day: { method: "setDate", amount: 1 },
    };

    const { method, amount } = adjustments[this.timeScale] || adjustments.day;
    const currentValue = this.currentDate[method.replace("set", "get")]();
    this.currentDate[method](currentValue + amount * direction);

    this.renderGantt();
  }

  renderGantt() {
    this.updatePeriodDisplay();
    this.renderTimeline();
    this.renderTaskList();
    this.renderGanttBars();
  }

  updatePeriodDisplay() {
    const periodElement = Utils.getElement("#currentPeriod");
    if (!periodElement) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    const date = this.currentDate.getDate();

    let displayText;
    switch (this.timeScale) {
      case "month":
        displayText = `${year}年${month}月`;
        break;
      case "week":
        const weekStart = new Date(this.currentDate);
        weekStart.setDate(date - this.currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        displayText = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${
          weekEnd.getMonth() + 1
        }/${weekEnd.getDate()}`;
        break;
      default:
        displayText = `${year}年${month}月${date}日`;
    }

    periodElement.textContent = displayText;
  }

  renderTimeline() {
    const header = Utils.getElement("#ganttTimelineHeader");
    if (!header) return;

    header.innerHTML = "";
    const dates = this.getTimelineDates();

    dates.forEach((date) => {
      const cell = document.createElement("div");
      cell.className = "gantt-date-cell";
      cell.textContent = this.formatTimelineDate(date);
      header.appendChild(cell);
    });
  }

  getTimelineDates() {
    const dates = [];
    const startDate = new Date(this.currentDate);

    switch (this.timeScale) {
      case "month":
        startDate.setDate(1);
        const daysInMonth = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0
        ).getDate();
        for (let i = 0; i < daysInMonth; i++) {
          const date = new Date(startDate);
          date.setDate(i + 1);
          dates.push(date);
        }
        break;
      case "week":
        startDate.setDate(
          this.currentDate.getDate() - this.currentDate.getDay()
        );
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          dates.push(date);
        }
        break;
      default:
        for (let i = -3; i <= 3; i++) {
          const date = new Date(this.currentDate);
          date.setDate(this.currentDate.getDate() + i);
          dates.push(date);
        }
    }

    return dates;
  }

  formatTimelineDate(date) {
    switch (this.timeScale) {
      case "month":
        return date.getDate();
      case "week":
        const days = ["日", "月", "火", "水", "木", "金", "土"];
        return `${date.getDate()} (${days[date.getDay()]})`;
      default:
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  renderTaskList() {
    const taskRows = Utils.getElement("#ganttTaskRows");
    if (!taskRows) return;

    taskRows.innerHTML = "";
    this.tasks.forEach((task) => {
      const row = this.createTaskRow(task);
      taskRows.appendChild(row);
    });
  }

  createTaskRow(task) {
    const row = document.createElement("div");
    row.className = "gantt-task-row";
    row.dataset.taskId = task.id;

    const columns = [
      { className: "task-name-column", content: task.title, title: task.title },
      { className: "task-assignee-column", content: task.assignee },
      {
        className: "task-duration-column",
        content: this.calculateDuration(task),
      },
    ];

    columns.forEach(({ className, content, title }) => {
      const col = document.createElement("div");
      col.className = className;
      col.textContent = content;
      if (title) col.title = title;
      row.appendChild(col);
    });

    row.addEventListener("click", () => this.showTaskDetail(task));
    return row;
  }

  renderGanttBars() {
    const timelineBody = Utils.getElement("#ganttTimelineBody");
    if (!timelineBody) return;

    timelineBody.innerHTML = "";
    const dates = this.getTimelineDates();
    const cellWidth = 60;

    this.tasks.forEach((task) => {
      const row = this.createGanttBarRow(task, dates, cellWidth);
      timelineBody.appendChild(row);
    });
  }

  createGanttBarRow(task, dates, cellWidth) {
    const row = document.createElement("div");
    row.className = "gantt-bar-row";

    const startDate = new Date(task.startDate || task.createdAt);
    const endDate = new Date(task.dueDate);
    const startIndex = this.findDateIndex(dates, startDate);
    const endIndex = this.findDateIndex(dates, endDate);

    if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
      const barContainer = this.createGanttBar(
        task,
        startIndex,
        endIndex,
        cellWidth
      );
      row.appendChild(barContainer);
    }

    return row;
  }

  createGanttBar(task, startIndex, endIndex, cellWidth) {
    const barContainer = document.createElement("div");
    barContainer.className = "gantt-bar-container";

    Object.assign(barContainer.style, {
      position: "absolute",
      left: `${startIndex * cellWidth}px`,
      width: `${(endIndex - startIndex + 1) * cellWidth - 4}px`,
      height: "20px",
      top: "10px",
    });

    const bar = this.createBarElement(task);
    barContainer.appendChild(bar);

    this.setupBarEvents(barContainer, task);
    return barContainer;
  }

  createBarElement(task) {
    const bar = document.createElement("div");
    bar.className = `gantt-bar ${task.priority}`;
    if (task.status === "done") bar.classList.add("completed");

    Object.assign(bar.style, {
      width: "100%",
      height: "100%",
      position: "relative",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      padding: "0 8px",
      boxSizing: "border-box",
    });

    // 進捗バー
    if (task.progress > 0) {
      const progressBar = document.createElement("div");
      progressBar.className = "gantt-progress-bar";
      Object.assign(progressBar.style, {
        position: "absolute",
        left: "0",
        top: "0",
        height: "100%",
        width: `${task.progress}%`,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: "10px",
        transition: "width 0.3s ease",
      });
      bar.appendChild(progressBar);
    }

    // タスクタイトル
    const titleSpan = document.createElement("span");
    titleSpan.textContent = task.title;
    Object.assign(titleSpan.style, {
      position: "relative",
      zIndex: "2",
      fontSize: "11px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      color: task.priority === "medium" ? "#212529" : "white",
    });
    bar.appendChild(titleSpan);

    return bar;
  }

  setupBarEvents(barContainer, task) {
    const startDate = new Date(task.startDate || task.createdAt);
    const endDate = new Date(task.dueDate);

    barContainer.title = `${task.title} - ${
      task.assignee
    }\n開始日: ${Utils.formatDate(startDate)}\n期日: ${Utils.formatDate(
      endDate
    )}\n進捗: ${task.progress}%`;

    barContainer.addEventListener("click", () => this.showTaskDetail(task));

    barContainer.addEventListener("mouseenter", () => {
      Object.assign(barContainer.style, {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        zIndex: "10",
      });
    });

    barContainer.addEventListener("mouseleave", () => {
      Object.assign(barContainer.style, {
        transform: "translateY(0)",
        boxShadow: "none",
        zIndex: "1",
      });
    });
  }

  findDateIndex(dates, targetDate) {
    return dates.findIndex((date) => Utils.isSameDate(date, targetDate));
  }

  calculateDuration(task) {
    const created = new Date(task.createdAt);
    const due = new Date(task.dueDate);
    const days = Math.ceil((due - created) / (1000 * 60 * 60 * 24));
    return `${days}日`;
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
    return `
      <div class="task-detail-info">
        <h3>${task.title}</h3>
        <p><strong>説明:</strong> ${task.description || "なし"}</p>
        <p><strong>担当者:</strong> ${task.assignee}</p>
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

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const chart = Utils.getElement(".gantt-chart");
    if (chart) {
      chart.style.height = this.isExpanded ? "600px" : "400px";
    }
  }

  exportGantt() {
    const data = {
      tasks: this.tasks,
      period: this.currentDate.toISOString(),
      timeScale: this.timeScale,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gantt-chart-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const ganttFunctions = {
  toggleExpand: () => window.ganttManager?.toggleExpand(),
  exportGantt: () => window.ganttManager?.exportGantt(),
};
