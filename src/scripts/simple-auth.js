// 簡易認証チェック用モジュール
export class SimpleAuth {
  static getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  
  static getCurrentUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('ユーザー情報の解析エラー:', e);
        return null;
      }
    }
    return null;
  }
  
  static isLoggedIn() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!token && !!user;
  }
  
  static requireAuth() {
    if (!this.isLoggedIn()) {
      // 無限ループ防止フラグを設定
      sessionStorage.setItem('redirectedFromMain', 'true');
      window.location.href = '/src/pages/login.html';
      return false;
    }
    return true;
  }
  
  static getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
  
  static hasRole(requiredRole) {
    const user = this.getCurrentUser();
    return user && user.role === requiredRole;
  }
  
  static updateCurrentUser(updatedUser) {
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }
  
  static initUserIcon() {
    const userIcon = document.getElementById('userIcon');
    if (!userIcon) return;

    // ユーザー情報を取得
    const user = this.getCurrentUser();
    if (!user) return;

    // ドロップダウンメニューを作成
    this.createUserDropdown(userIcon, user);
    
    console.log('ユーザーアイコン初期化完了');
  }

  static createUserDropdown(userIcon, user) {
    // 既存のドロップダウンがあれば削除
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
    }

    // ドロップダウンメニューを作成
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      bottom: calc(100% + 8px);
      right: -8px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 220px;
      z-index: 1000;
      display: none;
    `;

    // ユーザー情報セクション
    const userInfo = document.createElement('div');
    userInfo.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
    `;
    userInfo.innerHTML = `
      <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${user.displayName || user.id}</div>
      <div style="font-size: 12px; color: #666;">${user.email || ''}</div>
      <div style="font-size: 11px; color: #888; margin-top: 2px;">権限: ${this.getRoleDisplayName(user.role)}</div>
    `;

    // メニュー項目
    const menuItems = document.createElement('div');
    menuItems.style.cssText = 'padding: 8px 0;';

    // 基本メニュー項目
    const basicMenuItems = [
      { icon: 'fas fa-user', text: 'プロフィール', action: () => window.location.href = '/src/pages/user-profile.html' }
    ];

    // 管理者メニュー項目（system_adminまたはproject_adminの場合のみ）
    const adminMenuItems = [];
    if (user.role === 'system_admin') {
      adminMenuItems.push(
        { icon: 'fas fa-cogs', text: 'システム管理', action: () => window.location.href = '/src/pages/admin.html' }
      );
    } else if (user.role === 'project_admin') {
      adminMenuItems.push(
        { icon: 'fas fa-users', text: 'メンバー管理', action: () => window.location.href = '/src/pages/admin.html?tab=members' }
      );
    }

    // メニュー項目を追加
    [...basicMenuItems, ...adminMenuItems].forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.style.cssText = `
        padding: 10px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background-color 0.2s;
        color: #333;
      `;
      menuItem.innerHTML = `<i class="${item.icon}" style="width: 16px;"></i> ${item.text}`;
      
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      menuItem.addEventListener('click', () => {
        dropdown.style.display = 'none';
        item.action();
      });
      
      menuItems.appendChild(menuItem);
    });

    // 区切り線
    const separator = document.createElement('div');
    separator.style.cssText = 'height: 1px; background: #eee; margin: 8px 0;';
    menuItems.appendChild(separator);

    // ログアウトメニュー
    const logoutItem = document.createElement('div');
    logoutItem.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background-color 0.2s;
      color: #dc3545;
      border-radius: 0 0 8px 8px;
    `;
    logoutItem.innerHTML = '<i class="fas fa-sign-out-alt" style="width: 16px;"></i> ログアウト';
    
    logoutItem.addEventListener('mouseenter', () => {
      logoutItem.style.backgroundColor = '#f8d7da';
    });
    logoutItem.addEventListener('mouseleave', () => {
      logoutItem.style.backgroundColor = 'transparent';
    });
    logoutItem.addEventListener('click', () => {
      this.logout();
    });
    
    menuItems.appendChild(logoutItem);

    // ドロップダウンを組み立て
    dropdown.appendChild(userInfo);
    dropdown.appendChild(menuItems);

    // ユーザーアイコンにドロップダウンを追加
    userIcon.style.position = 'relative';
    userIcon.appendChild(dropdown);

    // クリックイベント
    userIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    });

    // 外部クリックで閉じる
    document.addEventListener('click', (e) => {
      if (!userIcon.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  static getRoleDisplayName(role) {
    const roleMap = {
      'system_admin': 'システム管理者',
      'project_admin': 'プロジェクト管理者',
      'member': 'メンバー'
    };
    return roleMap[role] || 'メンバー';
  }

  static logout() {
    if (confirm('ログアウトしますか？')) {
      this.clearAuth();
      window.location.href = '/src/pages/login.html';
    }
  }
  
  static clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  }
}
