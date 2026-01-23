/**
 * データ検証ユーティリティ
 */

export class Validator {
  /**
   * タスクの検証
   * @param {Object} task - 検証するタスク
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateTask(task) {
    const errors = [];

    // タイトルの検証
    if (!task.title || typeof task.title !== 'string') {
      errors.push('タイトルは必須です');
    } else {
      const trimmed = task.title.trim();
      if (trimmed.length === 0) {
        errors.push('タイトルを入力してください');
      } else if (trimmed.length > 200) {
        errors.push('タイトルは200文字以内で入力してください');
      }
    }

    // 説明の検証
    if (task.description && task.description.length > 2000) {
      errors.push('説明は2000文字以内で入力してください');
    }

    // 期限の検証
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.push('有効な期限を入力してください');
      }
    }

    // 開始日の検証
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push('有効な開始日を入力してください');
      }

      // 開始日と期限の整合性チェック
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (startDate > dueDate) {
          errors.push('開始日は期限より前に設定してください');
        }
      }
    }

    // 進捗の検証
    if (task.progress !== undefined && task.progress !== null) {
      const progress = Number(task.progress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        errors.push('進捗は0から100の範囲で入力してください');
      }
    }

    // 優先度の検証
    if (task.priority && typeof task.priority !== 'string') {
      errors.push('有効な優先度を選択してください');
    }

    // ステータスの検証
    if (task.status && typeof task.status !== 'string') {
      errors.push('有効なステータスを選択してください');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * ユーザー情報の検証
   * @param {Object} user - 検証するユーザー
   * @param {boolean} isNew - 新規登録かどうか
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateUser(user, isNew = false) {
    const errors = [];

    // ログインIDの検証
    if (!user.loginId || typeof user.loginId !== 'string') {
      errors.push('ログインIDは必須です');
    } else {
      const trimmed = user.loginId.trim();
      if (trimmed.length < 3) {
        errors.push('ログインIDは3文字以上で入力してください');
      } else if (trimmed.length > 50) {
        errors.push('ログインIDは50文字以内で入力してください');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        errors.push('ログインIDは英数字、ハイフン、アンダースコアのみ使用できます');
      }
    }

    // 表示名の検証
    if (!user.displayName || typeof user.displayName !== 'string') {
      errors.push('表示名は必須です');
    } else {
      const trimmed = user.displayName.trim();
      if (trimmed.length === 0) {
        errors.push('表示名を入力してください');
      } else if (trimmed.length > 100) {
        errors.push('表示名は100文字以内で入力してください');
      }
    }

    // メールアドレスの検証
    if (!user.email || typeof user.email !== 'string') {
      errors.push('メールアドレスは必須です');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        errors.push('有効なメールアドレスを入力してください');
      }
    }

    // パスワードの検証（新規登録または変更時）
    if (isNew || user.password) {
      if (!user.password || typeof user.password !== 'string') {
        errors.push('パスワードは必須です');
      } else {
        if (user.password.length < 8) {
          errors.push('パスワードは8文字以上で入力してください');
        } else if (user.password.length > 100) {
          errors.push('パスワードは100文字以内で入力してください');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * プロジェクト情報の検証
   * @param {Object} project - 検証するプロジェクト
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateProject(project) {
    const errors = [];

    // プロジェクト名の検証
    if (!project.name || typeof project.name !== 'string') {
      errors.push('プロジェクト名は必須です');
    } else {
      const trimmed = project.name.trim();
      if (trimmed.length === 0) {
        errors.push('プロジェクト名を入力してください');
      } else if (trimmed.length > 100) {
        errors.push('プロジェクト名は100文字以内で入力してください');
      }
    }

    // 説明の検証
    if (project.description && project.description.length > 1000) {
      errors.push('説明は1000文字以内で入力してください');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 文字列のサニタイズ（XSS対策）
   * @param {string} str - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitize(str) {
    if (typeof str !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * HTMLエスケープ
   * @param {string} str - エスケープする文字列
   * @returns {string} エスケープされた文字列
   */
  static escapeHtml(str) {
    if (typeof str !== 'string') {
      return '';
    }

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return str.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * URLの検証
   * @param {string} url - 検証するURL
   * @returns {boolean} 有効なURLかどうか
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
