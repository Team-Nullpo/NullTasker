const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// tickets.jsonのパス
const TICKETS_FILE = path.join(__dirname, 'tickets.json');

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
    const backupFile = path.join(__dirname, `backup_${Date.now()}.json`);
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
});
