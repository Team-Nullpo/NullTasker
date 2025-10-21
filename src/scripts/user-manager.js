import { SimpleAuth } from './simple-auth.js';
import { Utils } from './utils.js';

export class UserManager {
  static users = [];

  static async fetchUsers(admin = false) {
    try {
      const url = admin ? '/api/admin/users' : '/api/users';
      const res = await fetch(url, {
        headers: SimpleAuth.getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      this.users = data;
      console.log(this.users);
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
    }
  }

  static getUsers(projectId = null) {
    if (!projectId) return this.users;
    const filteredUsers = this.users.filter(u => u.projects.includes(projectId));
    return filteredUsers;
  }

  static async addUser(payload, admin = true) {
    try {
      const url = admin ? '/api/admin/users' : '/api/register';
      const headers = admin ? SimpleAuth.getAuthHeaders() : {'Content-Type': 'application/json'};
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('サーバーエラーレスポンス:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newUser = await response.json();
      this.users.push(newUser);
      console.log('ユーザー作成に成功しました:', response.status);
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      return false;
    }
    return true;
  }
  // 一般ユーザーのプロフィール更新
  static async updateProfile(payload) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('プロフィール更新エラー:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newUser = await response.json();
      console.log('プロフィール更新に成功しました');
      const index = this.users.findIndex(u => u.id === newUser.id);
      this.users[index] = newUser;

      return true;
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return false;
    }
  }

  // 一般ユーザーのパスワード変更
  static async updatePassword(payload) {
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('パスワード変更エラー:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('パスワード変更に成功しました');
      return true;
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      return false;
    }
  }

  // 管理者によるユーザー更新
  static async updateUser(payload, userId) {
    try {
      const index = this.users.findIndex((u) => u.id === userId);
      if (index === -1) {
        Utils.debugLog("対象のユーザーが見つかりません");
        return false;
      }
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ユーザー更新エラー:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newUser = await response.json();
      console.log('ユーザー更新に成功しました');
      this.users[index] = newUser;
      return true;
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      return false;
    }
  }

  static async removeUser(id) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      Utils.debugLog("対象のユーザーが見つかりません");
      return false;
    }
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: SimpleAuth.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.users.splice(index, 1);
      Utils.debugLog("ユーザー削除に成功しました: ", response.status);
    } catch (error) {
      return false;
    }
    return true;
  }
}
