// セキュアな認証管理（Cookie使用版）
class SecureAuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.loadUserFromToken();
  }

  async loadUserFromToken() {
    try {
      // サーバーサイドでCookieを確認し、ユーザー情報を取得
      const response = await fetch('/api/user', {
        credentials: 'include' // Cookieを送信
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.currentUser = userData;
      }
    } catch (error) {
      console.error('ユーザー情報の取得に失敗:', error);
    }
  }

  async login(loginId, password, rememberMe) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Cookieを受信
        body: JSON.stringify({ loginId, password, rememberMe })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.currentUser = result.user;
        
        // セキュリティ強化：localStorageは使用せず、httpOnly Cookieのみ使用
        // トークンはサーバーサイドでCookieに設定される
        
        return { success: true, user: result.user };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      return { success: false, message: 'ネットワークエラーが発生しました' };
    }
  }

  async logout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      this.currentUser = null;
      window.location.href = '/login.html';
    }
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      // トークンの有効期限切れの場合、自動でリフレッシュを試行
      if (response.status === 401) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          // リフレッシュ成功、元のリクエストを再試行
          return await fetch(url, { ...defaultOptions, ...options });
        } else {
          // リフレッシュ失敗、ログイン画面へリダイレクト
          this.logout();
          return null;
        }
      }

      return response;
    } catch (error) {
      console.error('認証付きリクエストエラー:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      return await response.json();
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
      return { success: false };
    }
  }

  requireAuth(redirectTo = '/login.html') {
    if (!this.isLoggedIn()) {
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = loginUrl;
      return false;
    }
    return true;
  }
}

// XSSからの保護を強化したヘルパー関数
class SecurityUtils {
  static sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  static validateInput(input, type) {
    switch (type) {
      case 'loginId':
        return /^[a-zA-Z0-9_-]{3,20}$/.test(input);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'password':
        return input.length >= 8 && input.length <= 128;
      default:
        return false;
    }
  }

  static generateCSRFToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export { SecureAuthManager, SecurityUtils };
