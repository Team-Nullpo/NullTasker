const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT秘密鍵（本番環境では必ず環境変数を使用）
const JWT_SECRET = process.env.JWT_SECRET || generateSecureSecret();

// 開発環境用の安全なシークレット生成
function generateSecureSecret() {
  if (process.env.NODE_ENV === 'production') {
    console.error('警告: 本番環境では必ずJWT_SECRET環境変数を設定してください');
    process.exit(1);
  }
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
}

// ミドルウェア
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));

// CORS設定を厳格化
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // 本番環境では特定ドメインのみ
    : ['http://localhost:3000', 'http://127.0.0.1:3000'], // 開発環境
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// レート制限設定
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回の試行
  message: {
    success: false,
    message: 'ログイン試行回数が上限に達しました。15分後に再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: {
    error: 'リクエスト制限に達しました。しばらく時間をおいて再試行してください。'
  }
});

app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api', generalLimiter);

// バリデーションルール
const loginValidation = [
  body('loginId')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ログインIDは3-20文字の英数字、アンダースコア、ハイフンのみ使用可能です'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('パスワードは8-128文字で入力してください')
];

const registerValidation = [
  body('loginId')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ログインIDは3-20文字の英数字、アンダースコア、ハイフンのみ使用可能です'),
  body('displayName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('表示名は1-50文字で入力してください'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('有効なメールアドレスを入力してください'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]/)
        .withMessage('パスワードは8文字以上で、大文字・小文字・数字をそれぞれ1文字以上含む必要があります')
];

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'アクセストークンが必要です' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '無効なトークンです' });
    }
    req.user = user;
    next();
  });
};

// ログインページは認証不要
const publicRoutes = ['/login.html', '/api/login', '/api/validate-token'];
const isPublicRoute = (path) => {
  return publicRoutes.some(route => path.includes(route));
};

// 静的ファイルの配信を新しいフォルダ構造に対応
// /src/パスでアクセスされるファイルをsrcディレクトリから配信
app.use('/src', express.static('src'));
// ルートレベルでも静的ファイルにアクセス可能にする
app.use('/scripts', express.static(path.join('src', 'scripts')));
app.use('/styles', express.static(path.join('src', 'styles')));
app.use('/assets', express.static(path.join('src', 'assets')));
app.use('/config', express.static('config'));

// ファイルパスを新しい構造に合わせて更新
const TICKETS_FILE = path.join(__dirname, 'config', 'tickets.json');
const SETTINGS_FILE = path.join(__dirname, 'config', 'settings.json');
const USERS_FILE = path.join(__dirname, 'config', 'users.json');

// ルートアクセス時にindex.htmlを返す（認証チェック付き）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
});

// ログインページ
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'login.html'));
});

// ログインページ（別ルート）
app.get('/src/pages/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'login.html'));
});

// 登録ページ
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'register.html'));
});

// index.htmlへの直接アクセスもサポート
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
});

// /pages/index.html へのアクセス
app.get('/pages/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
});

// /src/pages/index.html へのアクセス
app.get('/src/pages/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
});

// 個別ページのルーティング（.htmlファイルへの直接アクセスもサポート）
app.get('/task', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'task.html'));
});

app.get('/task.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'task.html'));
});

app.get('/src/pages/task.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'task.html'));
});

app.get('/calendar', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'calendar.html'));
});

app.get('/calendar.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'calendar.html'));
});

app.get('/src/pages/calendar.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'calendar.html'));
});

app.get('/gantt', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'gantt.html'));
});

app.get('/gantt.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'gantt.html'));
});

app.get('/src/pages/gantt.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'gantt.html'));
});

app.get('/setting', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'setting.html'));
});

app.get('/setting.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'setting.html'));
});

app.get('/src/pages/setting.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'setting.html'));
});

app.get('/debug-storage', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'debug-storage.html'));
});

app.get('/debug-storage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'debug-storage.html'));
});

