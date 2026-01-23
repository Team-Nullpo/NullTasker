// 簡易認証チェック用モジュール
import { STORAGE_KEYS, USER_ROLE } from './constants.js';

export class SimpleAuth {
  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('ユーザー情報の解析エラー:', e.message);
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
      sessionStorage.setItem(STORAGE_KEYS.REDIRECTED_FROM_MAIN, 'true');
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
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  }

  static initUserIcon() {
    const userIcon = document.getElementById('userIcon');
    console.log('userIcon element:', userIcon);

    if (!userIcon) {
      console.warn('userIcon element not found');
      return;
    }

    // ユーザー情報を取得
    const user = this.getCurrentUser();
    console.log('current user:', user);

    if (!user) {
      console.warn('no current user found');
      return;
    }

    // ドロップダウンメニューを作成
    this.createUserDropdown(userIcon, user);

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('ユーザーアイコン初期化完了');
    }
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

    // ユーザー情報セクション
    const userInfo = document.createElement('div');
    userInfo.className = 'user-dropdown-user-info';
    userInfo.innerHTML = `
      <div class="user-dropdown-user-name">${user.displayName || user.id}</div>
      <div class="user-dropdown-user-email">${user.email || ''}</div>
      <div class="user-dropdown-user-role">権限: ${this.getRoleDisplayName(user.role)}</div>
    `;

    // メニュー項目
    const menuItems = document.createElement('div');
    menuItems.className = 'user-dropdown-menu';

    // 基本メニュー項目
    const basicMenuItems = [
      { icon: 'fas fa-user', text: 'プロフィール', action: () => window.location.href = 'user-profile.html' }
    ];

    // 管理者メニュー項目（system_adminの場合のみ）
    const adminMenuItems = [];
    if (user.role === 'system_admin') {
      adminMenuItems.push(
        { icon: 'fas fa-cogs', text: 'システム管理', action: () => window.location.href = 'admin.html' }
      );
    }

    // メニュー項目を追加
    [...basicMenuItems, ...adminMenuItems].forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'user-dropdown-item';
      menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;

      menuItem.addEventListener('click', () => {
        dropdown.style.display = 'none';
        item.action();
      });

      menuItems.appendChild(menuItem);
    });

    // 区切り線
    const separator = document.createElement('div');
    separator.className = 'user-dropdown-separator';
    menuItems.appendChild(separator);

    // ログアウトメニュー
    const logoutItem = document.createElement('div');
    logoutItem.className = 'user-dropdown-logout';
    logoutItem.innerHTML = '<i class="fas fa-sign-out-alt"></i> ログアウト';

    logoutItem.addEventListener('click', () => {
      this.logout();
    });

    menuItems.appendChild(logoutItem);

    // ドロップダウンを組み立て
    dropdown.appendChild(userInfo);
    dropdown.appendChild(menuItems);

    // ユーザーアイコンにドロップダウンを追加
    userIcon.style.position = 'relative';
    userIcon.style.cursor = 'pointer';
    userIcon.appendChild(dropdown);

    // クリックイベント
    userIcon.addEventListener('click', (e) => {
      console.log('userIcon clicked');
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
      console.log('dropdown display:', dropdown.style.display);
      console.log('dropdown position:', {
        position: dropdown.style.position,
        bottom: dropdown.style.bottom,
        right: dropdown.style.right,
        zIndex: dropdown.style.zIndex
      });
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
      'user': 'メンバー'
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
