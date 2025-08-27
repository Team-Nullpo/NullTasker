const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());

// 静的ファイルの配信を新しいフォルダ構造に対応
app.use(express.static('src'));
app.use('/config', express.static('config'));

// ファイルパスを新しい構造に合わせて更新
const TICKETS_FILE = path.join(__dirname, 'config', 'tickets.json');
const SETTINGS_FILE = path.join(__dirname, 'config', 'settings.json');

// ルートアクセス時にindex.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
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

// タスクデータを取得
app.get('/api/tasks', async (req, res) => {
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
app.get('/api/settings', async (req, res) => {
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
app.post('/api/tasks', async (req, res) => {
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
app.post('/api/backup', async (req, res) => {
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