app.get('/src/pages/debug-storage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'debug-storage.html'));
});

// ユーザー登録
app.post('/api/register', registerValidation, async (req, res) => {
  try {
    // バリデーションエラーチェック
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { loginId, displayName, email, password } = req.body;

    // ユーザーデータを読み込み
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(userData);

    // 既存ユーザーチェック
    const existingUser = users.users.find(u => u.id === loginId || u.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: '既に登録済みのログインIDまたはメールアドレスです' 
      });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 新しいユーザーを追加
    const newUser = {
      id: loginId,
      displayName,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.users.push(newUser);
    users.lastUpdated = new Date().toISOString();

    // ファイルに保存
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'ユーザー登録が完了しました'
    });

  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました' 
    });
  }
});

// ログイン
app.post('/api/login', loginValidation, async (req, res) => {
  try {
    // バリデーションエラーチェック
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { loginId, password, rememberMe } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'ログインIDとパスワードを入力してください' 
      });
    }

    // ユーザーデータを読み込み
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(userData);

    // ユーザーを検索
    const user = users.users.find(u => u.id === loginId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'ログインIDまたはパスワードが正しくありません' 
      });
    }

    // パスワード確認（bcryptでハッシュ化されたパスワードを確認）
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'ログインIDまたはパスワードが正しくありません' 
      });
    }

    // JWTトークンを生成（有効期間短縮）
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        displayName: user.displayName, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '15m' } // アクセストークンは15分
    );

    // リフレッシュトークンを生成
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d' } // リフレッシュトークンのみ長期間
    );

    // 最終ログイン時間を更新
    user.lastLogin = new Date().toISOString();
    users.lastUpdated = new Date().toISOString();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

    // パスワードを除外したユーザー情報を返す
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: userWithoutPassword,
      message: 'ログインに成功しました'
    });

  } catch (error) {
    console.error('ログインエラー:', error.message); // 詳細は隠す
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました' 
    });
  }
});

// トークン検証エンドポイント
app.post('/api/verify-token', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'トークンが提供されていません' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'トークンが無効です' 
        });
      }

      res.json({
        success: true,
        user: user,
        message: 'トークンは有効です'
      });
    });

  } catch (error) {
    console.error('トークン検証エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'サーバーエラーが発生しました' 
    });
  }
});

// リフレッシュトークン
app.post('/api/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'リフレッシュトークンが必要です'
      });
    }

    // リフレッシュトークンの検証
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(403).json({
        success: false,
        message: '無効なリフレッシュトークンです'
      });
    }

    // ユーザー情報を取得
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(userData);
    const user = users.users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    // 新しいアクセストークンを発行
    const newAccessToken = jwt.sign(
      { 
        id: user.id, 
        displayName: user.displayName, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      token: newAccessToken
    });

  } catch (error) {
    res.status(403).json({
      success: false,
      message: '無効なリフレッシュトークンです'
    });
  }
});

// トークン検証
app.post('/api/validate-token', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ログアウト
app.post('/api/logout', authenticateToken, (req, res) => {
  // JWTはステートレスなので、クライアント側でトークンを削除するだけ
  res.json({ success: true, message: 'ログアウトしました' });
});

// ユーザー情報取得
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // パスワードを除外して返す
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
  }
});

// プロフィール更新
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, email } = req.body;
    
    if (!displayName || !email) {
      return res.status(400).json({ error: '表示名とメールアドレスは必須です' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    const userIndex = data.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // メールアドレスの重複チェック
    const emailExists = data.users.some((u, index) => 
      u.email === email && index !== userIndex
    );
    
    if (emailExists) {
      return res.status(400).json({ error: 'このメールアドレスは既に使用されています' });
    }

    // プロフィール更新
    data.users[userIndex].displayName = displayName;
    data.users[userIndex].email = email;
    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'プロフィールを更新しました' });

  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ error: 'プロフィールの更新に失敗しました' });
  }
});

