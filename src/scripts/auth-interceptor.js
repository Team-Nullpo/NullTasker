// 認証インターセプター - fetch をラップして認証エラーを自動的に処理
// すべての API リクエストで 401/403 エラー時にログイン画面へリダイレクト

export class AuthInterceptor {
  static isRedirecting = false;

  static init() {
    // オリジナルの fetch を保存
    const originalFetch = window.fetch;

    // fetch をオーバーライド
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        // 認証エラーチェック（401 Unauthorized または 403 Forbidden）
        if ((response.status === 401 || response.status === 403) && !AuthInterceptor.isRedirecting) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          
          // API エンドポイントへのリクエストのみチェック（ログイン/登録 API は除外）
          if (url.includes('/api/') && !url.includes('/api/login') && !url.includes('/api/register')) {
            AuthInterceptor.handleAuthError();
          }
        }
        
        return response;
      } catch (error) {
        // ネットワークエラーなどはそのまま投げる
        throw error;
      }
    };
    
    console.log('認証インターセプターを初期化しました');
  }

  static handleAuthError() {
    if (this.isRedirecting) {
      return; // 既にリダイレクト中の場合は何もしない
    }
    
    this.isRedirecting = true;
    
    console.warn('認証エラーが発生しました。ログイン画面に遷移します。');
    
    // 認証情報をクリア
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    
    // 少し遅延させてから遷移（他の処理が完了するのを待つ）
    setTimeout(() => {
      window.location.href = '/src/pages/login.html';
    }, 100);
  }
}
