import { SimpleAuth } from "./simple-auth.js";

export class UserManager {
  static users = {};

  static async fetchUsers() {
    try {
      const res = await fetch(`/api/users`, {
        headers: SimpleAuth.getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      this.users = data.users;
      console.log(this.users);
    } catch (error) {
      console.error("設定の読み込みに失敗しました:", error);
    }
  }
}