// パスワード変更
app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '現在のパスワードと新しいパスワードは必須です' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 現在のパスワード確認
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: '現在のパスワードが正しくありません' });
    }

    // 新しいパスワードをハッシュ化
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // パスワード更新
    const userIndex = data.users.findIndex(u => u.id === req.user.id);
    data.users[userIndex].password = hashedNewPassword;
    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'パスワードを変更しました' });

  } catch (error) {
    console.error('パスワード変更エラー:', error);
    res.status(500).json({ error: 'パスワードの変更に失敗しました' });
  }
});

// 個人設定保存
app.put('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    // 個人設定はクライアントサイドでローカルストレージに保存されるため、
    // サーバーサイドでは成功レスポンスのみ返す
    res.json({ success: true, message: '個人設定を保存しました' });

  } catch (error) {
    console.error('個人設定保存エラー:', error);
    res.status(500).json({ error: '個人設定の保存に失敗しました' });
  }
});

// === システム管理者専用API ===

// システム管理者権限チェックミドルウェア
const requireSystemAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'システム管理者権限が必要です' });
  }
  next();
};

// プロジェクトメンバー用ユーザー一覧取得
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    // 現在のユーザーの所属プロジェクトを取得
    const currentUser = data.users.find(u => u.id === req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 同じプロジェクトのメンバーのみを取得（パスワードは除外）
    const projectUsers = data.users.filter(user => {
      return user.projects.some(project => currentUser.projects.includes(project));
    }).map(user => {
      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role
      };
    });

    res.json({
      users: projectUsers,
      success: true
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});

// 全ユーザー・プロジェクトデータ取得
app.get('/api/admin/users', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    // パスワードを除外
    const usersWithoutPasswords = data.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      users: usersWithoutPasswords,
      projects: data.projects || [],
      lastUpdated: data.lastUpdated
    });

  } catch (error) {
    console.error('管理者データ取得エラー:', error);
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// ユーザー作成
app.post('/api/admin/users', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { loginId, displayName, email, role, password } = req.body;
    
    if (!loginId || !displayName || !email || !role || !password) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    // 重複チェック
    const existingUser = data.users.find(u => 
      u.id === loginId || u.loginId === loginId || u.email === email
    );
    
    if (existingUser) {
      return res.status(400).json({ error: 'ログインIDまたはメールアドレスが既に使用されています' });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 新ユーザー作成
    const newUser = {
      id: loginId,
      loginId: loginId,
      displayName: displayName,
      email: email,
      password: hashedPassword,
      role: role,
      projects: ['default'],
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    data.users.push(newUser);
    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'ユーザーを作成しました' });

  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    res.status(500).json({ error: 'ユーザーの作成に失敗しました' });
  }
});

// ユーザー更新
app.put('/api/admin/users/:userId', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, email, role, password } = req.body;
    
    if (!displayName || !email || !role) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // メールアドレスの重複チェック
    const emailExists = data.users.some((u, index) => 
      u.email === email && index !== userIndex
    );
    
    if (emailExists) {
      return res.status(400).json({ error: 'このメールアドレスは既に使用されています' });
    }

    // ユーザー更新
    data.users[userIndex].displayName = displayName;
    data.users[userIndex].email = email;
    data.users[userIndex].role = role;
    
    // パスワードが指定されている場合のみ更新
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      data.users[userIndex].password = hashedPassword;
    }

    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'ユーザーを更新しました' });

  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    res.status(500).json({ error: 'ユーザーの更新に失敗しました' });
  }
});

// ユーザー削除
app.delete('/api/admin/users/:userId', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 自分自身は削除できない
    if (userId === req.user.id) {
      return res.status(400).json({ error: '自分自身を削除することはできません' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // ユーザー削除
    data.users.splice(userIndex, 1);
    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'ユーザーを削除しました' });

  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    res.status(500).json({ error: 'ユーザーの削除に失敗しました' });
  }
});

