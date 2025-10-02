import { Utils } from './utils.js';
import { SimpleAuth } from './simple-auth.js';

// サイドバー管理クラス
export class SidebarManager {
  constructor() {
    this.sidebar = null;
    this.toggleBtn = null;
    this.hideBtn = null;
    this.sidebarVisible = true;
    this.init();
  }

  init() {
    this.initializeElements();
    this.initializeSidebar();
    this.setupEventListeners();
    this.initializeUserIcon();
  }

  initializeElements() {
    this.sidebar = Utils.getElement('#sidebar');
    this.toggleBtn = Utils.getElement('#toggleSidebar'); // 修正: HTMLのIDに合わせる
    this.hideBtn = Utils.getElement('#hideSidebar'); // 修正: HTMLのIDに合わせる
    
    // デバッグ用ログ
    Utils.debugLog('サイドバー要素:', {
      sidebar: !!this.sidebar,
      toggleBtn: !!this.toggleBtn,
      hideBtn: !!this.hideBtn
    });
  }

  initializeSidebar() {
    if (!this.sidebar) {
      console.warn('サイドバー要素が見つかりません');
      return;
    }

    if (Utils.isMobile()) {
      this.sidebar.style.display = 'none';
      if (this.toggleBtn) this.toggleBtn.style.display = 'none';
    } else {
      this.sidebar.style.display = 'flex';
      
      // 前回の表示状態を復元
      const savedState = localStorage.getItem('sidebarVisible');
      if (savedState !== null) {
        this.sidebarVisible = savedState === 'true';
      }
      
      this.applySidebarState();
    }
  }

  applySidebarState() {
    if (!this.sidebar) return;

    if (this.sidebarVisible) {
      this.sidebar.style.transform = 'translateX(0)';
      this.sidebar.style.visibility = 'visible';
      this.sidebar.classList.remove('hidden');
      if (this.toggleBtn) this.toggleBtn.style.display = 'none';
      this.updateMainContentMargin(true);
    } else {
      this.sidebar.style.transform = 'translateX(-100%)';
      this.sidebar.style.visibility = 'hidden';
      this.sidebar.classList.add('hidden');
      if (this.toggleBtn) {
        this.toggleBtn.style.display = 'flex';
        Object.assign(this.toggleBtn.style, {
          position: 'fixed',
          top: '15px',
          left: '15px',
          zIndex: '1001'
        });
      }
      this.updateMainContentMargin(false);
    }

    this.updateToggleIcon();
    localStorage.setItem('sidebarVisible', this.sidebarVisible.toString());
  }

  updateToggleIcon() {
    if (!this.toggleBtn) return;
    
    const icon = this.toggleBtn.querySelector('i');
    if (icon) {
      if (this.sidebarVisible) {
        icon.className = 'fas fa-bars';
        this.toggleBtn.title = 'サイドバーを非表示';
      } else {
        icon.className = 'fas fa-chevron-right';
        this.toggleBtn.title = 'サイドバーを表示';
        Object.assign(this.toggleBtn.style, {
          backgroundColor: '#2196f3',
          color: 'white',
          border: '1px solid #0d7377',
          borderRadius: '4px',
          padding: '8px 12px'
        });
      }
    }
  }

  updateMainContentMargin(visible) {
    const mainContent = Utils.getElement('.main-content');
    if (!mainContent) return;

    if (visible) {
      mainContent.style.marginLeft = '380px';
      mainContent.classList.remove('expanded');
    } else {
      mainContent.style.marginLeft = '0';
      mainContent.classList.add('expanded');
    }
    
    mainContent.style.transition = 'margin-left 0.3s ease';
  }

  toggle() {
    if (Utils.isMobile()) return;
    Utils.debugLog('サイドバートグル実行:', this.sidebarVisible);
    this.sidebarVisible = !this.sidebarVisible;
    this.applySidebarState();
  }

  forceShow() {
    if (Utils.isMobile()) return;
    
    this.sidebarVisible = true;
    this.applySidebarState();
    Utils.debugLog('サイドバー強制表示実行');
    
    if (this.toggleBtn) {
      this.toggleBtn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        this.toggleBtn.style.transform = 'scale(1)';
      }, 200);
    }
  }

  hide() {
    if (Utils.isMobile()) return;
    Utils.debugLog('サイドバー非表示実行');
    this.sidebarVisible = false;
    this.applySidebarState();
  }

  setupEventListeners() {
    // トグルボタンイベント
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Utils.debugLog('トグルボタンクリック');
        this.toggle();
      });
      
      this.toggleBtn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.forceShow();
      });
      
      this.toggleBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.forceShow();
      });
    } else {
      console.warn('トグルボタンが見つかりません');
    }

    // 非表示ボタンイベント
    if (this.hideBtn) {
      this.hideBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Utils.debugLog('非表示ボタンクリック');
        this.hide();
      });
    } else {
      console.warn('非表示ボタンが見つかりません');
    }

    // キーボードショートカット
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        this.toggle();
      }
    });

    // リサイズ処理
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    if (Utils.isMobile()) {
      if (this.sidebar) this.sidebar.style.display = 'none';
      if (this.toggleBtn) this.toggleBtn.style.display = 'none';
    } else {
      if (this.sidebar) {
        this.sidebar.style.display = 'flex';
        this.applySidebarState();
      }
    }
  }

  initializeUserIcon() {
    // ユーザーアイコンのドロップダウンメニューを初期化
    try {
      SimpleAuth.initUserIcon();
    } catch (error) {
      console.error('ユーザーアイコン初期化エラー:', error.message);
    }
  }
}

// ナビゲーション関連の関数
export function updateActiveNavigation() {
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop() || 'index.html';
  
  Utils.debugLog('現在のパス:', currentPath, 'ファイル:', currentFile);
  
  const sidebarLinks = Utils.getElements('.menu a');
  const bottomNavLinks = Utils.getElements('.bottom-navigation .nav-item');
  
  // 全てのアクティブクラスを削除
  sidebarLinks.forEach(link => link.classList.remove('active'));
  bottomNavLinks.forEach(link => link.classList.remove('active'));
  
  // 現在のファイルに対応する項目をアクティブにする
  sidebarLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentFile || 
        (currentFile === '' && linkHref === 'index.html') ||
        (currentPath.includes('index') && linkHref === 'index.html')) {
      link.classList.add('active');
      Utils.debugLog('サイドバーアクティブ設定:', linkHref);
    }
  });
  
  bottomNavLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentFile || 
        (currentFile === '' && linkHref === 'index.html') ||
        (currentPath.includes('index') && linkHref === 'index.html')) {
      link.classList.add('active');
      Utils.debugLog('ボトムナビアクティブ設定:', linkHref);
    }
  });
}