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
const DatabaseManager = require('./db/database');
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
const USE_HTTPS = process.env.USE_HTTPS !== 'false';

// データベース初期化
const DB_PATH = path.join(__dirname, 'db', 'nulltasker.db');
const db = new DatabaseManager(DB_PATH);

// データベースが存在しない場合は初期化
if (!fsSync.existsSync(DB_PATH)) {
  console.log('データベースが見つかりません。初期化します...');
  db.initializeSchema();
  console.log('データベースを初期化しました');
}

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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost:3443', 'https://127.0.0.1:3443'],
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
    .withMessage(VALIDATION.LOGIN_ID.ERROR_MESSAGE)
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

// 静的ファイルの配信
app.use('/src', express.static('src'));
app.use('/scripts', express.static(path.join('src', 'scripts')));
app.use('/styles', express.static(path.join('src', 'styles')));
app.use('/assets', express.static(path.join('src', 'assets')));
app.use('/config', express.static('config'));

// ルートアクセス時にindex.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
});

// ページルーティング
const pages = ['login', 'register', 'index', 'task', 'calendar', 'gantt', 'setting', 'debug-storage'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', `${page}.html`));
  });
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', `${page}.html`));
  });
  app.get(`/pages/${page}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', `${page}.html`));
  });
  app.get(`/src/pages/${page}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', `${page}.html`));
  });
});

// ========== 認証API ==========

// ユーザー登録
app.post('/api/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { loginId, displayName, email, password } = req.body;

    // 既存ユーザーチェック
    const existingUserByLogin = db.getUserByLoginId(loginId);
    const existingUserByEmail = email ? db.getUserByEmail(email) : null;
    
    if (existingUserByLogin || existingUserByEmail) {
      return res.status(409).json({ 
        success: false, 
        message: '既に登録済みのログインIDまたはメールアドレスです' 
      });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 新しいユーザーを作成
    const newUser = {
      id: generateId('user'),
      loginId: loginId,
      displayName: displayName || loginId,
      email: email || `${loginId}@example.com`,
      password: hashedPassword,
      role: "user",
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    db.createUser(newUser);
    
    // デフォルトプロジェクトのメンバーに追加
    const defaultProject = db.getProjectById("default");
    if (defaultProject) {
      db.addProjectMember("default", newUser.id, false);
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      message: 'ユーザー登録が完了しました',
      user: userWithoutPassword
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

    // ユーザーを検索
    const user = db.getUserByLoginId(loginId) || db.getUserById(loginId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'ログインIDまたはパスワードが正しくありません' 
      });
    }

    // パスワード確認
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'ログインIDまたはパスワードが正しくありません' 
      });
    }

    // ユーザーのプロジェクト一覧を取得
    const projects = db.getProjectsByUserId(user.id);
    const projectIds = projects.map(p => p.id);

    // JWTトークンを生成
    const accessToken = jwt.sign(
      { 
        id: user.id,
        loginId: user.login_id,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        projects: projectIds
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY.ACCESS_TOKEN }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : JWT_EXPIRY.REFRESH_TOKEN }
    );

    // 最終ログイン時間を更新
    db.updateUser(user.id, { lastLogin: new Date().toISOString() });

    // パスワードを除外したユーザー情報を返す
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        ...userWithoutPassword,
        loginId: user.login_id,
        displayName: user.display_name,
        projects: projectIds
      },
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

// トークン検証
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

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(403).json({
        success: false,
        message: '無効なリフレッシュトークンです'
      });
    }

    const user = db.getUserById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    const projects = db.getProjectsByUserId(user.id);
    const projectIds = projects.map(p => p.id);

    const newAccessToken = jwt.sign(
      { 
        id: user.id,
        loginId: user.login_id,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        projects: projectIds
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
  res.json({ success: true, message: 'ログアウトしました' });
});

// ========== ユーザーAPI ==========

