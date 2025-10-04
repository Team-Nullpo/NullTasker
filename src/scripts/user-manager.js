export class UserManager {
  static users = {};

  static async getUsers() {
    this.getCurrentProject();
    try {
      const res = await fetch(`/api/users`, {
        headers: SimpleAuth.getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      this.users = await res.json();
    } catch (error) {
      console.error("設定の読み込みに失敗しました:", error);
    }
  }
}
