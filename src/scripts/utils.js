// 共通ユーティリティ関数
import { NOTIFICATION_COLORS, NOTIFICATION_TYPE } from './constants.js';

export class Utils {
  // デバッグモード判定（開発環境のみログ出力）
  static get DEBUG_MODE() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  // デバッグログ（開発環境のみ）
  static debugLog(...args) {
    if (this.DEBUG_MODE) {
      console.log(...args);
    }
  }

  // モバイル判定
  static isMobile() {
    return window.innerWidth <= 768;
  }

  // 日付フォーマット
  static formatDate(dateString) {
    // null/undefined/empty は未設定扱い
    if (!dateString) return '未設定';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '未設定';
    return date.toLocaleDateString('ja-JP');
  }

  // 同じ日付かチェック
  static isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // 今日かチェック
  static isToday(date) {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  // ID生成
  static generateId(prefix = 'item') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${random}`;
  }

  // バイト数をフォーマット
  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 通知表示
  static showNotification(message, type = NOTIFICATION_TYPE.INFO) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const backgroundColor = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS[NOTIFICATION_TYPE.INFO];
    const textColor = type === NOTIFICATION_TYPE.WARNING ? '#212529' : 'white';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${backgroundColor};
      color: ${textColor};
      padding: 15px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
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
    }, 3000);
  }

  // ローカルストレージからデータ取得
  static getFromStorage(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.warn(`Failed to parse ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  // ローカルストレージにデータ保存
  static saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
      return false;
    }
  }

  // 要素取得（エラーハンドリング付き）
  static getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  }

  // 複数要素取得
  static getElements(selector) {
    return document.querySelectorAll(selector);
  }

  // 日付バリデーション
  static validateDates(startDate, endDate) {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }

  // 安全な数値変換
  static toSafeInteger(value, defaultValue = 0) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // 安全な配列変換
  static toSafeArray(value, defaultValue = []) {
    return Array.isArray(value) ? value : defaultValue;
  }
}