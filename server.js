const express = require('express');
const https = require('https');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const {
  VALIDATION,
  JWT_EXPIRY,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
  DEFAULT_SETTINGS,
  TASK_PROGRESS,
  TASK_STATUS,
  getValidProgressValues,
  getValidStatusValues,
  getPrioritiesArray,
  getStatusesArray
} = require('./server-constants');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DEBUG_MODE = NODE_ENV === 'development';
const USE_HTTPS = process.env.USE_HTTPS !== 'false'; // デフォルトでHTTPSを使用

// デバッグログ用のヘルパー関数
const debugLog = (...args) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

const generateId = (prefix = 'item') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}

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
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.LOGIN_MAX_REQUESTS,
  message: {
    success: false,
    message: 'ログイン試行回数が上限に達しました。15分後に再試行してください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
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
    .isLength({ min: VALIDATION.LOGIN_ID.MIN_LENGTH, max: VALIDATION.LOGIN_ID.MAX_LENGTH })
    .matches(VALIDATION.LOGIN_ID.PATTERN)
    .withMessage(VALIDATION.LOGIN_ID.ERROR_MESSAGE),
  body('password')
    .isLength({ min: VALIDATION.PASSWORD.MIN_LENGTH })
    .withMessage(VALIDATION.PASSWORD.ERROR_MESSAGE)
];

const registerValidation = [
  body('loginId')
    .isLength({ min: VALIDATION.LOGIN_ID.MIN_LENGTH, max: VALIDATION.LOGIN_ID.MAX_LENGTH })
    .matches(VALIDATION.LOGIN_ID.PATTERN)
    .withMessage(VALIDATION.LOGIN_ID.ERROR_MESSAGE),
  body('password')
    .isLength({ min: VALIDATION.PASSWORD.MIN_LENGTH, max: VALIDATION.PASSWORD.MAX_LENGTH })
    .matches(VALIDATION.PASSWORD.PATTERN)
    .withMessage(VALIDATION.PASSWORD.ERROR_MESSAGE),
  body('displayName')
    .optional()
    .isLength({ min: VALIDATION.DISPLAY_NAME.MIN_LENGTH, max: VALIDATION.DISPLAY_NAME.MAX_LENGTH })
    .withMessage(VALIDATION.DISPLAY_NAME.ERROR_MESSAGE),
  body('email')
    .optional()
    .matches(VALIDATION.EMAIL.PATTERN)
    .withMessage(VALIDATION.EMAIL.ERROR_MESSAGE)
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
const PROJECTS_FILE = path.join(__dirname, 'config', 'projects.json');

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

    // プロジェクトデータの読み込み
    const projectData = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(projectData);

    // 既存ユーザーチェック
    const existingUser = users.users.find(u => 
      u.loginId === loginId || u.email === email
    );
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
      id: generateId('user'),
      loginId: loginId,
      displayName: displayName,
      email: email,
      password: hashedPassword,
      role: "user",  // デフォルトは一般ユーザー
      projects: ["default"],  // デフォルトプロジェクトに自動参加
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.users.push(newUser);
    
    // デフォルトプロジェクトのメンバーに追加
    const defaultProject = projects.projects.find(p => p.id === "default");
    if (defaultProject) {
      if (!defaultProject.members.includes(newUser.id)) {
        defaultProject.members.push(newUser.id);
        defaultProject.lastUpdated = new Date().toISOString();
      }
    }
    
    users.lastUpdated = new Date().toISOString();
    projects.lastUpdated = new Date().toISOString;

    // ファイルに保存
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');

    res.status(201).json(newUser);

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
    const user = users.users.find(u => u.id === loginId || u.loginId === loginId);
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

    // JWTトークンを生成（有効期間を1時間に延長）
    const accessToken = jwt.sign(
      { 
        id: user.id,
        loginId: user.loginId || user.id, 
        displayName: user.displayName, 
        email: user.email,
        role: user.role || 'user',
        projects: user.projects || ['default']
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY.ACCESS_TOKEN }
    );

    // リフレッシュトークンを生成
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : JWT_EXPIRY.REFRESH_TOKEN }
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
    console.error('ログインエラー:', NODE_ENV === 'development' ? error : error.message);
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
        loginId: user.loginId || user.id,
        displayName: user.displayName, 
        email: user.email,
        role: user.role || 'user',
        projects: user.projects || ['default']
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY.ACCESS_TOKEN }
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
      return res.status(409).json({ error: 'このメールアドレスは既に使用されています' });
    }

    const newUser = {
      ...data.users[userIndex],
      displayName: displayName,
      email: email,
      lastUpdated: new Date().toISOString()
    }

    // プロフィール更新
    data.users[userIndex] = newUser;

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(200).json(userWithoutPassword);

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
    res.status(204).end();

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