// プロジェクト作成
app.post('/api/admin/projects', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { id, name, description, owner } = req.body;
    
    if (!id || !name || !owner) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    // プロジェクトID重複チェック
    const existingProject = data.projects?.find(p => p.id === id);
    if (existingProject) {
      return res.status(400).json({ error: 'プロジェクトIDが既に使用されています' });
    }

    // オーナーの存在チェック
    const ownerUser = data.users.find(u => u.id === owner);
    if (!ownerUser) {
      return res.status(400).json({ error: '指定されたオーナーが存在しません' });
    }

    // 新プロジェクト作成
    const newProject = {
      id: id,
      name: name,
      description: description || '',
      owner: owner,
      members: [owner],
      admins: [owner],
      settings: {
        categories: ['開発', 'デザイン', 'テスト', 'その他'],
        priorities: ['低', '中', '高', '緊急'],
        statuses: ['未着手', '進行中', 'レビュー中', '完了'],
        notifications: true,
        autoAssign: false
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (!data.projects) {
      data.projects = [];
    }
    
    data.projects.push(newProject);
    
    // オーナーのプロジェクトリストに追加
    const ownerIndex = data.users.findIndex(u => u.id === owner);
    if (ownerIndex !== -1) {
      if (!data.users[ownerIndex].projects) {
        data.users[ownerIndex].projects = [];
      }
      if (!data.users[ownerIndex].projects.includes(id)) {
        data.users[ownerIndex].projects.push(id);
      }
    }

    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'プロジェクトを作成しました' });

  } catch (error) {
    console.error('プロジェクト作成エラー:', error);
    res.status(500).json({ error: 'プロジェクトの作成に失敗しました' });
  }
});

// プロジェクト更新
app.put('/api/admin/projects/:projectId', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, owner } = req.body;
    
    if (!name || !owner) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    const projectIndex = data.projects?.findIndex(p => p.id === projectId);
    if (projectIndex === -1 || !data.projects) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    // オーナーの存在チェック
    const ownerUser = data.users.find(u => u.id === owner);
    if (!ownerUser) {
      return res.status(400).json({ error: '指定されたオーナーが存在しません' });
    }

    // プロジェクト更新
    data.projects[projectIndex].name = name;
    data.projects[projectIndex].description = description || '';
    data.projects[projectIndex].owner = owner;
    data.projects[projectIndex].lastUpdated = new Date().toISOString();

    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'プロジェクトを更新しました' });

  } catch (error) {
    console.error('プロジェクト更新エラー:', error);
    res.status(500).json({ error: 'プロジェクトの更新に失敗しました' });
  }
});

// プロジェクト削除
app.delete('/api/admin/projects/:projectId', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // デフォルトプロジェクトは削除できない
    if (projectId === 'default') {
      return res.status(400).json({ error: 'デフォルトプロジェクトは削除できません' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const data = JSON.parse(userData);
    
    const projectIndex = data.projects?.findIndex(p => p.id === projectId);
    if (projectIndex === -1 || !data.projects) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    // プロジェクト削除
    data.projects.splice(projectIndex, 1);
    
    // 全ユーザーのプロジェクトリストから削除
    data.users.forEach(user => {
      if (user.projects) {
        user.projects = user.projects.filter(p => p !== projectId);
      }
    });

    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'プロジェクトを削除しました' });

  } catch (error) {
    console.error('プロジェクト削除エラー:', error);
    res.status(500).json({ error: 'プロジェクトの削除に失敗しました' });
  }
});

// システム設定保存
app.put('/api/admin/system-settings', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const settingsData = req.body;
    
    // システム設定を保存（今後実装）
    res.json({ success: true, message: 'システム設定を保存しました' });

  } catch (error) {
    console.error('システム設定保存エラー:', error);
    res.status(500).json({ error: 'システム設定の保存に失敗しました' });
  }
});

