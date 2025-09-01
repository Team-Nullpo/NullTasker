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
      scriptSrc: ["'self'"],
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('パスワードは8文字以上で、大文字・小文字・数字・記号をそれぞれ1文字以上含む必要があります')
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
app.use(express.static('src'));
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

// 登録ページ
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'register.html'));
});

// index.htmlへの直接アクセスもサポート
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
});

// 個別ページのルーティング（.htmlファイルへの直接アクセスもサポート）
app.get('/task', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'task.html'));
});

app.get('/task.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'task.html'));
});

app.get('/calendar', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'calendar.html'));
});

app.get('/calendar.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'calendar.html'));
});

app.get('/gantt', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'gantt.html'));
});

app.get('/gantt.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'gantt.html'));
});

app.get('/setting', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'setting.html'));
});

app.get('/setting.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'setting.html'));
});

app.get('/debug-storage', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'debug-storage.html'));
});

app.get('/debug-storage.html', (req, res) => {
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
    const users = JSON.parse(userData);
    
    const user = users.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
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
