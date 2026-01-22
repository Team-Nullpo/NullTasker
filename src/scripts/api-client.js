/**
 * API Client - 統一されたAPIリクエスト管理
 * すべてのAPI呼び出しを一元化し、エラーハンドリングを統一
 */

import { Utils } from './utils.js';

/**
 * カスタムAPIエラークラス
 */
export class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }
}

/**
 * APIクライアント
 */
export class APIClient {
  /**
   * ベースURL
   */
  static get BASE_URL() {
    return '/api';
  }

  /**
   * リクエストタイムアウト（ミリ秒）
   */
  static get TIMEOUT() {
    return 30000; // 30秒
  }

  /**
   * 認証トークンを取得
   */
  static getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * 共通ヘッダーを取得
   */
  static getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * タイムアウト付きfetch
   */
  static async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new APIError('リクエストがタイムアウトしました', 408, null);
      }
      throw error;
    }
  }

  /**
   * レスポンスを処理
   */
  static async handleResponse(response) {
    // レスポンスボディを取得
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // エラーレスポンスの処理
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTPエラー: ${response.status}`;
      throw new APIError(errorMessage, response.status, data);
    }

    return data;
  }

  /**
   * GETリクエスト
   * @param {string} endpoint - APIエンドポイント
   * @param {Object} params - クエリパラメータ
   * @param {Object} options - 追加オプション
   */
  static async get(endpoint, params = {}, options = {}) {
    const url = new URL(`${this.BASE_URL}${endpoint}`, window.location.origin);
    
    // クエリパラメータを追加
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    Utils.debugLog(`GET ${url.pathname}${url.search}`);

    const response = await this.fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(options.headers),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * POSTリクエスト
   * @param {string} endpoint - APIエンドポイント
   * @param {Object} data - リクエストボディ
   * @param {Object} options - 追加オプション
   */
  static async post(endpoint, data = {}, options = {}) {
    Utils.debugLog(`POST ${endpoint}`, data);

    const response = await this.fetchWithTimeout(`${this.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(options.headers),
      body: JSON.stringify(data),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * PUTリクエスト
   * @param {string} endpoint - APIエンドポイント
   * @param {Object} data - リクエストボディ
   * @param {Object} options - 追加オプション
   */
  static async put(endpoint, data = {}, options = {}) {
    Utils.debugLog(`PUT ${endpoint}`, data);

    const response = await this.fetchWithTimeout(`${this.BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(options.headers),
      body: JSON.stringify(data),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * PATCHリクエスト
   * @param {string} endpoint - APIエンドポイント
   * @param {Object} data - リクエストボディ
   * @param {Object} options - 追加オプション
   */
  static async patch(endpoint, data = {}, options = {}) {
    Utils.debugLog(`PATCH ${endpoint}`, data);

    const response = await this.fetchWithTimeout(`${this.BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(options.headers),
      body: JSON.stringify(data),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * DELETEリクエスト
   * @param {string} endpoint - APIエンドポイント
   * @param {Object} options - 追加オプション
   */
  static async delete(endpoint, options = {}) {
    Utils.debugLog(`DELETE ${endpoint}`);

    const response = await this.fetchWithTimeout(`${this.BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(options.headers),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * ファイルアップロード
   * @param {string} endpoint - APIエンドポイント
   * @param {FormData} formData - フォームデータ
   * @param {Object} options - 追加オプション
   */
  static async upload(endpoint, formData, options = {}) {
    Utils.debugLog(`UPLOAD ${endpoint}`);

    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
    const headers = { ...options.headers };
    delete headers['Content-Type'];

    const response = await this.fetchWithTimeout(`${this.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(headers),
      body: formData,
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * ファイルダウンロード
   * @param {string} endpoint - APIエンドポイント
   * @param {string} filename - 保存ファイル名
   * @param {Object} options - 追加オプション
   */
  static async download(endpoint, filename, options = {}) {
    Utils.debugLog(`DOWNLOAD ${endpoint}`);

    const response = await this.fetchWithTimeout(`${this.BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(options.headers),
      ...options
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIError(error || `ダウンロードエラー: ${response.status}`, response.status, null);
    }

    // Blobとしてダウンロード
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  }
}

/**
 * エラーハンドリングヘルパー
 */
export class ErrorHandler {
  /**
   * エラーメッセージを取得
   */
  static getErrorMessage(error) {
    if (error instanceof APIError) {
      return error.message;
    }
    
    if (error.name === 'NetworkError' || error.message.includes('Failed to fetch')) {
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    }
    
    if (error.name === 'AbortError') {
      return 'リクエストがキャンセルされました。';
    }
    
    return error.message || '不明なエラーが発生しました。';
  }

  /**
   * エラーを処理して通知
   */
  static handle(error, context = '') {
    const message = this.getErrorMessage(error);
    const fullMessage = context ? `${context}: ${message}` : message;
    
    Utils.debugLog('エラー:', error);
    Utils.showNotification(fullMessage, 'error');
    
    // 開発環境では詳細をコンソールに出力
    if (Utils.DEBUG_MODE) {
      console.error('Error Details:', {
        context,
        error,
        stack: error.stack
      });
    }
  }

  /**
   * 認証エラーかチェック
   */
  static isAuthError(error) {
    return error instanceof APIError && (error.status === 401 || error.status === 403);
  }

  /**
   * バリデーションエラーかチェック
   */
  static isValidationError(error) {
    return error instanceof APIError && error.status === 400;
  }

  /**
   * サーバーエラーかチェック
   */
  static isServerError(error) {
    return error instanceof APIError && error.status >= 500;
  }
}
