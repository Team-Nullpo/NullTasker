import { SimpleAuth } from './simple-auth.js';
import { Utils } from './utils.js';
import { Logger } from './logger.js';
import { LoadingManager } from './loading-manager.js';
import { Validator } from './validator.js';

export class UserManager {
  static users = [];

  static async fetchUsers(admin = false) {
    console.log('UserManager.fetchUsers starting with admin =', admin);
    return LoadingManager.wrap(async () => {
      try {
        const url = admin ? '/api/admin/users' : '/api/users';
        Logger.debug(`Fetching users from: ${url}`);
        console.log(`Fetching users from: ${url}`);
        const res = await fetch(url, {
          headers: SimpleAuth.getAuthHeaders()
        });
        Logger.debug(`Response status: ${res.status}`);
        console.log(`Response status: ${res.status}`);
        if (!res.ok) {
          const errorText = await res.text();
          Logger.error('Server error response:', errorText);
          console.error('Server error response:', errorText);
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        const data = await res.json();
        Logger.debug('Fetched users:', data);
        console.log('Fetched users:', data);
        this.users = data;
        console.log('UserManager.users set to:', this.users);
      } catch (error) {
        Logger.error('ユーザーデータの読み込みに失敗しました:', error);
        Logger.error('Error details:', error.message);
        console.error('ユーザーデータの読み込みに失敗しました:', error);
        this.users = []; // エラー時は空配列を設定
      }
    }, 'ユーザーデータを読み込んでいます...');
  }

  static getUsers(projectId = null) {
    if (!projectId) return this.users;
    const filteredUsers = this.users.filter(u => u.projects.includes(projectId));
    return filteredUsers;
  }

  static async addUser(payload, admin = true) {
    return LoadingManager.wrap(async () => {
      try {
        // バリデーション
        const validation = Validator.validateUser(payload);
        if (!validation.valid) {
          Logger.warn('User validation failed:', validation.errors);
          alert('入力エラー:\n' + validation.errors.join('\n'));
          return false;
        }

        const url = admin ? '/api/admin/users' : '/api/register';
        const headers = admin ? SimpleAuth.getAuthHeaders() : { 'Content-Type': 'application/json' };

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error('サーバーエラーレスポンス:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newUser = await response.json();
        this.users.push(newUser);
        Logger.info('ユーザー作成に成功しました:', response.status);
      } catch (error) {
        Logger.error('ユーザー作成エラー:', error);
        return false;
      }
      return true;
    }, 'ユーザーを作成しています...');
  }
  // 一般ユーザーのプロフィール更新
  static async updateProfile(payload) {
    return LoadingManager.wrap(async () => {
      try {
        // バリデーション（部分的な更新を許可）
        const validation = Validator.validateUser(payload, true);
        if (!validation.valid) {
          Logger.warn('Profile validation failed:', validation.errors);
          alert('入力エラー:\n' + validation.errors.join('\n'));
          return false;
        }

        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: SimpleAuth.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error('プロフィール更新エラー:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newUser = await response.json();
        Logger.info('プロフィール更新に成功しました');
        const index = this.users.findIndex(u => u.id === newUser.id);
        this.users[index] = newUser;

        return true;
      } catch (error) {
        Logger.error('プロフィール更新エラー:', error);
        return false;
      }
    }, 'プロフィールを更新しています...');
  }

  // 一般ユーザーのパスワード変更
  static async updatePassword(payload) {
    return LoadingManager.wrap(async () => {
      try {
        const response = await fetch('/api/user/password', {
          method: 'PUT',
          headers: SimpleAuth.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error('パスワード変更エラー:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        Logger.info('パスワード変更に成功しました');
        return true;
      } catch (error) {
        Logger.error('パスワード変更エラー:', error);
        return false;
      }
    }, 'パスワードを変更しています...');
  }

  // 管理者によるユーザー更新
  static async updateUser(payload, userId) {
    return LoadingManager.wrap(async () => {
      try {
        const index = this.users.findIndex((u) => u.id === userId);
        if (index === -1) {
          Logger.warn("対象のユーザーが見つかりません");
          return false;
        }

        // バリデーション（部分的な更新を許可）
        const validation = Validator.validateUser(payload, true);
        if (!validation.valid) {
          Logger.warn('User validation failed:', validation.errors);
          alert('入力エラー:\n' + validation.errors.join('\n'));
          return false;
        }

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: SimpleAuth.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error('ユーザー更新エラー:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newUser = await response.json();
        Logger.info('ユーザー更新に成功しました');
        this.users[index] = newUser;
        return true;
      } catch (error) {
        Logger.error('ユーザー更新エラー:', error);
        return false;
      }
    }, 'ユーザーを更新しています...');
  }

  static async removeUser(id) {
    return LoadingManager.wrap(async () => {
      const index = this.users.findIndex((u) => u.id === id);
      if (index === -1) {
        Logger.warn("対象のユーザーが見つかりません");
        return false;
      }
      try {
        const response = await fetch(`/api/admin/users/${id}`, {
          method: "DELETE",
          headers: SimpleAuth.getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error("サーバーエラーレスポンス:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.users.splice(index, 1);
        Logger.info("ユーザー削除に成功しました: ", response.status);
      } catch (error) {
        Logger.error('ユーザー削除エラー:', error);
        return false;
      }
      return true;
    }, 'ユーザーを削除しています...');
  }
}
