// 認証関連のユーティリティ機能
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.init();
  }

  // 初期化
  init() {
    this.loadAuthFromStorage();
  }

  // ストレージから認証情報を読み込み
  loadAuthFromStorage() {
    this.token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error('ユーザー情報の解析エラー:', error);
        this.clearAuth();
      }
    }
  }

  // 認証情報をストレージに保存
  saveAuthToStorage(token, user, remember = false) {
    this.token = token;
    this.currentUser = user;

    if (remember) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  // 認証情報をクリア
  clearAuth() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
  }

  // ログイン状態をチェック
  isLoggedIn() {
    return !!(this.token && this.currentUser);
  }

  // 現在のユーザー情報を取得
  getCurrentUser() {
    return this.currentUser;
  }

  // 認証トークンを取得
  getToken() {
    return this.token;
  }

  // API リクエスト時のヘッダーを取得
  getAuthHeaders() {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  // 認証が必要なページでのチェック
  requireAuth(redirectTo = '/login.html') {
    if (!this.isLoggedIn()) {
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = loginUrl;
      return false;
    }
    return true;
  }

  // ログアウト
  async logout() {
    console.log('logout method called');
    
    // ログアウト確認ダイアログ
    if (!confirm('ログアウトしますか？')) {
      console.log('logout cancelled by user');
      return;
    }

    console.log('logout confirmed, proceeding...');

    try {
      // サーバーにログアウト通知
      if (this.token) {
        console.log('sending logout request to server');
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
        console.log('logout response:', response.status);
      }
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
    } finally {
      console.log('clearing auth data');
      this.clearAuth();
      
      // ログアウト成功メッセージを表示してからリダイレクト
      const logoutMessage = document.createElement('div');
      logoutMessage.innerHTML = `
        <div style="
          position: fixed; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 10000;
          text-align: center;
        ">
          <i class="fas fa-sign-out-alt" style="font-size: 24px; color: #667eea; margin-bottom: 10px;"></i>
          <p style="margin: 0; color: #333;">ログアウトしました</p>
        </div>
      `;
      document.body.appendChild(logoutMessage);
      
      console.log('redirecting to login page');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    }
  }

  // トークンの有効性を確認
  async validateToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        this.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error('トークン検証エラー:', error);
      this.clearAuth();
      return false;
    }
  }

  // ユーザー情報を更新
  updateCurrentUser(userData) {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...userData };
      
      // ストレージを更新
      const remember = !!localStorage.getItem('authToken');
      if (remember) {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      } else {
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }
    }
  }

  // ユーザー表示名を取得
  getDisplayName() {
    return this.currentUser ? this.currentUser.displayName : '';
  }

  // ユーザーアイコンの初期化
  initUserIcon() {
    console.log('initUserIcon called', { currentUser: this.currentUser });
    
    const userIcon = document.querySelector('.user-icon');
    console.log('userIcon element:', userIcon);
    
    if (userIcon && this.currentUser) {
      userIcon.title = this.currentUser.displayName;
      
      // ユーザー名の頭文字を表示（アイコンがない場合）
      const initial = this.currentUser.displayName.charAt(0).toUpperCase();
      userIcon.innerHTML = `<span class="user-initial">${initial}</span>`;
      
      // クリック時のメニュー表示
      userIcon.addEventListener('click', this.showUserMenu.bind(this));
      
      console.log('User icon initialized for:', this.currentUser.displayName);
    } else {
      console.log('userIcon not found or currentUser is null', { 
        userIcon: !!userIcon, 
        currentUser: !!this.currentUser 
      });
    }
  }

  // ユーザーメニューを表示
  showUserMenu(event) {
    event.stopPropagation();
    
    // 既存のメニューを削除
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    // メニューを作成
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
      <div class="user-info">
        <div class="user-name">${this.currentUser.displayName}</div>
        <div class="user-email">${this.currentUser.email}</div>
      </div>
      <hr>
      <button class="logout-btn">
        <i class="fas fa-sign-out-alt"></i>
        ログアウト
      </button>
    `;

    // ログアウトボタンのイベントリスナーを追加
    const logoutBtn = menu.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.logout();
    });

    // メニューのスタイル
    Object.assign(menu.style, {
      position: 'absolute',
      bottom: '100%',
      right: '0',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '10px',
      minWidth: '200px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: '1000',
      marginBottom: '10px'
    });

    // アイコンの親要素に追加
    const userIcon = event.currentTarget;
    userIcon.style.position = 'relative';
    userIcon.appendChild(menu);

    // 外側をクリックしたら閉じる
    document.addEventListener('click', function closeMenu() {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    });
  }
}

// グローバルインスタンスを作成
const authManager = new AuthManager();

// ページ読み込み時の認証チェック
document.addEventListener('DOMContentLoaded', function() {
  // ログインページ・登録ページでない場合は認証チェック
  if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
    authManager.requireAuth();
    // 少し遅延してユーザーアイコンを初期化
    setTimeout(() => {
      authManager.initUserIcon();
    }, 100);
  }
});

// CSS for user menu (動的に追加)
if (!document.querySelector('#auth-styles')) {
  const style = document.createElement('style');
  style.id = 'auth-styles';
  style.textContent = `
    .user-menu .user-info {
      margin-bottom: 10px;
    }
    
    .user-menu .user-name {
      font-weight: bold;
      color: #333;
      margin-bottom: 2px;
    }
    
    .user-menu .user-email {
      font-size: 12px;
      color: #666;
    }
    
    .user-menu hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 8px 0;
    }
    
    .user-menu .logout-btn {
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: #f44336;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    
    .user-menu .logout-btn:hover {
      background: #d32f2f;
    }
    
    .user-initial {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);
}

export { authManager };
