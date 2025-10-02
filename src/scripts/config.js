// 共通設定モジュール
// デフォルト設定とビジネスロジックを一元管理

import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  DEFAULT_CATEGORIES,
  DEFAULT_PROJECT_ID
} from './constants.js';

/**
 * デフォルト設定を取得
 */
export class AppConfig {
  /**
   * デフォルトのアプリケーション設定
   */
  static getDefaultSettings() {
    return {
      users: [],
      categories: [...DEFAULT_CATEGORIES],
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
        tasksPerPage: 10
      }
    };
  }

  /**
   * 優先度設定を取得
   */
  static getPriorities() {
    return Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
      color: config.color
    }));
  }

  /**
   * ステータス設定を取得
   */
  static getStatuses() {
    return Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
      color: config.color
    }));
  }

  /**
   * グローバル設定オブジェクトを生成
   */
  static createGlobalSettings(categories, users) {
    return {
      categories: categories || [...DEFAULT_CATEGORIES],
      users: users || [],
      priorities: this.getPriorities(),
      statuses: this.getStatuses()
    };
  }

  /**
   * デフォルトプロジェクト設定
   */
  static getDefaultProject() {
    return {
      id: DEFAULT_PROJECT_ID,
      name: 'デフォルトプロジェクト',
      description: '初期プロジェクト',
      owner: 'admin',
      members: ['admin'],
      admins: ['admin'],
      settings: {
        categories: [...DEFAULT_CATEGORIES],
        priorities: ['低', '中', '高', '緊急'],
        statuses: ['未着手', '進行中', 'レビュー中', '完了'],
        notifications: true,
        autoAssign: false
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * バリデーションヘルパー
 */
export class ValidationHelper {
  /**
   * ログインIDの検証
   */
  static validateLoginId(loginId, config) {
    if (!loginId) return { valid: false, message: 'ログインIDを入力してください' };
    if (loginId.length < config.MIN_LENGTH || loginId.length > config.MAX_LENGTH) {
      return { 
        valid: false, 
        message: `ログインIDは${config.MIN_LENGTH}-${config.MAX_LENGTH}文字で入力してください` 
      };
    }
    if (!config.PATTERN.test(loginId)) {
      return { 
        valid: false, 
        message: 'ログインIDは英数字、アンダースコア、ハイフンのみ使用可能です' 
      };
    }
    return { valid: true };
  }

  /**
   * パスワードの検証
   */
  static validatePassword(password, config) {
    if (!password) return { valid: false, message: 'パスワードを入力してください' };
    if (password.length < config.MIN_LENGTH) {
      return { 
        valid: false, 
        message: `パスワードは${config.MIN_LENGTH}文字以上で入力してください` 
      };
    }
    if (!config.PATTERN.test(password)) {
      return { 
        valid: false, 
        message: 'パスワードは大文字・小文字・数字をそれぞれ1文字以上含む必要があります' 
      };
    }
    return { valid: true };
  }

  /**
   * メールアドレスの検証
   */
  static validateEmail(email, config) {
    if (!email) return { valid: false, message: 'メールアドレスを入力してください' };
    if (!config.PATTERN.test(email)) {
      return { valid: false, message: '有効なメールアドレスを入力してください' };
    }
    return { valid: true };
  }

  /**
   * 日付の検証（開始日 <= 終了日）
   */
  static validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return { valid: false, message: '開始日と終了日を入力してください' };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return { valid: false, message: '開始日は終了日より前に設定してください' };
    }
    return { valid: true };
  }
}

/**
 * データ変換ヘルパー
 */
export class DataTransformer {
  /**
   * タスクデータを正規化
   */
  static normalizeTask(task) {
    return {
      ...task,
      progress: parseInt(task.progress) || 0,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * ユーザーデータからパスワードを除外
   */
  static sanitizeUser(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * ユーザーリストからパスワードを除外
   */
  static sanitizeUsers(users) {
    return users.map(user => this.sanitizeUser(user));
  }
}
