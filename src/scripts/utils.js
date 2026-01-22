/**
 * 共通ユーティリティ関数
 * アプリケーション全体で使用する汎用的な関数を提供
 */

import { NOTIFICATION_COLORS, NOTIFICATION_TYPE } from './constants.js';

export class Utils {
  // ==========================================================================
  // 環境・デバッグ
  // ==========================================================================

  /**
   * デバッグモード判定（開発環境のみログ出力）
   */
  static get DEBUG_MODE() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('192.168');
  }

  /**
   * デバッグログ（開発環境のみ）
   * @param {...any} args - ログに出力する引数
   */
  static debugLog(...args) {
    if (this.DEBUG_MODE) {
      console.log('[DEBUG]', ...args);
    }
  }

  /**
   * エラーログ（常に出力）
   * @param {...any} args - ログに出力する引数
   */
  static errorLog(...args) {
    console.error('[ERROR]', ...args);
  }

  // ==========================================================================
  // デバイス・ブラウザ判定
  // ==========================================================================

  /**
   * モバイル判定
   * @returns {boolean} モバイルデバイスかどうか
   */
  static isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * タブレット判定
   * @returns {boolean} タブレットデバイスかどうか
   */
  static isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  /**
   * デスクトップ判定
   * @returns {boolean} デスクトップデバイスかどうか
   */
  static isDesktop() {
    return window.innerWidth > 1024;
  }

  /**
   * タッチデバイス判定
   * @returns {boolean} タッチデバイスかどうか
   */
  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // ==========================================================================
  // 日付・時刻
  // ==========================================================================

  /**
   * 日付フォーマット
   * @param {string|Date} dateString - 日付文字列またはDateオブジェクト
   * @param {string} format - フォーマット形式（'full', 'short', 'iso'）
   * @returns {string} フォーマットされた日付文字列
   */
  static formatDate(dateString, format = 'full') {
    if (!dateString) return '未設定';
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '未設定';
    
    switch (format) {
      case 'short':
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      case 'iso':
        return date.toISOString().split('T')[0];
      case 'full':
      default:
        return date.toLocaleDateString('ja-JP');
    }
  }

  /**
   * 日時フォーマット（時刻含む）
   * @param {string|Date} dateString - 日付文字列またはDateオブジェクト
   * @returns {string} フォーマットされた日時文字列
   */
  static formatDateTime(dateString) {
    if (!dateString) return '未設定';
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '未設定';
    
    return date.toLocaleString('ja-JP');
  }

  /**
   * 相対時間フォーマット（「3日前」など）
   * @param {string|Date} dateString - 日付文字列またはDateオブジェクト
   * @returns {string} 相対時間文字列
   */
  static formatRelativeTime(dateString) {
    if (!dateString) return '不明';
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '不明';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'たった今';
    if (diffMin < 60) return `${diffMin}分前`;
    if (diffHour < 24) return `${diffHour}時間前`;
    if (diffDay < 7) return `${diffDay}日前`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)}ヶ月前`;
    return `${Math.floor(diffDay / 365)}年前`;
  }

  /**
   * 同じ日付かチェック
   * @param {Date} date1 - 日付1
   * @param {Date} date2 - 日付2
   * @returns {boolean} 同じ日付かどうか
   */
  static isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * 今日かチェック
   * @param {Date} date - チェックする日付
   * @returns {boolean} 今日かどうか
   */
  static isToday(date) {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  /**
   * 期限切れかチェック
   * @param {string|Date} dateString - 日付文字列またはDateオブジェクト
   * @returns {boolean} 期限切れかどうか
   */
  static isOverdue(dateString) {
    if (!dateString) return false;
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  // ==========================================================================
  // ID・文字列生成
  // ==========================================================================

  /**
   * ユニークID生成
   * @param {string} prefix - プレフィックス
   * @returns {string} ユニークID
   */
  static generateId(prefix = 'item') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * UUID v4生成
   * @returns {string} UUID
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ==========================================================================
  // データフォーマット
  // ==========================================================================

  /**
   * バイト数をフォーマット
   * @param {number} bytes - バイト数
   * @param {number} decimals - 小数点以下の桁数
   * @returns {string} フォーマットされた文字列
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  /**
   * 数値をカンマ区切りでフォーマット
   * @param {number} num - 数値
   * @returns {string} フォーマットされた文字列
   */
  static formatNumber(num) {
    return num.toLocaleString('ja-JP');
  }

  /**
   * パーセント表示
   * @param {number} value - 値
   * @param {number} total - 全体
   * @param {number} decimals - 小数点以下の桁数
   * @returns {string} パーセント表示
   */
  static formatPercent(value, total, decimals = 0) {
    if (total === 0) return '0%';
    const percent = (value / total) * 100;
    return `${percent.toFixed(decimals)}%`;
  }

  // ==========================================================================
  // DOM操作
  // ==========================================================================

  /**
   * 要素を取得
   * @param {string} selector - セレクタ
   * @param {Element} parent - 親要素
   * @returns {Element|null} 要素
   */
  static getElement(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /**
   * 複数の要素を取得
   * @param {string} selector - セレクタ
   * @param {Element} parent - 親要素
   * @returns {NodeList} 要素リスト
   */
  static getElements(selector, parent = document) {
    return parent.querySelectorAll(selector);
  }

  /**
   * 要素を作成
   * @param {string} tag - タグ名
   * @param {Object} attributes - 属性
   * @param {string} content - テキストコンテンツ
   * @returns {Element} 作成された要素
   */
  static createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'style') {
        Object.assign(element.style, value);
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });
    
    if (content) {
      element.textContent = content;
    }
    
    return element;
  }

  // ==========================================================================
  // 通知
  // ==========================================================================

  /**
   * 通知表示
   * @param {string} message - 表示メッセージ
   * @param {string} type - 通知タイプ（success, error, warning, info）
   * @param {number} duration - 表示時間（ミリ秒）
   */
  static showNotification(message, type = NOTIFICATION_TYPE.INFO, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const backgroundColor = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS[NOTIFICATION_TYPE.INFO];
    const textColor = type === NOTIFICATION_TYPE.WARNING ? '#212529' : 'white';
    
    notification.style.cssText = `
      position: fixed;
      top: var(--space-5, 20px);
      right: var(--space-5, 20px);
      background-color: ${backgroundColor};
      color: ${textColor};
      padding: var(--space-4, 15px) var(--space-5, 20px);
      border-radius: var(--border-radius-base, 6px);
      box-shadow: var(--shadow-lg, 0 4px 8px rgba(0,0,0,0.2));
      z-index: var(--z-tooltip, 10000);
      font-size: var(--font-size-sm, 14px);
      font-weight: var(--font-weight-medium, 500);
      max-width: 300px;
      word-wrap: break-word;
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  // ==========================================================================
  // ローカルストレージ
  // ==========================================================================

  /**
   * ローカルストレージからデータ取得
   * @param {string} key - キー
   * @param {*} defaultValue - デフォルト値
   * @returns {*} 取得した値
   */
  static getFromStorage(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      this.errorLog(`Failed to parse ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  /**
   * ローカルストレージにデータ保存
   * @param {string} key - キー
   * @param {*} data - 保存するデータ
   * @returns {boolean} 保存成功かどうか
   */
  static saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      this.errorLog(`Failed to save ${key} to localStorage:`, e);
      return false;
    }
  }

  /**
   * ローカルストレージからデータ削除
   * @param {string} key - キー
   */
  static removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      this.errorLog(`Failed to remove ${key} from localStorage:`, e);
      return false;
    }
  }

  /**
   * ローカルストレージをクリア
   */
  static clearStorage() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      this.errorLog('Failed to clear localStorage:', e);
      return false;
    }
  }

  // ==========================================================================
  // バリデーション
  // ==========================================================================

  /**
   * 日付バリデーション（開始日 <= 終了日）
   * @param {string|Date} startDate - 開始日
   * @param {string|Date} endDate - 終了日
   * @returns {boolean} バリデーション結果
   */
  static validateDates(startDate, endDate) {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }

  /**
   * メールアドレスバリデーション
   * @param {string} email - メールアドレス
   * @returns {boolean} バリデーション結果
   */
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // ==========================================================================
  // 型変換・安全な変換
  // ==========================================================================

  /**
   * 安全な整数変換
   * @param {*} value - 変換する値
   * @param {number} defaultValue - デフォルト値
   * @returns {number} 整数値
   */
  static toSafeInteger(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 安全な配列変換
   * @param {*} value - 変換する値
   * @param {Array} defaultValue - デフォルト値
   * @returns {Array} 配列
   */
  static toSafeArray(value, defaultValue = []) {
    return Array.isArray(value) ? value : defaultValue;
  }

  // ==========================================================================
  // その他ユーティリティ
  // ==========================================================================

  /**
   * ディープコピー
   * @param {*} obj - コピーするオブジェクト
   * @returns {*} コピーされたオブジェクト
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * デバウンス関数
   * @param {Function} func - 実行する関数
   * @param {number} delay - 遅延時間（ミリ秒）
   * @returns {Function} デバウンスされた関数
   */
  static debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * URLパラメータを取得
   * @param {string} name - パラメータ名
   * @returns {string|null} パラメータ値
   */
  static getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
}