// main.js - メインアプリケーション制御
import { TaskManager } from './task-manager.js';
import { CalendarManager } from './calendar-manager.js';
import { GanttManager } from './gantt-manager.js';
import { SettingsManager } from './settings-manager.js';
import { SidebarManager } from './sidebar.js';
import { Utils } from './utils.js';

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('アプリケーション初期化開始');

    // サイドバー管理（全ページ共通）
    window.sidebarManager = new SidebarManager();

    // 現在のページに応じて適切なマネージャーを初期化
    const currentPage = getCurrentPage();
    console.log('現在のページ:', currentPage);

    await initializePageManager(currentPage);
    
    // 共通機能の初期化
    initializeCommonFeatures();
    
    console.log('アプリケーション初期化完了');
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
    Utils.showNotification('アプリケーションの初期化に失敗しました', 'error');
  }
});

function getCurrentPage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  
  if (filename.includes('task')) return 'task';
  if (filename.includes('calendar')) return 'calendar';
  if (filename.includes('gantt')) return 'gantt';
  if (filename.includes('setting')) return 'settings';
  return 'dashboard';
}

async function initializePageManager(page) {
  try {
    switch (page) {
      case 'task':
        console.log('タスク管理を初期化中...');
        window.taskManager = new TaskManager();
        break;
        
      case 'calendar':
        console.log('カレンダー管理を初期化中...');
        window.calendarManager = new CalendarManager();
        break;
        
      case 'gantt':
        console.log('ガントチャート管理を初期化中...');
        window.ganttManager = new GanttManager();
        break;
        
      case 'settings':
        console.log('設定管理を初期化中...');
        window.settingsManager = new SettingsManager();
        break;
        
      case 'dashboard':
      default:
        console.log('ダッシュボードを初期化中...');
        await initializeDashboard();
        break;
    }
  } catch (error) {
    console.error(`${page}ページの初期化エラー:`, error);
    throw error;
  }
}

async function initializeDashboard() {
  // ダッシュボード用の軽量な初期化
  const tasks = Utils.getFromStorage('tasks', []);
  
  // 統計情報を表示
  updateDashboardStats(tasks);
  
  // 最近のタスクを表示
  displayRecentTasks(tasks);
}

function updateDashboardStats(tasks) {
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length
  };

  // 統計表示の更新
  const statElements = {
    '.stat-total': stats.total,
    '.stat-todo': stats.todo,
    '.stat-progress': stats.inProgress,
    '.stat-done': stats.done
  };

  Object.entries(statElements).forEach(([selector, value]) => {
    const element = Utils.getElement(selector);
    if (element) element.textContent = value;
  });
}

function displayRecentTasks(tasks) {
  const recentTasksContainer = Utils.getElement('#recentTasks');
  if (!recentTasksContainer) return;

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  recentTasksContainer.innerHTML = '';
  
  if (recentTasks.length === 0) {
    recentTasksContainer.innerHTML = '<p>最近のタスクがありません</p>';
    return;
  }

  recentTasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'recent-task-item';
    taskElement.innerHTML = `
      <div class="task-info">
        <h4>${task.title}</h4>
        <p>${task.assignee} - ${task.category}</p>
      </div>
      <div class="task-status ${task.status}">${getStatusText(task.status)}</div>
    `;
    recentTasksContainer.appendChild(taskElement);
  });
}

function getStatusText(status) {
  const map = { 
    todo: '未着手', 
    in_progress: '進行中', 
    review: 'レビュー中', 
    done: '完了' 
  };
  return map[status] || '未着手';
}

function initializeCommonFeatures() {
  // 通知システムの初期化
  initializeNotificationSystem();
  
  // キーボードショートカットの設定
  setupKeyboardShortcuts();
  
  // エラーハンドリングの設定
  setupErrorHandling();
}

function initializeNotificationSystem() {
  // 通知コンテナの作成
  if (!Utils.getElement('#notification-container')) {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl + N: 新しいタスク作成
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      if (window.taskManager) {
        const addBtn = Utils.getElement('#addTaskBtn');
        if (addBtn) addBtn.click();
      }
    }
    
    // Ctrl + S: 設定保存
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (window.settingsManager) {
        window.settingsManager.saveAllSettings();
      }
    }
  });
}

function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
    Utils.showNotification('予期しないエラーが発生しました', 'error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
    Utils.showNotification('処理中にエラーが発生しました', 'error');
  });
}

// デバッグ用の関数
window.debugInfo = () => {
  return {
    currentPage: getCurrentPage(),
    managers: {
      task: !!window.taskManager,
      calendar: !!window.calendarManager,
      gantt: !!window.ganttManager,
      settings: !!window.settingsManager,
      sidebar: !!window.sidebarManager
    },
    storage: {
      tasks: Utils.getFromStorage('tasks', []).length,
      settings: !!Utils.getFromStorage('appSettings')
    }
  };
};