// 全ユーザーデータ取得
app.get('/api/admin/users', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(userData);
    const projectData = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(projectData);
    
    // パスワードを除外
    const usersWithoutPasswords = users.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.status(200).json(usersWithoutPasswords);

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
      u.loginId === loginId || u.email === email
    );
    
    if (existingUser) {
      return res.status(409).json({ error: 'ログインIDまたはメールアドレスが既に使用されています' });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 新ユーザー作成
    const newUser = {
      id: generateId('user'),
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
    
    res.status(201).location(`/api/admin/users/${newUser.id}`).json(newUser);

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
      return res.status(409).json({ error: 'このメールアドレスは既に使用されています' });
    }

    const newUser = {
      ...data.users[userIndex],
      displayName: displayName,
      email: email,
      role: role,
      lastUpdated: new Date().toISOString()
    }
    
    // パスワードが指定されている場合のみ更新
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      newUser.password = hashedPassword;
    }

    // プロフィール更新
    data.users[userIndex] = newUser;

    data.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(200).json(userWithoutPassword);

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
    
    res.status(204).end();

  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    res.status(500).json({ error: 'ユーザーの削除に失敗しました' });
  }
});

// 全プロジェクトデータ取得
app.get('/api/admin/projects', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
      const data = await fs.readFile(PROJECTS_FILE, 'utf8');
      const projects = JSON.parse(data);
      res.status(200).json(projects.projects);
  } catch (error) {
      console.error('プロジェクトデータの取得に失敗: ', error);
      res.status(500).json({ error: 'プロジェクトデータ取得に失敗しました'});
  }
});

