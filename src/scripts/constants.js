// アプリケーション定数定義
// 平打ち定数を一元管理し、保守性を向上

// タスク進捗率の設定
export const TASK_PROGRESS_CONFIG = {
  MIN: 0,           // 最小値
  MAX: 100,         // 最大値
  STEP: 10          // 刻み幅（10%刻み）
};

// タスク進捗率の定義（よく使う値に名前を付ける）
export const TASK_PROGRESS = {
  NOT_STARTED: TASK_PROGRESS_CONFIG.MIN,
  COMPLETED: TASK_PROGRESS_CONFIG.MAX
};

/**
 * 進捗率の選択肢を動的に生成
 * TASK_PROGRESS_CONFIG.STEP の値に応じて自動的に選択肢が変わる
 */
export function generateProgressOptions() {
  const options = [];
  for (let i = TASK_PROGRESS_CONFIG.MIN; i <= TASK_PROGRESS_CONFIG.MAX; i += TASK_PROGRESS_CONFIG.STEP) {
    options.push({
      value: i,
      label: `${i}%`
    });
  }
  return options;
}

// タスク進捗率の選択肢（フォーム用）
// この配列は generateProgressOptions() で動的に生成された結果
export const TASK_PROGRESS_OPTIONS = generateProgressOptions();

// タスク優先度の定義
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// タスク優先度の表示情報
export const TASK_PRIORITY_CONFIG = {
  [TASK_PRIORITY.LOW]: { label: '低優先度', color: '#2e7d32' },
  [TASK_PRIORITY.MEDIUM]: { label: '中優先度', color: '#ef6c00' },
  [TASK_PRIORITY.HIGH]: { label: '高優先度', color: '#c62828' }
};

// タスクステータスの定義
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done'
};

// タスクステータスの表示情報
export const TASK_STATUS_CONFIG = {
  [TASK_STATUS.TODO]: { label: '未着手', color: '#666' },
  [TASK_STATUS.IN_PROGRESS]: { label: '進行中', color: '#1976d2' },
  [TASK_STATUS.REVIEW]: { label: 'レビュー中', color: '#f57c00' },
  [TASK_STATUS.DONE]: { label: '完了', color: '#388e3c' }
};

// ユーザーロールの定義
export const USER_ROLE = {
  SYSTEM_ADMIN: 'system_admin',
  USER: 'user'
};

// ユーザーロールの表示情報
export const USER_ROLE_CONFIG = {
  [USER_ROLE.SYSTEM_ADMIN]: { label: 'システム管理者', icon: 'fa-user-shield' },
  [USER_ROLE.PROJECT_ADMIN]: { label: 'プロジェクト管理者', icon: 'fa-user-tie' },
  [USER_ROLE.MEMBER]: { label: 'メンバー', icon: 'fa-user' },
  [USER_ROLE.USER]: { label: 'ユーザー', icon: 'fa-user' }
};

// デフォルトカテゴリ
export const DEFAULT_CATEGORIES = [
  '企画',
  '開発',
  'デザイン',
  'テスト',
  'ドキュメント',
  '会議',
  'その他'
];

// 通知タイプ
export const NOTIFICATION_TYPE = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
};

// 通知タイプの色設定
export const NOTIFICATION_COLORS = {
  [NOTIFICATION_TYPE.SUCCESS]: '#28a745',
  [NOTIFICATION_TYPE.WARNING]: '#ffc107',
  [NOTIFICATION_TYPE.ERROR]: '#dc3545',
  [NOTIFICATION_TYPE.INFO]: '#007bff'
};

// ローカルストレージキー
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  TASKS: 'tasks',
  SETTINGS: 'appSettings',
  SIDEBAR_VISIBLE: 'sidebarVisible',
  USER_PERSONAL_SETTINGS: 'userPersonalSettings'
};

// APIエンドポイント
export const API_ENDPOINTS = {
  // 認証
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  LOGOUT: '/api/logout',
  VERIFY_TOKEN: '/api/verify-token',
  REFRESH: '/api/refresh',
  VALIDATE_TOKEN: '/api/validate-token',

  // ユーザー
  USER: '/api/user',
  USER_PROFILE: '/api/user/profile',
  USER_PASSWORD: '/api/user/password',
  USER_SETTINGS: '/api/user/settings',

  // タスク
  TASKS: '/api/tasks',

  // 設定
  SETTINGS: '/api/settings',

  // バックアップ
  BACKUP: '/api/backup',

  // 管理者
  ADMIN_USERS: '/api/admin/users',
  ADMIN_PROJECTS: '/api/admin/projects',
  ADMIN_SYSTEM_SETTINGS: '/api/admin/system-settings',
  ADMIN_BACKUP: '/api/admin/backup',
  ADMIN_BACKUP_DATA: '/api/admin/backup/download/data',
  ADMIN_BACKUP_SETTINGS: '/api/admin/backup/download/settings',
  ADMIN_RESTORE: '/api/admin/restore',

  // その他
  USERS: '/api/users'
};

// JWT設定
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '1h',
  REFRESH_TOKEN_EXPIRY_REMEMBER: '30d',
  REFRESH_TOKEN_EXPIRY_DEFAULT: '7d'
};

// バリデーション設定
export const VALIDATION = {
  LOGIN_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_-]+$/
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

// レート制限設定
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15分
  AUTH_MAX: 5,               // 認証エンドポイント
  GENERAL_MAX: 100           // 一般エンドポイント
};

// ページ識別子
export const PAGE_IDS = {
  DASHBOARD: 'dashboard',
  TASK: 'task',
  CALENDAR: 'calendar',
  GANTT: 'gantt',
  SETTINGS: 'settings',
  ADMIN: 'admin',
  USER_PROFILE: 'user-profile',
  LOGIN: 'login',
  REGISTER: 'register'
};

// デフォルトプロジェクトID
export const DEFAULT_PROJECT_ID = 'default';

// テーマ設定
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// 言語設定
export const LANGUAGES = {
  JA: 'ja',
  EN: 'en'
};

// ガントチャートのタイムスケール
export const GANTT_TIME_SCALES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};

// カレンダービューモード
export const CALENDAR_VIEW_MODES = {
  MONTH: 'month',
  WEEK: 'week'
};
