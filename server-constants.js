// サーバーサイド定数定義
// フロントエンドのconstants.jsと同期を保つ必要がある

// タスク進捗率の設定
const TASK_PROGRESS_CONFIG = {
  MIN: 0, // 最小値
  MAX: 100, // 最大値
  STEP: 10 // 刻み幅（10%刻み）
};

// タスク進捗率の定義（よく使う値に名前を付ける）
const TASK_PROGRESS = {
  NOT_STARTED: TASK_PROGRESS_CONFIG.MIN,
  COMPLETED: TASK_PROGRESS_CONFIG.MAX
};

/**
 * 進捗率の選択肢を動的に生成
 * TASK_PROGRESS_CONFIG.STEP の値に応じて自動的に選択肢が変わる
 */
function generateProgressOptions() {
  const options = [];
  for (
    let i = TASK_PROGRESS_CONFIG.MIN;
    i <= TASK_PROGRESS_CONFIG.MAX;
    i += TASK_PROGRESS_CONFIG.STEP
  ) {
    options.push({
      value: i,
      label: `${i}%`
    });
  }
  return options;
}

// タスク進捗率の選択肢（フォーム用）
const TASK_PROGRESS_OPTIONS = generateProgressOptions();

// タスク優先度の定義
const TASK_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// タスク優先度の設定
const TASK_PRIORITY_CONFIG = {
  [TASK_PRIORITY.HIGH]: { label: '高優先度', color: '#c62828' },
  [TASK_PRIORITY.MEDIUM]: { label: '中優先度', color: '#ef6c00' },
  [TASK_PRIORITY.LOW]: { label: '低優先度', color: '#2e7d32' }
};

// タスクステータスの定義
const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done'
};

// タスクステータスの設定
const TASK_STATUS_CONFIG = {
  [TASK_STATUS.TODO]: { label: '未着手', color: '#666' },
  [TASK_STATUS.IN_PROGRESS]: { label: '進行中', color: '#1976d2' },
  [TASK_STATUS.REVIEW]: { label: 'レビュー中', color: '#f57c00' },
  [TASK_STATUS.DONE]: { label: '完了', color: '#388e3c' }
};

// ユーザーロールの定義
const USER_ROLE = {
  SYSTEM_ADMIN: 'system_admin',
  USER: 'user'
};

// バリデーションルール
const VALIDATION = {
  LOGIN_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    ERROR_MESSAGE: 'ログインIDは3〜20文字の英数字、アンダースコア、ハイフンで入力してください'
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_-]+$/,
    ERROR_MESSAGE: 'パスワードは8文字以上で、大文字・小文字・数字を含む必要があります'
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ERROR_MESSAGE: '有効なメールアドレスを入力してください'
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    ERROR_MESSAGE: '表示名は1〜50文字で入力してください'
  }
};

// JWTトークンの有効期限
const JWT_EXPIRY = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '7d'
};

// レート制限設定
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15分
  MAX_REQUESTS: 100,
  LOGIN_MAX_REQUESTS: 5
};

// デフォルト設定
const DEFAULT_SETTINGS = {
  categories: ['企画', '開発', 'デザイン', 'テスト', 'ドキュメント', '会議', 'その他'],
  projectName: 'NullTasker Project',
  projectDescription: 'チームでのタスク管理を効率化するプロジェクトです。',
  notifications: {
    email: true,
    desktop: false,
    taskReminder: true
  },
  display: {
    theme: 'light',
    language: 'ja',
    tasksPerPage: 20
  }
};

const DEFAULT_PROJECT = {
  id: 'default',
  name: 'デフォルトプロジェクト',
  description: '初期プロジェクト',
  owner: 'admin',
  members: ['admin'],
  admins: ['admin'],
  settings: {
    categories: ['企画', '開発', 'デザイン', 'テスト', 'ドキュメント', '会議', 'その他'],
    priorities: [
      {
        value: 'high',
        label: '高優先度',
        color: '#c62828'
      },
      {
        value: 'medium',
        label: '中優先度',
        color: '#ef6c00'
      },
      {
        value: 'low',
        label: '低優先度',
        color: '#2e7d32'
      }
    ],
    statuses: [
      {
        value: 'todo',
        label: '未着手',
        color: '#666'
      },
      {
        value: 'in_progress',
        label: '進行中',
        color: '#1976d2'
      },
      {
        value: 'review',
        label: 'レビュー中',
        color: '#f57c00'
      },
      {
        value: 'done',
        label: '完了',
        color: '#388e3c'
      }
    ],
    notifications: true,
    autoAssign: false
  },
  createdAt: '2025-09-01T00:00:00.000Z',
  lastUpdated: '2025-09-07T00:00:00.000Z'
};

// ヘルパー関数
function getValidProgressValues() {
  return Object.values(TASK_PROGRESS);
}

function getValidPriorityValues() {
  return Object.values(TASK_PRIORITY);
}

function getValidStatusValues() {
  return Object.values(TASK_STATUS);
}

function getValidRoleValues() {
  return Object.values(USER_ROLE);
}

function getPrioritiesArray() {
  return Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
    color: config.color
  }));
}

function getStatusesArray() {
  return Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
    color: config.color
  }));
}

module.exports = {
  TASK_PROGRESS,
  TASK_PROGRESS_CONFIG,
  TASK_PROGRESS_OPTIONS,
  TASK_PRIORITY,
  TASK_PRIORITY_CONFIG,
  TASK_STATUS,
  TASK_STATUS_CONFIG,
  USER_ROLE,
  VALIDATION,
  JWT_EXPIRY,
  RATE_LIMIT,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECT,
  getValidProgressValues,
  getValidPriorityValues,
  getValidStatusValues,
  getValidRoleValues,
  getPrioritiesArray,
  getStatusesArray,
  generateProgressOptions
};
