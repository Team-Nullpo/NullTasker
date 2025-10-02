// ユーザー登録ページの機能
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('passwordConfirm');
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordConfirmToggle = document.getElementById('passwordConfirmToggle');
  const passwordStrength = document.getElementById('passwordStrength');
  const passwordMatch = document.getElementById('passwordMatch');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  const registerBtn = registerForm.querySelector('.register-btn');

  // パスワード表示/非表示切り替え
  passwordToggle.addEventListener('click', function() {
    togglePasswordVisibility(passwordInput, passwordToggle);
  });

  passwordConfirmToggle.addEventListener('click', function() {
    togglePasswordVisibility(passwordConfirmInput, passwordConfirmToggle);
  });

  function togglePasswordVisibility(input, toggle) {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    
    const icon = toggle.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  }

  // パスワード強度チェック
  passwordInput.addEventListener('input', function() {
    checkPasswordStrength(this.value);
    checkPasswordMatch();
  });

  // パスワード一致チェック
  passwordConfirmInput.addEventListener('input', function() {
    checkPasswordMatch();
  });

  function checkPasswordStrength(password) {
    if (!password) {
      passwordStrength.textContent = '';
      passwordStrength.className = 'password-strength';
      return;
    }

    let score = 0;
    let feedback = [];

    // 長さチェック
    if (password.length >= 8) score++;
    else feedback.push('8文字以上');

    // 大文字チェック
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('大文字');

    // 小文字チェック
    if (/[a-z]/.test(password)) score++;
    else feedback.push('小文字');

    // 数字チェック
    if (/\d/.test(password)) score++;
    else feedback.push('数字');

    // 強度表示
    if (score < 3) {
      passwordStrength.className = 'password-strength weak';
      passwordStrength.textContent = `弱い - 不足: ${feedback.join(', ')}`;
    } else if (score < 5) {
      passwordStrength.className = 'password-strength medium';
      passwordStrength.textContent = `中程度 - 不足: ${feedback.join(', ')}`;
    } else {
      passwordStrength.className = 'password-strength strong';
      passwordStrength.textContent = '強い - 安全なパスワードです';
    }
  }

  function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = passwordConfirmInput.value;

    if (!confirmPassword) {
      passwordMatch.textContent = '';
      passwordMatch.className = 'password-match';
      return;
    }

    if (password === confirmPassword) {
      passwordMatch.className = 'password-match match';
      passwordMatch.textContent = '✓ パスワードが一致しています';
    } else {
      passwordMatch.className = 'password-match no-match';
      passwordMatch.textContent = '✗ パスワードが一致しません';
    }
  }

  // フォーム送信処理
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // フォームデータ取得
    const formData = new FormData(registerForm);
    const registerData = {
      loginId: formData.get('loginId').trim(),
      displayName: formData.get('displayName').trim(),
      email: formData.get('email').trim(),
      password: formData.get('password'),
      passwordConfirm: formData.get('passwordConfirm')
    };

    // クライアントサイド検証
    if (!validateForm(registerData)) {
      return;
    }

    // ローディング状態開始
    setLoadingState(true);
    hideMessages();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginId: registerData.loginId,
          displayName: registerData.displayName,
          email: registerData.email,
          password: registerData.password
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 登録成功
        showSuccess('ユーザー登録が完了しました。ログインページに移動します...');
        
        // 3秒後にログインページへリダイレクト
        setTimeout(() => {
          window.location.href = 'login.html?registered=true';
        }, 3000);
        
      } else {
        // 登録失敗
        showError(result.message || '登録に失敗しました。');
      }
    } catch (error) {
      console.error('登録エラー:', error);
      showError('ネットワークエラーが発生しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setLoadingState(false);
    }
  });

  // フォーム検証
  function validateForm(data) {
    // ログインID検証
    if (!data.loginId) {
      showError('ログインIDを入力してください。');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(data.loginId)) {
      showError('ログインIDは3-20文字の英数字、アンダースコア、ハイフンのみ使用可能です。');
      return false;
    }

    // 表示名検証
    if (!data.displayName) {
      showError('表示名を入力してください。');
      return false;
    }
    if (data.displayName.length > 50) {
      showError('表示名は50文字以内で入力してください。');
      return false;
    }

    // メールアドレス検証
    if (!data.email) {
      showError('メールアドレスを入力してください。');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showError('有効なメールアドレスを入力してください。');
      return false;
    }

    // パスワード検証
    if (!data.password) {
      showError('パスワードを入力してください。');
      return false;
    }
    if (data.password.length < 8) {
      showError('パスワードは8文字以上で入力してください。');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_-]+$/.test(data.password)) {
      showError('パスワードは8文字以上で、大文字・小文字・数字をそれぞれ1文字以上含む必要があります。');
      return false;
    }

    // パスワード確認検証
    if (!data.passwordConfirm) {
      showError('パスワード確認を入力してください。');
      return false;
    }
    if (data.password !== data.passwordConfirm) {
      showError('パスワードが一致しません。');
      return false;
    }

    // 利用規約同意チェック
    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!agreeTerms) {
      showError('利用規約とプライバシーポリシーに同意してください。');
      return false;
    }

    return true;
  }

  // エラーメッセージ表示
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    
    // スクロールしてメッセージを表示
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    setTimeout(() => {
      errorMessage.style.animation = 'fadeIn 0.3s ease-out';
    }, 10);
  }

  // 成功メッセージ表示
  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    setTimeout(() => {
      successMessage.style.animation = 'fadeIn 0.3s ease-out';
    }, 10);
  }

  // メッセージ非表示
  function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    errorMessage.style.animation = '';
    successMessage.style.animation = '';
  }

  // ローディング状態の制御
  function setLoadingState(loading) {
    if (loading) {
      registerBtn.classList.add('loading');
      registerBtn.disabled = true;
    } else {
      registerBtn.classList.remove('loading');
      registerBtn.disabled = false;
    }
  }

  // 入力フィールドのエラー状態をクリア
  const inputs = registerForm.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      hideMessages();
      // リアルタイム検証のフィードバックを更新
      if (input.id === 'password') {
        checkPasswordStrength(input.value);
      }
      if (input.id === 'passwordConfirm' || input.id === 'password') {
        checkPasswordMatch();
      }
    });
  });

  // Enterキーでフォーカス移動
  const focusOrder = ['loginId', 'displayName', 'email', 'password', 'passwordConfirm'];
  focusOrder.forEach((id, index) => {
    const element = document.getElementById(id);
    if (element && index < focusOrder.length - 1) {
      element.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById(focusOrder[index + 1]).focus();
        }
      });
    }
  });

  // 最後の入力欄でEnterキーを押したらフォーム送信
  document.getElementById('passwordConfirm').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (document.getElementById('agreeTerms').checked) {
        registerForm.dispatchEvent(new Event('submit'));
      } else {
        document.getElementById('agreeTerms').focus();
      }
    }
  });
});
