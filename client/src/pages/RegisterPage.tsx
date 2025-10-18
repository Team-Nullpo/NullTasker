import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import '../styles/login.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        loginId: formData.loginId,
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        alert('登録が完了しました。ログインしてください。');
        navigate('/login');
      } else {
        setError(response.message || '登録に失敗しました');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>新規登録</h1>
          <p>NullTasker アカウント作成</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="loginId">ログインID *</label>
            <input
              type="text"
              id="loginId"
              name="loginId"
              value={formData.loginId}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="半角英数字3-20文字"
              pattern="[a-zA-Z0-9_]{3,20}"
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">表示名 *</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="表示名を入力"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">メールアドレス *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="example@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="8文字以上"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">パスワード（確認） *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="パスワードを再入力"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
          >
            {isLoading ? '登録中...' : '登録'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            すでにアカウントをお持ちの方は
            <Link to="/login">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
