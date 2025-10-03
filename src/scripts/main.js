// main.js - メインアプリケーション制御
import { TaskManager } from './task-manager.js';
import { CalendarManager } from './calendar-manager.js';
import { GanttManager } from './gantt-manager.js';
import { SidebarManager } from './sidebar.js';
import { Utils } from './utils.js';
import { SimpleAuth } from './simple-auth.js';
import { SettingsManager } from './settings-manager.js';
import { ProjectManager } from './project-manager.js';

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    Utils.debugLog('アプリケーション初期化開始');

    // ログインページかチェック
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    Utils.debugLog('Current path:', currentPath, 'Is login page:', isLoginPage);
    
    // ログインページ以外で認証チェック
    if (!isLoginPage) {
      // SimpleAuthを使った簡単な認証チェック
      if (!SimpleAuth.isLoggedIn()) {
        Utils.debugLog('認証データがありません。ログインページにリダイレクト');
        SimpleAuth.requireAuth();
        return;
      }
      
      Utils.debugLog('認証OK。アプリケーション初期化を継続');
    }

    // サイドバー管理（ログインページ以外）
    if (!isLoginPage) {
      try {
        if (typeof SidebarManager === 'undefined') {
          console.warn('SidebarManager が見つかりません - スキップします');
        } else {
          window.sidebarManager = new SidebarManager();
          Utils.debugLog('サイドバー管理初期化完了');
        }
      } catch (sidebarError) {
        console.error('サイドバー管理初期化エラー:', sidebarError.message);
      }

      await ProjectManager.getCurrentProjectSettings();
      // 現在のページに応じて適切なマネージャーを初期化
      const currentPage = getCurrentPage();
      Utils.debugLog('現在のページ:', currentPage);

      await initializePageManager(currentPage);
      
      // 共通機能の初期化
      initializeCommonFeatures();
    } else {
      Utils.debugLog('ログインページのため、他の初期化をスキップ');
    }
    
    Utils.debugLog('アプリケーション初期化完了');
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error.message);
    
    // 簡易通知表示
    const notification = document.createElement('div');
    notification.textContent = 'アプリケーションの初期化に失敗しました: ' + error.message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
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
        Utils.debugLog('タスク管理を初期化中...');
        if (typeof TaskManager !== 'undefined') {
          window.taskManager = new TaskManager();
        } else {
          console.warn('TaskManager が見つかりません');
        }
        break;
        
      case 'calendar':
        Utils.debugLog('カレンダー管理を初期化中...');
        if (typeof CalendarManager !== 'undefined') {
          window.calendarManager = new CalendarManager();
        } else {
          console.warn('CalendarManager が見つかりません');
        }
        break;
        
      case 'gantt':
        Utils.debugLog('ガントチャート管理を初期化中...');
        if (typeof GanttManager !== 'undefined') {
          window.ganttManager = new GanttManager();
        } else {
          console.warn('GanttManager が見つかりません');
        }
        break;
        
      case 'settings':
        Utils.debugLog('設定管理を初期化中...');
        if (typeof SettingsManager !== 'undefined') {
          window.settingsManager = new SettingsManager();
        } else {
          console.warn('SettingsManager が見つかりません');
        }
        break;
        
      case 'dashboard':
      default:
        Utils.debugLog('ダッシュボードを初期化中...');
        await initializeDashboard();
        break;
    }
    Utils.debugLog(`${page}ページの初期化完了`);
  } catch (error) {
    console.error(`${page}ページの初期化エラー:`, error.message);
    // エラーが発生してもアプリケーションを停止させない
  }
}

async function initializeDashboard() {
  try {
    // ダッシュボード用の軽量な初期化
    const tasks = Utils ? Utils.getFromStorage('tasks', []) : [];
    
    // 統計情報を表示
    updateDashboardStats(tasks);
    
    // 最近のタスクを表示
    displayRecentTasks(tasks);
  } catch (error) {
    console.error('ダッシュボード初期化エラー:', error);
  }
}

function updateDashboardStats(tasks) {
  try {
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
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    });
  } catch (error) {
    console.error('ダッシュボード統計更新エラー:', error);
  }
}

function displayRecentTasks(tasks) {
  try {
    const recentTasksContainer = document.querySelector('#recentTasks');
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
          <h4>${task.title || 'タイトルなし'}</h4>
          <p>${task.assignee || '未割り当て'} - ${task.category || 'カテゴリなし'}</p>
        </div>
        <div class="task-status ${task.status || 'todo'}">${getStatusText(task.status)}</div>
      `;
      recentTasksContainer.appendChild(taskElement);
    });
  } catch (error) {
    console.error('最近のタスク表示エラー:', error);
  }
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
  try {
    // 通知コンテナの作成
    if (!document.querySelector('#notification-container')) {
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
  } catch (error) {
    console.error('通知システム初期化エラー:', error);
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl + N: 新しいタスク作成
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      if (window.taskManager) {
        const addBtn = document.querySelector('#addTaskBtn');
        if (addBtn) addBtn.click();
      }
    }
    
    // Ctrl + S: 設定保存
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (window.settingsManager && typeof window.settingsManager.saveAllSettings === 'function') {
        window.settingsManager.saveAllSettings();
      }
    }
  });
}

function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
      Utils.showNotification('予期しないエラーが発生しました', 'error');
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
      Utils.showNotification('処理中にエラーが発生しました', 'error');
    }
  });
}

// デバッグ用の関数
window.debugInfo = () => {
  try {
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
        tasks: Utils ? (Utils.getFromStorage('tasks', []).length || 0) : 'Utils not available',
        settings: Utils ? !!Utils.getFromStorage('appSettings') : 'Utils not available'
      },
      auth: {
        manager: typeof SimpleAuth !== 'undefined',
        user: SimpleAuth.getCurrentUser()?.displayName || 'Not available'
      }
    };
  } catch (error) {
    return { error: error.message };
  }
};