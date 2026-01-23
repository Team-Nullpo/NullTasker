// remove-project-admin-role.js
// project_admin役割を持つユーザーをuserに変換するマイグレーションスクリプト

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db/nulltasker.db');

try {
  const db = new Database(DB_PATH);
  console.log('データベースに接続しました:', DB_PATH);

  // トランザクション開始
  db.exec('BEGIN TRANSACTION');

  try {
    // project_admin役割を持つユーザーを確認
    const projectAdmins = db.prepare(`
      SELECT id, login_id, display_name, role 
      FROM users 
      WHERE role = 'project_admin'
    `).all();

    console.log(`\nproject_admin役割のユーザー: ${projectAdmins.length}件`);

    if (projectAdmins.length > 0) {
      console.log('\n以下のユーザーの役割をuserに変更します:');
      projectAdmins.forEach(user => {
        console.log(`  - ${user.login_id} (${user.display_name})`);
      });

      // project_adminをuserに変更
      const updateStmt = db.prepare(`
        UPDATE users 
        SET role = 'user' 
        WHERE role = 'project_admin'
      `);

      const result = updateStmt.run();
      console.log(`\n${result.changes}件のユーザーを更新しました`);
    } else {
      console.log('\nproject_admin役割のユーザーは存在しません');
    }

    // member役割を持つユーザーも確認して変換
    const members = db.prepare(`
      SELECT id, login_id, display_name, role 
      FROM users 
      WHERE role = 'member'
    `).all();

    if (members.length > 0) {
      console.log(`\nmember役割のユーザー: ${members.length}件`);
      console.log('\n以下のユーザーの役割をuserに変更します:');
      members.forEach(user => {
        console.log(`  - ${user.login_id} (${user.display_name})`);
      });

      const updateMemberStmt = db.prepare(`
        UPDATE users 
        SET role = 'user' 
        WHERE role = 'member'
      `);

      const memberResult = updateMemberStmt.run();
      console.log(`\n${memberResult.changes}件のユーザーを更新しました`);
    }

    // 現在のユーザー役割の統計
    const stats = db.prepare(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `).all();

    console.log('\n\n現在のユーザー役割の統計:');
    stats.forEach(stat => {
      console.log(`  ${stat.role}: ${stat.count}件`);
    });

    // コミット
    db.exec('COMMIT');
    console.log('\n✓ マイグレーションが正常に完了しました\n');

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  db.close();

} catch (error) {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}
