import { Utils } from './utils.js';

// 設定管理クラス
export class SettingsManager {
  constructor() {
    this.settings = this.getDefaultSettings();
    this.init();
  }

  getDefaultSettings() {
    return {
      users: ['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲', '高橋健一'],
      categories: ['企画', '開発', 'デザイン', 'テスト', 'ドキュメント', '会議', 'その他'],
      projectName: 'NullTasker Project',
      projectDescription: 'チームでのタスク管理を効率化するプロジェクトです。',
      notifications: {
        email: true,
        desktop: false,
        taskReminder: true
      },
      display: {
        theme: 'light',
        language: 'ja',
        tasksPerPage: 20
      }
    };
  }

  init() {
    this.loadSettings();
    
    if (Utils.getElement('.settings-container')) {
      this.renderSettings();
      this.setupEventListeners();
      this.setupSettingsButtons(); // 新しいメソッド追加
    }
  }

  loadSettings() {
    const saved = Utils.getFromStorage('appSettings');
    if (saved) {
      this.settings = { ...this.settings, ...saved };
    }
  }

  saveSettings() {
    Utils.saveToStorage('appSettings', this.settings);
    this.updateGlobalSettings();
  }

  updateGlobalSettings() {
    const globalSettings = {
      categories: this.settings.categories,
      users: this.settings.users,
      priorities: [
        { value: 'high', label: '高優先度', color: '#c62828' },
        { value: 'medium', label: '中優先度', color: '#ef6c00' },
        { value: 'low', label: '低優先度', color: '#2e7d32' }
      ],
      statuses: [
        { value: 'todo', label: '未着手', color: '#666' },
        { value: 'in_progress', label: '進行中', color: '#1976d2' },
        { value: 'review', label: 'レビュー中', color: '#f57c00' },
        { value: 'done', label: '完了', color: '#388e3c' }
      ]
    };
    
    if (window.taskManager) {
      window.taskManager.settings = globalSettings;
    }
  }

  renderSettings() {
    this.renderProjectSettings();
    this.renderUsers();
    this.renderCategories();
    this.renderNotificationSettings();
    this.renderDisplaySettings();
    this.updateStorageInfo();
  }

  renderProjectSettings() {
    const projectName = Utils.getElement('#projectName');
    const projectDescription = Utils.getElement('#projectDescription');
    
    if (projectName) projectName.value = this.settings.projectName;
    if (projectDescription) projectDescription.value = this.settings.projectDescription;
  }

  renderUsers() {
    const usersList = Utils.getElement('#membersList'); // 修正: HTMLのIDに合わせる
    if (!usersList) return;

    usersList.innerHTML = '';
    this.settings.users.forEach((user, index) => {
      const userItem = this.createListItem(user, () => this.removeUser(index));
      usersList.appendChild(userItem);
    });
  }

  renderCategories() {
    const categoriesList = Utils.getElement('#categoriesList');
    if (!categoriesList) return;

    categoriesList.innerHTML = '';
    this.settings.categories.forEach((category, index) => {
      const categoryItem = this.createListItem(category, () => this.removeCategory(index));
      categoriesList.appendChild(categoryItem);
    });
  }

