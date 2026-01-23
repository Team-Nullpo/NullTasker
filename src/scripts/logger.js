/**
 * ロガークラス - 環境に応じたログ出力制御
 */

const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

export class Logger {
  static currentLevel = LOG_LEVEL.DEBUG; // 開発環境ではDEBUG、本番ではWARN以上に設定

  /**
   * ログレベルを設定
   * @param {number} level - ログレベル
   */
  static setLevel(level) {
    this.currentLevel = level;
  }

  /**
   * 本番環境かチェック
   */
  static isProduction() {
    return window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('127.');
  }

  /**
   * 初期化 - 環境に応じてログレベルを設定
   */
  static init() {
    if (this.isProduction()) {
      this.currentLevel = LOG_LEVEL.WARN;
    }
  }

  /**
   * DEBUGログ
   */
  static debug(...args) {
    if (this.currentLevel <= LOG_LEVEL.DEBUG) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  }

  /**
   * INFOログ
   */
  static info(...args) {
    if (this.currentLevel <= LOG_LEVEL.INFO) {
      console.log('[INFO]', new Date().toISOString(), ...args);
    }
  }

  /**
   * WARNログ
   */
  static warn(...args) {
    if (this.currentLevel <= LOG_LEVEL.WARN) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  }

  /**
   * ERRORログ
   */
  static error(...args) {
    if (this.currentLevel <= LOG_LEVEL.ERROR) {
      console.error('[ERROR]', new Date().toISOString(), ...args);
    }
  }

  /**
   * パフォーマンス計測開始
   */
  static time(label) {
    if (this.currentLevel <= LOG_LEVEL.DEBUG) {
      console.time(label);
    }
  }

  /**
   * パフォーマンス計測終了
   */
  static timeEnd(label) {
    if (this.currentLevel <= LOG_LEVEL.DEBUG) {
      console.timeEnd(label);
    }
  }
}

// 初期化
Logger.init();
