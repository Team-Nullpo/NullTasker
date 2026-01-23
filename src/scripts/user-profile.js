// user-profile.js - 個人設定ページの機能
import { Utils } from './utils.js';
import { SimpleAuth } from './simple-auth.js';
import { UserManager } from './user-manager.js';

export class UserProfileManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    try {
      // 認証チェック
      if (!SimpleAuth.isLoggedIn()) {
        window.location.href = '/login.html';
        return;
      }

      this.currentUser = SimpleAuth.getCurrentUser();

      this.loadUserData();
      this.setupEventListeners();
      this.loadPersonalSettings();

    } catch (error) {
      console.error('初期化エラー:', error);
      this.showError('初期化に失敗しました');
    }
  }

  loadUserData() {
    // JWTトークンから取得したユーザー情報を使用
    const userData = this.currentUser;
    if (!userData) {
      this.showError("ユーザー情報を取得できませんでした");
      console.log("ユーザーが見つかりませんでした");
      return;
    }

    // フォームに現在の値を設定
    document.getElementById('loginId').value = userData.loginId || userData.id;
    document.getElementById('displayName').value = userData.displayName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('currentRole').value = this.getRoleDisplayName(userData.role);
  }

  setupEventListeners() {
    // プロフィールフォーム
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', this.handleProfileSubmit.bind(this));
    }

    // パスワードフォーム
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', this.handlePasswordSubmit.bind(this));
    }

    // 個人設定フォーム
    const personalSettingsForm = document.getElementById('personalSettingsForm');
    if (personalSettingsForm) {
      personalSettingsForm.addEventListener('submit', this.handlePersonalSettingsSubmit.bind(this));
    }

    // キャンセルボタン
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.loadUserData(); // 元の値に戻す
      });
    }

    // パスワード表示切り替え
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', this.togglePasswordVisibility.bind(this));
    });

    // パスワード強度チェック
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', this.checkPasswordStrength.bind(this));
    }

    // パスワード一致チェック
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', this.checkPasswordMatch.bind(this));
    }
  }

  async handleProfileSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const profileData = {
      displayName: formData.get('displayName'),
      email: formData.get('email')
    };

    if (!await UserManager.updateProfile(profileData)) {
      this.showError("プロフィール更新に失敗しました");
      return;
    }

    // 認証マネージャーのユーザー情報を更新
    SimpleAuth.updateCurrentUser(profileData);
    this.showSuccess('プロフィールを更新しました');
    // ユーザーアイコンを更新
    SimpleAuth.initUserIcon();
  }

  async handlePasswordSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const passwordData = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword')
    };

    // パスワード確認
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      this.showError('新しいパスワードと確認パスワードが一致しません');
      return;
    }

    // パスワード強度チェック
    if (passwordData.newPassword.length < 6) {
      this.showError('パスワードは6文字以上で入力してください');
      return;
    }

    if (!await UserManager.updatePassword(passwordData)) {
      this.showError("パスワード変更に失敗しました");
      return;
    }
    this.showSuccess('パスワードを変更しました');

    // フォームをクリア
    event.target.reset();

    // パスワード強度表示をクリア
    document.getElementById('passwordStrength').innerHTML = '';
    document.getElementById('passwordMatch').innerHTML = '';
  }

  async handlePersonalSettingsSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const settingsData = {
      theme: formData.get('theme'),
      language: formData.get('language'),
      timezone: formData.get('timezone'),
      emailNotifications: formData.has('emailNotifications'),
      browserNotifications: formData.has('browserNotifications')
    };

    try {
      // テーマをローカルストレージに保存
      Utils.saveToStorage('userTheme', settingsData.theme);

      // その他の設定もローカルストレージに保存
      localStorage.setItem('userPersonalSettings', JSON.stringify(settingsData));

      // サーバーにも保存（オプション）
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        this.showSuccess('個人設定を保存しました');
      } else {
        // サーバー保存に失敗してもローカル保存は成功
        this.showSuccess('個人設定を保存しました（ローカルのみ）');
      }

      // 設定をすぐに適用
      this.applyPersonalSettings(settingsData);

    } catch (error) {
      console.error('個人設定保存エラー:', error);
      this.showError('個人設定の保存に失敗しました');
    }
  }

  loadPersonalSettings() {
    try {
      // テーマ設定を読み込み
      const savedTheme = Utils.getFromStorage('userTheme') || 'light';
      const themeSelect = document.getElementById('theme');
      if (themeSelect) {
        themeSelect.value = savedTheme;
      }

      // その他の設定を読み込み
      const savedSettings = localStorage.getItem('userPersonalSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        // フォームに値を設定
        if (settings.language) document.getElementById('language').value = settings.language;
        if (settings.timezone) document.getElementById('timezone').value = settings.timezone;

        document.getElementById('emailNotifications').checked = settings.emailNotifications || false;
        document.getElementById('browserNotifications').checked = settings.browserNotifications || false;

        // 言語設定を適用
        if (settings.language) {
          document.documentElement.lang = settings.language;
        }
      }

      // テーマ変更のイベントリスナーを追加
      if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
          this.applyTheme(e.target.value);
        });
      }
    } catch (error) {
      console.error('個人設定読み込みエラー:', error);
    }
  }

  applyTheme(theme) {
    // 既存のテーマクラスを削除
    document.body.className = document.body.className.replace(/theme-\w+/g, '');

    if (theme === 'auto') {
      // システムのテーマ設定を検出
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      // 指定されたテーマを適用
      document.body.classList.add(`theme-${theme}`);
    }

    // ローカルストレージに保存
    Utils.saveToStorage('userTheme', theme);
  }

  applyPersonalSettings(settings) {
    // テーマ適用
    if (settings.theme) {
      this.applyTheme(settings.theme);
    }

    // 言語設定（今後の多言語対応用）
    if (settings.language) {
      document.documentElement.lang = settings.language;
    }
  }

  togglePasswordVisibility(event) {
    const button = event.currentTarget;
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }

  checkPasswordStrength(event) {
    const password = event.target.value;
    const strengthDiv = document.getElementById('passwordStrength');

    if (!password) {
      strengthDiv.innerHTML = '';
      return;
    }

    let strength = 0;
    let feedback = [];

    // 長さチェック
    if (password.length >= 8) strength++;
    else feedback.push('8文字以上');

    // 大文字チェック
    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('大文字');

    // 小文字チェック
    if (/[a-z]/.test(password)) strength++;
    else feedback.push('小文字');

    // 数字チェック
    if (/\d/.test(password)) strength++;
    else feedback.push('数字');

    // 特殊文字チェック
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    else feedback.push('特殊文字');

    const levels = [
      { class: 'weak', text: '弱い', color: '#dc3545' },
      { class: 'fair', text: '普通', color: '#ffc107' },
      { class: 'good', text: '良い', color: '#17a2b8' },
      { class: 'strong', text: '強い', color: '#28a745' }
    ];

    const level = Math.min(Math.floor(strength / 2), levels.length - 1);
    const levelInfo = levels[level];

    strengthDiv.innerHTML = `
      <div class="strength-meter">
        <div class="strength-bar strength-${levelInfo.class}" style="width: ${(strength / 5) * 100}%"></div>
      </div>
      <div class="strength-text" style="color: ${levelInfo.color}">
        パスワード強度: ${levelInfo.text}
        ${feedback.length > 0 ? `<br><small>推奨: ${feedback.join(', ')}を含める</small>` : ''}
      </div>
    `;
  }

  checkPasswordMatch(event) {
    const confirmPassword = event.target.value;
    const newPassword = document.getElementById('newPassword').value;
    const matchDiv = document.getElementById('passwordMatch');

    if (!confirmPassword) {
      matchDiv.innerHTML = '';
      return;
    }

    if (confirmPassword === newPassword) {
      matchDiv.innerHTML = '<div style="color: #28a745;"><i class="fas fa-check"></i> パスワードが一致しています</div>';
    } else {
      matchDiv.innerHTML = '<div style="color: #dc3545;"><i class="fas fa-times"></i> パスワードが一致しません</div>';
    }
  }

  getRoleDisplayName(role) {
    const roleNames = {
      'system_admin': 'システム管理者',
      'project_admin': 'プロジェクト管理者',
      'member': 'メンバー'
    };
    return roleNames[role] || 'ゲスト';
  }

  showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    successText.textContent = message;
    successDiv.style.display = 'block';

    // エラーメッセージを隠す
    document.getElementById('errorMessage').style.display = 'none';

    // 3秒後に自動で隠す
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);

    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    errorText.textContent = message;
    errorDiv.style.display = 'block';

    // 成功メッセージを隠す
    document.getElementById('successMessage').style.display = 'none';

    // 5秒後に自動で隠す
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);

    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}