  createListItem(text, removeCallback) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span>${text}</span>
      <button class="remove-btn">
        <i class="fas fa-times"></i> 削除
      </button>
    `;
    
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', removeCallback);
    
    return item;
  }

  renderNotificationSettings() {
    const settings = [
      { id: '#emailNotification', value: this.settings.notifications.email },
      { id: '#desktopNotification', value: this.settings.notifications.desktop },
      { id: '#taskReminder', value: this.settings.notifications.taskReminder }
    ];

    settings.forEach(({ id, value }) => {
      const element = Utils.getElement(id);
      if (element) element.checked = value;
    });
  }

  renderDisplaySettings() {
    const settings = [
      { id: '#theme', value: this.settings.display.theme },
      { id: '#language', value: this.settings.display.language },
      { id: '#tasksPerPage', value: this.settings.display.tasksPerPage }
    ];

    settings.forEach(({ id, value }) => {
      const element = Utils.getElement(id);
      if (element) element.value = value;
    });
  }

  updateStorageInfo() {
    const storageUsed = this.calculateStorageUsage();
    const storageBar = Utils.getElement('.storage-used');
    const storageText = Utils.getElement('.storage-info p');
    
    if (storageBar && storageText) {
      const percentage = Math.min((storageUsed / (10 * 1024 * 1024)) * 100, 100);
      storageBar.style.width = `${percentage}%`;
      storageText.textContent = `使用量: ${Utils.formatBytes(storageUsed)} / 10MB`;
    }
  }

  calculateStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    return total;
  }

  setupEventListeners() {
    // プロジェクト設定
    this.setupProjectSettings();
    
    // 通知設定
    this.setupNotificationSettings();
    
    // 表示設定
    this.setupDisplaySettings();
    
    // メンバーとカテゴリー管理
    this.setupMemberManagement();
    this.setupCategoryManagement();
  }

  setupProjectSettings() {
    const projectName = Utils.getElement('#projectName');
    const projectDescription = Utils.getElement('#projectDescription');
    
    if (projectName) {
      projectName.addEventListener('change', (e) => {
        this.settings.projectName = e.target.value;
      });
    }
    
    if (projectDescription) {
      projectDescription.addEventListener('change', (e) => {
        this.settings.projectDescription = e.target.value;
      });
    }
  }

  setupNotificationSettings() {
    const notifications = [
      { id: '#emailNotification', key: 'email' },
      { id: '#desktopNotification', key: 'desktop' },
      { id: '#taskReminder', key: 'taskReminder' }
    ];
    
    notifications.forEach(({ id, key }) => {
      const element = Utils.getElement(id);
      if (element) {
        element.addEventListener('change', (e) => {
          this.settings.notifications[key] = e.target.checked;
        });
      }
    });
  }

  setupDisplaySettings() {
    const displaySettings = ['language', 'tasksPerPage'];
    
    displaySettings.forEach(setting => {
      const element = Utils.getElement(`#${setting}`);
      if (element) {
        element.addEventListener('change', (e) => {
          this.settings.display[setting] = e.target.value;
        });
      }
    });
  }

  setupMemberManagement() {
    const addMemberBtn = Utils.getElement('#addMemberBtn');
    const memberInput = Utils.getElement('#memberInput');
    
    console.log('メンバー管理要素:', { addMemberBtn: !!addMemberBtn, memberInput: !!memberInput });
    
    if (addMemberBtn) {
      addMemberBtn.addEventListener('click', () => this.addMember());
    }
    
    if (memberInput) {
      memberInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addMember();
        }
      });
    }
  }

  setupCategoryManagement() {
    const addCategoryBtn = Utils.getElement('#addCategoryBtn');
    const categoryInput = Utils.getElement('#categoryInput');
    
    console.log('カテゴリー管理要素:', { addCategoryBtn: !!addCategoryBtn, categoryInput: !!categoryInput });
    
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', () => this.addCategory());
    }
    
    if (categoryInput) {
      categoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addCategory();
        }
      });
    }
  }

  setupSettingsButtons() {
    const buttons = {
      saveSettingsBtn: () => this.saveAllSettings(),
      resetSettingsBtn: () => this.resetSettings(),
      exportDataBtn: () => this.exportData(),
      importDataBtn: () => this.importData(),
      clearDataBtn: () => this.clearAllData()
    };

    Object.entries(buttons).forEach(([id, handler]) => {
      const element = Utils.getElement(`#${id}`);
      if (element) {
        element.addEventListener('click', handler);
      }
    });

    // ファイル入力のセットアップ
    const importFileInput = Utils.getElement('#importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }
  }

  addMember() {
    const memberInput = Utils.getElement('#memberInput'); // 修正: HTMLのIDに合わせる
    if (!memberInput) return;

    const userName = memberInput.value.trim();
    if (!userName) return;

    if (this.settings.users.includes(userName)) {
      Utils.showNotification('このメンバーは既に存在します', 'warning');
      return;
    }

    this.settings.users.push(userName);
    this.renderUsers();
    memberInput.value = '';
    Utils.showNotification('メンバーが追加されました', 'success');
  }

  removeUser(index) {
    if (confirm('このユーザーを削除しますか？')) {
      this.settings.users.splice(index, 1);
      this.renderUsers();
      Utils.showNotification('ユーザーが削除されました', 'success');
    }
  }

  addCategory() {
    const categoryInput = Utils.getElement('#categoryInput'); // 修正: HTMLのIDに合わせる
    if (!categoryInput) return;

    const categoryName = categoryInput.value.trim();
    if (!categoryName) return;

    if (this.settings.categories.includes(categoryName)) {
      Utils.showNotification('このカテゴリは既に存在します', 'warning');
      return;
    }

    this.settings.categories.push(categoryName);
    this.renderCategories();
    categoryInput.value = '';
    Utils.showNotification('カテゴリが追加されました', 'success');
  }

  removeCategory(index) {
    if (confirm('このカテゴリを削除しますか？')) {
      this.settings.categories.splice(index, 1);
      this.renderCategories();
      Utils.showNotification('カテゴリが削除されました', 'success');
    }
  }

  exportData() {
    const data = {
      settings: this.settings,
      tasks: Utils.getFromStorage('tasks', []),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nulltasker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Utils.showNotification('データがエクスポートされました', 'success');
  }

  importData() {
    const fileInput = Utils.getElement('#importFile');
    if (fileInput) fileInput.click();
  }

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (confirm('現在のデータを上書きしますか？この操作は元に戻せません。')) {
          if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
            this.renderSettings();
          }
          
          if (data.tasks) {
            Utils.saveToStorage('tasks', data.tasks);
          }
          
          this.saveSettings();
          Utils.showNotification('データがインポートされました', 'success');
          
          setTimeout(() => location.reload(), 1500);
        }
      } catch (error) {
        Utils.showNotification('ファイルの読み込みに失敗しました', 'error');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  }

  clearAllData() {
    if (confirm('全てのデータを削除しますか？この操作は元に戻せません。')) {
      if (confirm('本当にすべてのデータを削除しますか？')) {
        localStorage.clear();
        Utils.showNotification('全データが削除されました', 'success');
        setTimeout(() => location.reload(), 1500);
      }
    }
  }

  saveAllSettings() {
    this.saveSettings();
    // テーマの変更をすぐに保存
    const theme = this.settings.display.theme;
    Utils.saveToStorage('userTheme', theme);
    this.applyTheme(theme);
    Utils.showNotification('設定が保存されました', 'success');
  }

  resetSettings() {
    if (confirm('設定をリセットしますか？')) {
      localStorage.removeItem('appSettings');
      this.settings = this.getDefaultSettings();
      this.renderSettings();
      Utils.showNotification('設定がリセットされました', 'success');
    }
  }
}

// グローバル関数として設定関数を公開
export const settingsFunctions = {
  addUser: () => window.settingsManager?.addUser(),
  addCategory: () => window.settingsManager?.addCategory(),
  exportData: () => window.settingsManager?.exportData(),
  importData: () => window.settingsManager?.importData(),
  handleFileImport: (event) => window.settingsManager?.handleFileImport(event),
  clearAllData: () => window.settingsManager?.clearAllData(),
  saveSettings: () => window.settingsManager?.saveAllSettings(),
  resetSettings: () => window.settingsManager?.resetSettings()
};