// プロジェクト作成
app.post('/api/admin/projects', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { name, description, owner } = req.body;
    
    if (!name || !owner) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const userData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(userData);
    const projectData = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(projectData);

    // オーナーの存在チェック
    const ownerUser = users.users.find(u => u.id === owner);
    if (!ownerUser) {
      return res.status(400).json({ error: '指定されたオーナーが存在しません' });
    }

    // 新プロジェクト作成
    const newProject = {
      id: generateId("project"),
      name: name,
      description: description || '',
      owner: owner,
      members: [owner],
      admins: [owner],
      settings: {
        categories: DEFAULT_SETTINGS.categories,
        priorities: getPrioritiesArray(),
        statuses: getStatusesArray(),
        notifications: true,
        autoAssign: false
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (!projects.projects) {
      projects.projects = [];
    }
    
    projects.projects.push(newProject);
    
    // オーナーのプロジェクトリストに追加
    const ownerIndex = users.users.findIndex(u => u.id === owner);
    if (ownerIndex !== -1) {
      if (!users.users[ownerIndex].projects) {
        users.users[ownerIndex].projects = [];
      }
      if (!users.users[ownerIndex].projects.includes(newProject.id)) {
        users.users[ownerIndex].projects.push(newProject.id);
      }
    }

    users.lastUpdated = new Date().toISOString();
    projects.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    
    res.status(201).location(`/api/projects/${newProject.id}`).json(newProject);

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
    const users = JSON.parse(userData);
    const projectData = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(projectData);
    
    
    const projectIndex = projects.projects?.findIndex(p => p.id === projectId);
    if (projectIndex === -1 || !projects.projects) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    // オーナーの存在チェック
    const ownerUser = users.users.find(u => u.id === owner);
    if (!ownerUser) {
      return res.status(400).json({ error: '指定されたオーナーが存在しません' });
    }

    // プロジェクト更新
    const newProject = {
      ...projects.projects[projectIndex],
      name: name,
      description: description || "",
      owner: owner,
      updatedAt: new Date().toISOString(),
    };
    projects.projects[projectIndex] = newProject;

    projects.lastUpdated = new Date().toISOString();

    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));    
    
    res.status(200).json(newProject);

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
    const users = JSON.parse(userData);
    const projectData = await fs.readFile(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(projectData);
    
    const projectIndex = projects.projects?.findIndex(p => p.id === projectId);
    if (projectIndex === -1 || !projects.projects) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    // プロジェクト削除
    projects.projects.splice(projectIndex, 1);
    
    // 全ユーザーのプロジェクトリストから削除
    users.users.forEach(user => {
      if (user.projects) {
        user.projects = user.projects.filter(p => p !== projectId);
      }
    });

    users.lastUpdated = new Date().toISOString();
    projects.lastUpdated = new Date().toISOString();

    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));

    res.status(204).end();

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
    const projectsData = await fs.readFile(PROJECTS_FILE, 'utf8');
    
    const backupData = {
      users: JSON.parse(userData),
      tasks: JSON.parse(tasksData),
      settings: JSON.parse(settingsData),
      projects: JSON.parse(projectsData),
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
    const projectsData = await fs.readFile(PROJECTS_FILE, 'utf8');
    
    const backupData = {
      users: JSON.parse(userData),
      tasks: JSON.parse(tasksData),
      projects: JSON.parse(projectsData),
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

// タスクデータを取得
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    debugLog('タスク取得リクエスト受信:', req.user?.id);
    
    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    
    // 空ファイルチェック
    if (!data || data.trim() === '') {
      console.warn('tickets.jsonが空です。空のタスク配列を返します。');
      return res.json({ tasks: [], lastUpdated: new Date().toISOString() });
    }
    
    const tickets = JSON.parse(data);
    
    // データ構造の検証
    if (!tickets.tasks || !Array.isArray(tickets.tasks)) {
      console.warn('無効なデータ構造。修正して返します。');
      return res.json({ tasks: [], lastUpdated: tickets.lastUpdated || new Date().toISOString() });
    }
    
    debugLog('タスク取得成功:', tickets.tasks.length, '件');
    res.json(tickets);
  } catch (error) {
    console.error('タスク読み込みエラー:', error.message);
    // JSONパースエラーの場合は空のデータを返す
    if (error instanceof SyntaxError) {
      console.error('JSON解析エラー。空のタスク配列を返します。');
      return res.json({ tasks: [], lastUpdated: new Date().toISOString() });
    }
    res.status(500).json({ 
      success: false,
      error: 'タスクの読み込みに失敗しました'
    });
  }
});

// タスクデータを追加
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const payload = req.body;

    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    const tickets = JSON.parse(data);

    const existingProject = tickets.tasks?.find(task => task.title === payload.title && task.project === payload.project);
    if (existingProject) {
      return res.status(409).json({ error: '同名のタスクが存在します' });
    }

    const newTask = {
      id: generateId("task"),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!tickets.tasks) {
      tickets.tasks = [];
    }

    tickets.tasks.push(newTask);
    tickets.lastUpdated = new Date().toISOString();

    // ファイルに書き込み
    await fs.writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
    
    debugLog('タスクが正常に保存されました:', {
      count: tickets.tasks.length,
      time: new Date().toISOString()
    });
    
    res.status(201).location(`/api/tasks/${newTask.id}`).json(newTask);
    
  } catch (error) {
    console.error('タスク保存エラー:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'タスクの保存に失敗しました'
    });
  }
});

