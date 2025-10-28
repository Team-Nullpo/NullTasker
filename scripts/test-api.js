#!/usr/bin/env node
/**
 * API テストスクリプト
 * データベース移行後のAPIが正常に動作するか確認
 */

const https = require('https');
const http = require('http');

// 自己署名証明書を許可
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const useHttps = process.env.USE_HTTPS !== 'false';
const protocol = useHttps ? https : http;
const port = useHttps ? 3443 : 3000;
const baseUrl = `${useHttps ? 'https' : 'http'}://localhost:${port}`;

let accessToken = '';

/**
 * APIリクエストを送信
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * テストケース実行
 */
async function runTests() {
  console.log('========================================');
  console.log('API テスト開始');
  console.log(`ベースURL: ${baseUrl}`);
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. ユーザー登録テスト
    console.log('1. ユーザー登録 API (POST /api/register)');
    try {
      const registerData = {
        loginId: `testuser_${Date.now()}`,
        displayName: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'TestPass123!'
      };
      
      const registerRes = await makeRequest('POST', '/api/register', registerData);
      
      if (registerRes.status === 201) {
        console.log('✅ ユーザー登録成功');
        console.log(`   ユーザーID: ${registerRes.body.id}`);
        passed++;
      } else {
        console.log(`❌ ユーザー登録失敗 (ステータス: ${registerRes.status})`);
        console.log(`   メッセージ: ${registerRes.body?.message || '不明'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ユーザー登録エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 2. ログインテスト
    console.log('2. ログイン API (POST /api/login)');
    try {
      const loginData = {
        loginId: 'admin',
        password: 'admin123',
        rememberMe: false
      };
      
      const loginRes = await makeRequest('POST', '/api/login', loginData);
      
      if (loginRes.status === 200 && loginRes.body?.success) {
        console.log('✅ ログイン成功');
        console.log(`   ユーザー: ${loginRes.body.user.displayName || loginRes.body.user.display_name}`);
        accessToken = loginRes.body.token;
        passed++;
      } else {
        console.log(`❌ ログイン失敗 (ステータス: ${loginRes.status})`);
        console.log(`   メッセージ: ${loginRes.body?.message || '不明'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ログインエラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 3. トークン検証テスト
    console.log('3. トークン検証 API (POST /api/verify-token)');
    try {
      const verifyRes = await makeRequest('POST', '/api/verify-token', null, accessToken);
      
      if (verifyRes.status === 200 && verifyRes.body?.success) {
        console.log('✅ トークン検証成功');
        passed++;
      } else {
        console.log(`❌ トークン検証失敗 (ステータス: ${verifyRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ トークン検証エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 4. ユーザー情報取得テスト
    console.log('4. ユーザー情報取得 API (GET /api/user)');
    try {
      const userRes = await makeRequest('GET', '/api/user', null, accessToken);
      
      if (userRes.status === 200) {
        console.log('✅ ユーザー情報取得成功');
        console.log(`   ID: ${userRes.body.id}`);
        console.log(`   表示名: ${userRes.body.displayName || userRes.body.display_name}`);
        passed++;
      } else {
        console.log(`❌ ユーザー情報取得失敗 (ステータス: ${userRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ユーザー情報取得エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 5. プロジェクト一覧取得テスト
    console.log('5. プロジェクト一覧取得 API (GET /api/projects)');
    try {
      const projectsRes = await makeRequest('GET', '/api/projects', null, accessToken);
      
      if (projectsRes.status === 200) {
        console.log('✅ プロジェクト一覧取得成功');
        console.log(`   プロジェクト数: ${projectsRes.body.length}`);
        passed++;
      } else {
        console.log(`❌ プロジェクト一覧取得失敗 (ステータス: ${projectsRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ プロジェクト一覧取得エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 6. タスク一覧取得テスト
    console.log('6. タスク一覧取得 API (GET /api/tasks)');
    try {
      const tasksRes = await makeRequest('GET', '/api/tasks', null, accessToken);
      
      if (tasksRes.status === 200) {
        console.log('✅ タスク一覧取得成功');
        console.log(`   タスク数: ${tasksRes.body.tasks?.length || 0}`);
        passed++;
      } else {
        console.log(`❌ タスク一覧取得失敗 (ステータス: ${tasksRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ タスク一覧取得エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 7. タスク作成テスト
    console.log('7. タスク作成 API (POST /api/tasks)');
    try {
      const taskData = {
        project: 'default',
        title: `テストタスク ${Date.now()}`,
        description: 'API テストで作成されたタスク',
        status: 'todo',
        priority: 'medium',
        progress: 0
      };
      
      const createTaskRes = await makeRequest('POST', '/api/tasks', taskData, accessToken);
      
      if (createTaskRes.status === 201) {
        console.log('✅ タスク作成成功');
        console.log(`   タスクID: ${createTaskRes.body.id}`);
        passed++;
      } else {
        console.log(`❌ タスク作成失敗 (ステータス: ${createTaskRes.status})`);
        console.log(`   メッセージ: ${createTaskRes.body?.error || '不明'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ タスク作成エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 8. 設定取得テスト
    console.log('8. 設定取得 API (GET /api/settings)');
    try {
      const settingsRes = await makeRequest('GET', '/api/settings', null, accessToken);
      
      if (settingsRes.status === 200) {
        console.log('✅ 設定取得成功');
        passed++;
      } else {
        console.log(`❌ 設定取得失敗 (ステータス: ${settingsRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ 設定取得エラー: ${error.message}`);
      failed++;
    }
    console.log();

  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }

  // テスト結果サマリー
  console.log('========================================');
  console.log('テスト結果');
  console.log('========================================');
  console.log(`✅ 成功: ${passed} 件`);
  console.log(`❌ 失敗: ${failed} 件`);
  console.log(`合計: ${passed + failed} 件`);
  console.log('========================================');

  if (failed === 0) {
    console.log('\n🎉 全てのAPIテストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n⚠️  一部のテストが失敗しました。');
    process.exit(1);
  }
}

// メイン実行
console.log('サーバーへの接続を待っています...\n');
setTimeout(() => {
  runTests().catch(error => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  });
}, 2000);
