#!/usr/bin/env node
/**
 * 管理者 API テストスクリプト
 */

const http = require('http');

const baseUrl = 'http://localhost:3000';
let accessToken = '';

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

    const req = http.request(options, (res) => {
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

async function runTests() {
  console.log('========================================');
  console.log('管理者 API テスト開始');
  console.log(`ベースURL: ${baseUrl}`);
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 管理者としてログイン
    console.log('管理者としてログイン中...');
    const loginRes = await makeRequest('POST', '/api/login', {
      loginId: 'admin',
      password: 'admin123',
      rememberMe: false
    });
    
    if (loginRes.status === 200 && loginRes.body?.success) {
      console.log('✅ 管理者ログイン成功\n');
      accessToken = loginRes.body.token;
    } else {
      console.log('❌ 管理者ログイン失敗');
      return;
    }

    // 1. 全ユーザー取得
    console.log('1. 全ユーザー取得 API (GET /api/admin/users)');
    try {
      const usersRes = await makeRequest('GET', '/api/admin/users', null, accessToken);
      
      if (usersRes.status === 200) {
        console.log('✅ 全ユーザー取得成功');
        console.log(`   ユーザー数: ${usersRes.body.length}`);
        passed++;
      } else {
        console.log(`❌ 全ユーザー取得失敗 (ステータス: ${usersRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ 全ユーザー取得エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 2. 全プロジェクト取得
    console.log('2. 全プロジェクト取得 API (GET /api/admin/projects)');
    try {
      const projectsRes = await makeRequest('GET', '/api/admin/projects', null, accessToken);
      
      if (projectsRes.status === 200) {
        console.log('✅ 全プロジェクト取得成功');
        console.log(`   プロジェクト数: ${projectsRes.body.length}`);
        passed++;
      } else {
        console.log(`❌ 全プロジェクト取得失敗 (ステータス: ${projectsRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ 全プロジェクト取得エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 3. バックアップ作成
    console.log('3. バックアップ作成 API (POST /api/admin/backup)');
    try {
      const backupRes = await makeRequest('POST', '/api/admin/backup', {}, accessToken);
      
      if (backupRes.status === 200 && backupRes.body?.success) {
        console.log('✅ バックアップ作成成功');
        console.log(`   ファイル名: ${backupRes.body.filename}`);
        passed++;
      } else {
        console.log(`❌ バックアップ作成失敗 (ステータス: ${backupRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ バックアップ作成エラー: ${error.message}`);
      failed++;
    }
    console.log();

    // 4. データバックアップダウンロード
    console.log('4. データバックアップダウンロード API (GET /api/admin/backup/download/data)');
    try {
      const downloadRes = await makeRequest('GET', '/api/admin/backup/download/data', null, accessToken);
      
      if (downloadRes.status === 200) {
        console.log('✅ データバックアップダウンロード成功');
        const data = typeof downloadRes.body === 'string' ? JSON.parse(downloadRes.body) : downloadRes.body;
        console.log(`   ユーザー数: ${data.users?.length || 0}`);
        console.log(`   タスク数: ${data.tasks?.length || 0}`);
        console.log(`   プロジェクト数: ${data.projects?.length || 0}`);
        passed++;
      } else {
        console.log(`❌ データバックアップダウンロード失敗 (ステータス: ${downloadRes.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ データバックアップダウンロードエラー: ${error.message}`);
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
    console.log('\n🎉 全ての管理者APIテストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n⚠️  一部のテストが失敗しました。');
    process.exit(1);
  }
}

setTimeout(() => {
  runTests().catch(error => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  });
}, 1000);