// タスク更新
app.put('/api/tasks/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const payload = req.body;

    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    const tickets = JSON.parse(data);
    
    
    const ticketIndex = tickets.tasks?.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1 || !tickets.tasks) {
      return res.status(404).json({ error: 'チケットが見つかりません' });
    }

    // タスク更新
    const newTask = {
      ...tickets.tasks[ticketIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    tickets.tasks[ticketIndex] = newTask;

    tickets.lastUpdated = new Date().toISOString();

    await fs.writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2));
    
    res.status(200).json(newTask);

  } catch (error) {
    console.error('チケット更新エラー:', error);
    res.status(500).json({ error: 'チケットの更新に失敗しました' });
  }
});

// タスク削除
app.delete('/api/tasks/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    const tickets = JSON.parse(data);
    
    const ticketIndex = tickets.tasks?.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1 || !tickets.tasks) {
      return res.status(404).json({ error: 'チケットが見つかりません' });
    }

    // チケット削除
    tickets.tasks.splice(ticketIndex, 1);

    tickets.lastUpdated = new Date().toISOString();

    await fs.writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2));

    res.status(204).end();

  } catch (error) {
    console.error('チケット削除エラー:', error);
    res.status(500).json({ error: 'チケットの削除に失敗しました' });
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

// プロジェクトデータ取得
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const data = await fs.readFile(PROJECTS_FILE, 'utf8');
        const projects = JSON.parse(data);
        const filtered = projects.projects.filter(p => p.members.includes(req.user.id));
        res.status(200).json(filtered);
    } catch (error) {
        console.error('プロジェクトデータの取得に失敗: ', error);
        res.status(500).json({ error: 'プロジェクトデータ取得に失敗しました'});
    }
});

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
    const projectUsers = data.users.filter(user => 
      user.projects.some(project => currentUser.projects.includes(project))
    );
    const usersWithoutPasswords = projectUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});

// サーバー起動
if (USE_HTTPS) {
  // SSL証明書のパス
  const sslKeyPath = path.join(__dirname, 'ssl', 'server.key');
  const sslCertPath = path.join(__dirname, 'ssl', 'server.cert');

  // SSL証明書の存在確認
  if (!fsSync.existsSync(sslKeyPath) || !fsSync.existsSync(sslCertPath)) {
    console.error('エラー: SSL証明書が見つかりません。');
    console.error('以下のコマンドでSSL証明書を生成してください:');
    console.error('  npm run generate-cert');
    process.exit(1);
  }

  // HTTPSサーバーのオプション
  const httpsOptions = {
    key: fsSync.readFileSync(sslKeyPath),
    cert: fsSync.readFileSync(sslCertPath)
  };

  // HTTPSサーバーを起動
  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPSサーバーが起動しました: https://localhost:${HTTPS_PORT}`);
    console.log(`tickets.jsonファイル: ${TICKETS_FILE}`);
    console.log(`settings.jsonファイル: ${SETTINGS_FILE}`);
    console.log(`静的ファイルディレクトリ: ${path.join(__dirname, 'src')}`);
    console.log('\n警告: 自己署名証明書を使用しています。');
    console.log('ブラウザで証明書の警告が表示される場合は、例外として承認してください。');
  });

  // HTTPからHTTPSへのリダイレクト（オプション）
  if (process.env.REDIRECT_HTTP !== 'false') {
    const http = require('http');
    http.createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host.replace(`:${PORT}`, `:${HTTPS_PORT}`)}${req.url}` });
      res.end();
    }).listen(PORT, () => {
      console.log(`HTTPリダイレクトサーバーが起動しました: http://localhost:${PORT} -> https://localhost:${HTTPS_PORT}`);
    });
  }
} else {
  // HTTPサーバーを起動（HTTPSを無効にした場合）
  app.listen(PORT, () => {
    console.log(`HTTPサーバーが起動しました: http://localhost:${PORT}`);
    console.log(`tickets.jsonファイル: ${TICKETS_FILE}`);
    console.log(`settings.jsonファイル: ${SETTINGS_FILE}`);
    console.log(`静的ファイルディレクトリ: ${path.join(__dirname, 'src')}`);
  });
}