// ユーザー情報取得
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      ...userWithoutPassword,
      loginId: user.login_id,
      displayName: user.display_name
    });

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

    // メールアドレスの重複チェック
    const existingUser = db.getUserByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(409).json({ error: 'このメールアドレスは既に使用されています' });
    }

    db.updateUser(req.user.id, { displayName, email });
    
    const user = db.getUserById(req.user.id);
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      ...userWithoutPassword,
      loginId: user.login_id,
      displayName: user.display_name
    });

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

    const user = db.getUserById(req.user.id);
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
    
    db.updateUser(req.user.id, { password: hashedNewPassword });
    res.status(204).end();

  } catch (error) {
    console.error('パスワード変更エラー:', error);
    res.status(500).json({ error: 'パスワードの変更に失敗しました' });
  }
});

// 個人設定保存
app.put('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, message: '個人設定を保存しました' });
  } catch (error) {
    console.error('個人設定保存エラー:', error);
    res.status(500).json({ error: '個人設定の保存に失敗しました' });
  }
});

// ========== システム管理者API ==========

const requireSystemAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'システム管理者権限が必要です' });
  }
  next();
};

// 全ユーザーデータ取得
app.get('/api/admin/users', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const users = db.getAllUsers();
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      const userProjects = db.getProjectsByUserId(user.id);
      return {
        ...userWithoutPassword,
        loginId: user.login_id,
        displayName: user.display_name,
        projects: userProjects.map(p => p.id)
      };
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

    // 重複チェック
    const existingUserByLogin = db.getUserByLoginId(loginId);
    const existingUserByEmail = db.getUserByEmail(email);
    
    if (existingUserByLogin || existingUserByEmail) {
      return res.status(409).json({ error: 'ログインIDまたはメールアドレスが既に使用されています' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: generateId('user'),
      loginId: loginId,
      displayName: displayName,
      email: email,
      password: hashedPassword,
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    db.createUser(newUser);
    db.addProjectMember('default', newUser.id, false);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).location(`/api/admin/users/${newUser.id}`).json({
      ...userWithoutPassword,
      projects: ['default']
    });

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

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // メールアドレスの重複チェック
    const existingUser = db.getUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'このメールアドレスは既に使用されています' });
    }

    const updates = { displayName, email, role };
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
    }

    db.updateUser(userId, updates);
    
    const updatedUser = db.getUserById(userId);
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      ...userWithoutPassword,
      loginId: updatedUser.login_id,
      displayName: updatedUser.display_name
    });

  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    res.status(500).json({ error: 'ユーザーの更新に失敗しました' });
  }
});

// ユーザー削除
app.delete('/api/admin/users/:userId', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: '自分自身を削除することはできません' });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    db.deleteUser(userId);
    res.status(204).end();

  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    res.status(500).json({ error: 'ユーザーの削除に失敗しました' });
  }
});

// 全プロジェクトデータ取得
app.get('/api/admin/projects', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const projects = db.getAllProjects();
    
    // 各プロジェクトにメンバーと管理者情報を追加
    const projectsWithMembers = projects.map(project => {
      const members = db.getProjectMembers(project.id).map(m => m.id);
      const admins = db.getProjectAdmins(project.id);
      
      return {
        ...project,
        members,
        admins
      };
    });
    
    res.status(200).json(projectsWithMembers);
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

    const ownerUser = db.getUserById(owner);
    if (!ownerUser) {
      return res.status(400).json({ error: '指定されたオーナーが存在しません' });
    }

    const newProject = {
      id: generateId("project"),
      name: name,
      description: description || '',
      owner: owner,
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

    db.createProject(newProject);
    db.addProjectMember(newProject.id, owner, true);
    
    res.status(201).location(`/api/projects/${newProject.id}`).json({
      ...newProject,
      members: [owner],
      admins: [owner]
    });

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

    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    const ownerUser = db.getUserById(owner);
    if (!ownerUser) {
      return res.status(400).json({ error: '指定されたオーナーが存在しません' });
    }

    db.updateProject(projectId, {
      name,
      description: description || '',
      owner,
      lastUpdated: new Date().toISOString()
    });
    
    const updatedProject = db.getProjectById(projectId);
    const members = db.getProjectMembers(projectId).map(m => m.id);
    const admins = db.getProjectAdmins(projectId);
    
    res.status(200).json({
      ...updatedProject,
      members,
      admins
    });

  } catch (error) {
    console.error('プロジェクト更新エラー:', error);
    res.status(500).json({ error: 'プロジェクトの更新に失敗しました' });
  }
});