// バックアップ作成
app.post('/api/admin/backup', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'config', 'backups');
    
    await fs.mkdir(backupDir, { recursive: true });
    
    // 全データのバックアップ
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const tasksData = await fs.readFile(TICKETS_FILE, 'utf8');
    const settingsData = await fs.readFile(SETTINGS_FILE, 'utf8');
    
    const backupData = {
      users: JSON.parse(userData),
      tasks: JSON.parse(tasksData),
      settings: JSON.parse(settingsData),
      backupDate: new Date().toISOString()
    };
    
    const backupFileName = `backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);
    
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'バックアップを作成しました',
      filename: backupFileName
    });

  } catch (error) {
    console.error('バックアップ作成エラー:', error);
    res.status(500).json({ error: 'バックアップの作成に失敗しました' });
  }
});

// データバックアップダウンロード
app.get('/api/admin/backup/download/data', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const tasksData = await fs.readFile(TICKETS_FILE, 'utf8');
    
    const backupData = {
      users: JSON.parse(userData),
      tasks: JSON.parse(tasksData),
      exportDate: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="nulltasker-data-backup.json"');
    res.send(JSON.stringify(backupData, null, 2));

  } catch (error) {
    console.error('データバックアップダウンロードエラー:', error);
    res.status(500).json({ error: 'データバックアップの取得に失敗しました' });
  }
});

// 設定バックアップダウンロード
app.get('/api/admin/backup/download/settings', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const settingsData = await fs.readFile(SETTINGS_FILE, 'utf8');
    
    const backupData = {
      settings: JSON.parse(settingsData),
      exportDate: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="nulltasker-settings-backup.json"');
    res.send(JSON.stringify(backupData, null, 2));

  } catch (error) {
    console.error('設定バックアップダウンロードエラー:', error);
    res.status(500).json({ error: '設定バックアップの取得に失敗しました' });
  }
});

// データ復元
app.post('/api/admin/restore', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    // マルチパートデータの処理は今後実装
    res.json({ success: true, message: 'データ復元機能は今後実装予定です' });

  } catch (error) {
    console.error('データ復元エラー:', error);
    res.status(500).json({ error: 'データの復元に失敗しました' });
  }
});

// タスクデータを取得
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    const tickets = JSON.parse(data);
    res.json(tickets);
  } catch (error) {
    console.error('タスク読み込みエラー:', error);
    res.status(500).json({ error: 'タスクの読み込みに失敗しました' });
  }
});

// 設定データを取得
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    res.json(settings);
  } catch (error) {
    console.error('設定読み込みエラー:', error);
    res.status(500).json({ error: '設定の読み込みに失敗しました' });
  }
});

// タスクデータを保存
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: '無効なタスクデータです' });
    }

    const updatedData = {
      tasks,
      lastUpdated: new Date().toISOString()
    };

    // ファイルに書き込み
    await fs.writeFile(TICKETS_FILE, JSON.stringify(updatedData, null, 2), 'utf8');
    
    console.log('タスクが正常に保存されました:', new Date().toISOString());
    res.json({ success: true, message: 'タスクが正常に保存されました' });
    
  } catch (error) {
    console.error('タスク保存エラー:', error);
    res.status(500).json({ error: 'タスクの保存に失敗しました' });
  }
});

// バックアップファイルの作成
app.post('/api/backup', authenticateToken, async (req, res) => {
  try {
    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    const backupFile = path.join(__dirname, 'config', `backup_${Date.now()}.json`);
    await fs.writeFile(backupFile, data, 'utf8');
    
    res.json({ success: true, backupFile: path.basename(backupFile) });
  } catch (error) {
    console.error('バックアップ作成エラー:', error);
    res.status(500).json({ error: 'バックアップの作成に失敗しました' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`tickets.jsonファイル: ${TICKETS_FILE}`);
  console.log(`settings.jsonファイル: ${SETTINGS_FILE}`);
  console.log(`静的ファイルディレクトリ: ${path.join(__dirname, 'src')}`);
});
