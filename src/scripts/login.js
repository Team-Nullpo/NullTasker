// ログインページの機能
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('errorMessage');
  const loginBtn = loginForm.querySelector('.login-btn');

  // パスワード表示/非表示切り替え
  passwordToggle.addEventListener('click', function() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    const icon = passwordToggle.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  });

  // ログインフォーム送信処理
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const loginData = {
      loginId: formData.get('loginId'),
      password: formData.get('password'),
      rememberMe: formData.get('rememberMe') === 'on'
    };

    // バリデーション
    if (!loginData.loginId || !loginData.password) {
      showError('ログインIDとパスワードを入力してください。');
      return;
    }

    // ローディング状態開始
    setLoadingState(true);
    hideError();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // ログイン成功
        if (loginData.rememberMe) {
          localStorage.setItem('authToken', result.token);
          localStorage.setItem('currentUser', JSON.stringify(result.user));
        } else {
          sessionStorage.setItem('authToken', result.token);
          sessionStorage.setItem('currentUser', JSON.stringify(result.user));
        }
        
        // リダイレクト先を確認
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/';
        
        window.location.href = redirectTo;
      } else {
        // ログイン失敗
        showError(result.message || 'ログインに失敗しました。');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      showError('ネットワークエラーが発生しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setLoadingState(false);
    }
  });

  // エラーメッセージ表示
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // 少し遅延してアニメーションを適用
    setTimeout(() => {
      errorMessage.style.animation = 'fadeIn 0.3s ease-out';
    }, 10);
  }

  // エラーメッセージ非表示
  function hideError() {
    errorMessage.style.display = 'none';
    errorMessage.style.animation = '';
  }

  // ローディング状態の制御
  function setLoadingState(loading) {
    if (loading) {
      loginBtn.classList.add('loading');
      loginBtn.disabled = true;
    } else {
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
    }
  }

  // 入力フィールドのエラー状態をクリア
  const inputs = loginForm.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', hideError);
  });

  // 既にログインしているかチェック
  checkExistingLogin();
  
  // 登録完了後のメッセージ表示
  checkRegistrationSuccess();

  function checkExistingLogin() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      // トークンの有効性を確認
      validateToken(token).then(isValid => {
        if (isValid) {
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get('redirect') || '/';
          window.location.href = redirectTo;
        } else {
          // 無効なトークンを削除
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('currentUser');
        }
      });
    }
  }

  // トークンの有効性を確認
  async function validateToken(token) {
    try {
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('トークン検証エラー:', error);
      return false;
    }
  }

  // 登録完了後のメッセージ表示
  function checkRegistrationSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ユーザー登録が完了しました。ログインしてください。
      `;
      
      // ログインフォームの前に挿入
      const loginForm = document.getElementById('loginForm');
      loginForm.parentNode.insertBefore(successDiv, loginForm);
      
      // 3秒後に非表示
      setTimeout(() => {
        successDiv.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => successDiv.remove(), 500);
      }, 3000);
    }
  }

  // Enterキーでフォーカス移動
  document.getElementById('loginId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('password').focus();
    }
  });

  // デモ用のログイン情報をヒント表示（開発環境でのみ）
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const demoInfo = document.createElement('div');
    demoInfo.innerHTML = `
      <div style="background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 12px; color: #1976d2;">
        <strong>デモ用ログイン情報:</strong><br>
        ID: admin<br>
        パスワード: admin123
      </div>
    `;
    document.querySelector('.login-footer').appendChild(demoInfo);
  }
});