// プロジェクト削除
app.delete('/api/admin/projects/:projectId', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (projectId === 'default') {
      return res.status(400).json({ error: 'デフォルトプロジェクトは削除できません' });
    }

    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    db.deleteProject(projectId);
    res.status(204).end();

  } catch (error) {
    console.error('プロジェクト削除エラー:', error);
    res.status(500).json({ error: 'プロジェクトの削除に失敗しました' });
  }
});

// システム設定保存
app.put('/api/admin/system-settings', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
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
    const backupDir = path.join(__dirname, 'db', 'backups');
    
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);
    fsSync.copyFileSync(DB_PATH, backupPath);
    
    res.json({ 
      success: true, 
      message: 'バックアップを作成しました',
      filename: `backup-${timestamp}.db`
    });

  } catch (error) {
    console.error('バックアップ作成エラー:', error);
    res.status(500).json({ error: 'バックアップの作成に失敗しました' });
  }
});

// データバックアップダウンロード
app.get('/api/admin/backup/download/data', authenticateToken, requireSystemAdmin, async (req, res) => {
  try {
    const users = db.getAllUsers().map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    
    const tasks = db.getAllTasks();
    const projects = db.getAllProjects();
    
    const backupData = {
      users,
      tasks,
      projects,
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
    const settings = db.getAllSettings();
    
    const backupData = {
      settings,
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
    res.json({ success: true, message: 'データ復元機能は今後実装予定です' });
  } catch (error) {
    console.error('データ復元エラー:', error);
    res.status(500).json({ error: 'データの復元に失敗しました' });
  }
});

// ========== 設定API ==========

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = db.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('設定読み込みエラー:', error);
    res.status(500).json({ error: '設定の読み込みに失敗しました' });
  }
});

// ========== タスクAPI ==========

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    debugLog('タスク取得リクエスト受信:', req.user?.id);
    
    // ユーザーが所属するプロジェクトのタスクを担当者情報付きで取得
    const tasks = db.getTasksWithAssigneeInfo(req.user.id);
    
    debugLog('タスク取得成功:', tasks.length, '件');
    res.json({ tasks: tasks, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('タスク読み込みエラー:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'タスクの読み込みに失敗しました'
    });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const payload = req.body;

    // 同名チェック
    const existingTasks = db.getTasksByProject(payload.project);
    const duplicate = existingTasks.find(task => task.title === payload.title);
    
    if (duplicate) {
      return res.status(409).json({ error: '同名のタスクが存在します' });
    }

    const newTask = {
      id: generateId("task"),
      project: payload.project || 'default',
      title: payload.title,
      description: payload.description || null,
      assignee: payload.assignee || null,
      category: payload.category || null,
      priority: payload.priority || null,
      status: payload.status || 'todo',
      progress: payload.progress || 0,
      startDate: payload.startDate || null,
      dueDate: payload.dueDate || null,
      estimatedHours: payload.estimatedHours || null,
      actualHours: payload.actualHours || null,
      tags: payload.tags || [],
      parentTask: payload.parentTask || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.createTask(newTask);
    
    debugLog('タスクが正常に保存されました:', newTask.id);
    res.status(201).location(`/api/tasks/${newTask.id}`).json(newTask);
    
  } catch (error) {
    console.error('タスク保存エラー:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'タスクの保存に失敗しました'
    });
  }
});

app.put('/api/tasks/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const payload = req.body;

    const task = db.getTaskById(ticketId);
    if (!task) {
      return res.status(404).json({ error: 'タスクが見つかりません' });
    }

    const updates = {
      ...payload,
      updatedAt: new Date().toISOString()
    };

    db.updateTask(ticketId, updates);
    
    const updatedTask = db.getTaskById(ticketId);
    res.status(200).json(updatedTask);

  } catch (error) {
    console.error('タスク更新エラー:', error);
    res.status(500).json({ error: 'タスクの更新に失敗しました' });
  }
});

