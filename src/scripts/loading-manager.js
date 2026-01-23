/**
 * ローディングマネージャー - ローディング状態の管理
 */

export class LoadingManager {
  static overlayId = 'loading-overlay';
  static isShowing = false;

  /**
   * ローディングオーバーレイを初期化
   */
  static init() {
    if (document.getElementById(this.overlayId)) {
      return; // 既に存在する場合はスキップ
    }

    const overlay = document.createElement('div');
    overlay.id = this.overlayId;
    overlay.innerHTML = `
      <div class="loading-spinner-container">
        <div class="loading-spinner"></div>
        <p class="loading-message">読み込み中...</p>
      </div>
    `;

    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
      #${this.overlayId} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }

      #${this.overlayId}.show {
        display: flex;
      }

      .loading-spinner-container {
        text-align: center;
        background: var(--bg-primary, #fff);
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid var(--border-color, #e0e0e0);
        border-top: 4px solid var(--primary-color, #007bff);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-message {
        color: var(--text-primary, #333);
        font-size: 1rem;
        margin: 0;
        font-weight: 500;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);
  }

  /**
   * ローディングを表示
   * @param {string} message - 表示するメッセージ
   */
  static show(message = '読み込み中...') {
    this.init();
    const overlay = document.getElementById(this.overlayId);
    if (overlay) {
      const messageEl = overlay.querySelector('.loading-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
      overlay.classList.add('show');
      this.isShowing = true;
    }
  }

  /**
   * ローディングを非表示
   */
  static hide() {
    const overlay = document.getElementById(this.overlayId);
    if (overlay) {
      overlay.classList.remove('show');
      this.isShowing = false;
    }
  }

  /**
   * Promiseまたは非同期関数をラップしてローディング表示
   * @param {Promise|Function} promiseOrFn - 実行するPromiseまたは非同期関数
   * @param {string} message - 表示するメッセージ
   */
  static async wrap(promiseOrFn, message = '読み込み中...') {
    this.show(message);
    try {
      // 関数の場合は呼び出してPromiseを取得
      const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
      const result = await promise;
      return result;
    } finally {
      this.hide();
    }
  }

  /**
   * 複数のPromiseを並列実行してローディング表示
   * @param {Promise[]} promises - 実行するPromise配列
   * @param {string} message - 表示するメッセージ
   */
  static async wrapAll(promises, message = '読み込み中...') {
    this.show(message);
    try {
      const results = await Promise.all(promises);
      return results;
    } finally {
      this.hide();
    }
  }
}

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LoadingManager.init());
} else {
  LoadingManager.init();
}
