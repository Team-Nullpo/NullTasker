import { Utils } from './utils.js';
import { ProjectManager } from './project-manager.js';
import { TicketManager } from './ticket-manager.js';
import { SimpleAuth } from './simple-auth.js';

// ホーム画面管理クラス
export class HomeManager {
  constructor() {
    this.tasks = [];
    this.projectId = null;
    this.init();
  }

  init() {
    if (!Utils.getElement('.dashboard-stats')) {
      return; // ホームページではない
    }

    this.loadData();
    this.setupEventListeners();
    this.renderDashboard();
  }

  loadData() {
    this.projectId = ProjectManager.getCurrentProjectId();
    this.tasks = TicketManager.tasks.filter(
      (ticket) => ticket.project === this.projectId
    );
  }

  setupEventListeners() {
    const quickAddBtn = Utils.getElement('#quickAddTask');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => {
        window.location.href = 'task.html';
      });
    }
  }

  renderDashboard() {
    this.updateWelcomeText();
    this.updateStats();
    this.renderTodayTasks();
    this.renderUpcomingTasks();
    this.renderProgressWidget();
    this.renderRecentActivity();
  }

  updateWelcomeText() {
    const welcomeText = Utils.getElement('#welcomeText');
    if (welcomeText) {
      const userData = SimpleAuth.getUserData();
      const username = userData?.username || 'ゲスト';
      const hour = new Date().getHours();
      let greeting = 'こんにちは';

      if (hour < 12) {
        greeting = 'おはようございます';
      } else if (hour < 18) {
        greeting = 'こんにちは';
      } else {
        greeting = 'こんばんは';
      }

      welcomeText.textContent = `${greeting}、${username}さん`;
    }
  }

  updateStats() {
    const total = this.tasks.length;
    const inProgress = this.tasks.filter(t => t.status === 'in_progress').length;
    const completed = this.tasks.filter(t => t.status === 'done').length;
    const overdue = this.tasks.filter(t => {
      if (t.status === 'done') return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    this.setElementText('#totalTasksHome', total);
    this.setElementText('#inProgressHome', inProgress);
    this.setElementText('#completedHome', completed);
    this.setElementText('#overdueHome', overdue);
  }

  renderTodayTasks() {
    const container = Utils.getElement('#todayTasks');
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = this.tasks.filter(task => {
      if (task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    }).slice(0, 5);

    if (todayTasks.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>今日のタスクはありません</p></div>';
      return;
    }

    container.innerHTML = todayTasks.map(task => this.createTaskCard(task)).join('');
  }

  renderUpcomingTasks() {
    const container = Utils.getElement('#upcomingTasks');
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingTasks = this.tasks.filter(task => {
      if (task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today && dueDate <= nextWeek;
    })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    if (upcomingTasks.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-check"></i><p>期限が近いタスクはありません</p></div>';
      return;
    }

    container.innerHTML = upcomingTasks.map(task => this.createTaskCard(task)).join('');
  }

  createTaskCard(task) {
    const priorityClass = task.priority || 'low';
    const priorityText = this.getPriorityText(task.priority);
    const dueDate = Utils.formatDate(task.dueDate);

    return `
      <div class="task-card" onclick="window.location.href='task.html'">
        <div class="task-card-icon">
          <i class="fas fa-tasks"></i>
        </div>
        <div class="task-card-content">
          <div class="task-card-title">${task.title}</div>
          <div class="task-card-meta">
            <span class="task-card-priority ${priorityClass}">${priorityText}</span>
            <span><i class="fas fa-calendar"></i> ${dueDate}</span>
          </div>
        </div>
      </div>
    `;
  }

  getPriorityText(priority) {
    const map = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return map[priority] || '低';
  }

  renderProgressWidget() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'done').length;
    const inProgress = this.tasks.filter(t => t.status === 'in_progress').length;
    const todo = this.tasks.filter(t => t.status === 'todo').length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 円形プログレスバーの更新
    const progressFill = Utils.getElement('#progressFill');
    if (progressFill) {
      const circumference = 283; // 2 * Math.PI * 45
      const offset = circumference - (percentage / 100) * circumference;
      progressFill.style.strokeDashoffset = offset;
    }

    // グラデーション定義を追加（まだない場合）
    const svg = document.querySelector('.progress-circle svg');
    if (svg && !svg.querySelector('#progressGradient')) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', 'progressGradient');
      gradient.innerHTML = `
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      `;
      defs.appendChild(gradient);
      svg.insertBefore(defs, svg.firstChild);
    }

    this.setElementText('#progressPercentage', `${percentage}%`);
    this.setElementText('#completedCount', completed);
    this.setElementText('#inProgressCount', inProgress);
    this.setElementText('#todoCount', todo);
  }

  renderRecentActivity() {
    const container = Utils.getElement('#recentActivity');
    if (!container) return;

    // 最近更新されたタスクを取得（仮想的なアクティビティ）
    const recentTasks = this.tasks
      .filter(t => t.status === 'done' || t.status === 'in_progress')
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
      .slice(0, 5);

    if (recentTasks.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>最近のアクティビティはありません</p></div>';
      return;
    }

    container.innerHTML = recentTasks.map(task => {
      const timeAgo = this.getTimeAgo(task.dueDate);
      const icon = task.status === 'done' ? 'check' : 'hourglass-half';
      const statusText = task.status === 'done' ? '完了' : '進行中';

      return `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="fas fa-${icon}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-text">
              <strong>${task.title}</strong> を${statusText}にしました
            </div>
            <div class="activity-time">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今日';
    if (days === 1) return '昨日';
    if (days < 7) return `${days}日前`;
    if (days < 30) return `${Math.floor(days / 7)}週間前`;
    return `${Math.floor(days / 30)}ヶ月前`;
  }

  setElementText(selector, text) {
    const element = Utils.getElement(selector);
    if (element) {
      element.textContent = text;
    }
  }
}