app.delete('/api/tasks/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const task = db.getTaskById(ticketId);
    if (!task) {
      return res.status(404).json({ error: 'タスクが見つかりません' });
    }

    db.deleteTask(ticketId);
    res.status(204).end();

  } catch (error) {
    console.error('タスク削除エラー:', error);
    res.status(500).json({ error: 'タスクの削除に失敗しました' });
  }
});

// バックアップファイルの作成
app.post('/api/backup', authenticateToken, async (req, res) => {
  try {
    const timestamp = Date.now();
    const backupFile = path.join(__dirname, 'db', 'backups', `backup_${timestamp}.db`);
    
    await fs.mkdir(path.join(__dirname, 'db', 'backups'), { recursive: true });
    fsSync.copyFileSync(DB_PATH, backupFile);
    
    res.json({ success: true, backupFile: path.basename(backupFile) });
  } catch (error) {
    console.error('バックアップ作成エラー:', error);
    res.status(500).json({ error: 'バックアップの作成に失敗しました' });
  }
});

// ========== プロジェクトAPI ==========

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = db.getProjectsByUserId(req.user.id);
    
    // 各プロジェクトにメンバーと管理者情報を追加
    const projectsWithMembers = projects.map(project => {
      const members = db.getProjectMembers(project.id).map(m => m.id);
      const admins = db.getProjectAdmins(project.id);
      
      return {
        ...project,
        members,
        admins
      };
    });
    
    res.status(200).json(projectsWithMembers);
  } catch (error) {
    console.error('プロジェクトデータの取得に失敗: ', error);
    res.status(500).json({ error: 'プロジェクトデータ取得に失敗しました'});
  }
});

// プロジェクトメンバー用ユーザー一覧取得
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const currentUser = db.getUserById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 同じプロジェクトのメンバーを取得
    const projects = db.getProjectsByUserId(currentUser.id);
    const projectIds = projects.map(p => p.id);
    
    const userIds = new Set();
    projectIds.forEach(projectId => {
      const members = db.getProjectMembers(projectId);
      members.forEach(member => userIds.add(member.id));
    });

    const users = Array.from(userIds).map(id => {
      const user = db.getUserById(id);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        const userProjects = db.getProjectsByUserId(id);
        return {
          ...userWithoutPassword,
          loginId: user.login_id,
          displayName: user.display_name,
          projects: userProjects.map(p => p.id)
        };
      }
      return null;
    }).filter(u => u !== null);

    res.status(200).json(users);
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});

// ========== サーバー起動 ==========

// プロセス終了時にデータベースを閉じる
process.on('SIGINT', () => {
  console.log('\nサーバーを終了しています...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

if (USE_HTTPS) {
  const sslKeyPath = path.join(__dirname, 'ssl', 'server.key');
  const sslCertPath = path.join(__dirname, 'ssl', 'server.cert');

  if (!fsSync.existsSync(sslKeyPath) || !fsSync.existsSync(sslCertPath)) {
    console.error('エラー: SSL証明書が見つかりません。');
    console.error('以下のコマンドでSSL証明書を生成してください:');
    console.error('  npm run generate-cert');
    process.exit(1);
  }

  const httpsOptions = {
    key: fsSync.readFileSync(sslKeyPath),
    cert: fsSync.readFileSync(sslCertPath)
  };

  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPSサーバーが起動しました: https://localhost:${HTTPS_PORT}`);
    console.log(`データベース: ${DB_PATH}`);
    console.log(`静的ファイルディレクトリ: ${path.join(__dirname, 'src')}`);
    console.log('\n警告: 自己署名証明書を使用しています。');
    console.log('ブラウザで証明書の警告が表示される場合は、例外として承認してください。');
  });

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
  app.listen(PORT, () => {
    console.log(`HTTPサーバーが起動しました: http://localhost:${PORT}`);
    console.log(`データベース: ${DB_PATH}`);
    console.log(`静的ファイルディレクトリ: ${path.join(__dirname, 'src')}`);
  });
}
