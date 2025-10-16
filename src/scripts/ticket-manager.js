import { SimpleAuth } from "./simple-auth.js";
import { Utils } from "./utils.js";

export class TicketManager {
  static tasks = [];

  static async fetchTickets() {
    try {
      const res = await fetch("/api/tasks", {
        headers: SimpleAuth.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        this.tasks = data.tasks;
      } else if (Array.isArray(data)) {
        this.tasks = data;
      } else {
        console.warn("APIレスポンスが配列ではありません:", data);
        this.tasks = [];
      }
    } catch (error) {
      console.log("チケットの取得に失敗しました", error);
    }
  }

  static async createTicket(ticket) {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newTicket = await response.json();
      this.tasks.push(newTicket);
      console.log(newTicket);
      console.log(this.tasks);
      Utils.debugLog("タスク保存に成功しました: ", response.status);

    } catch (error) {
      return false;
    }
    return true;
  }

  static async updateTicket(ticket, id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      Utils.debugLog("対象のチケットが見つかりません");
      return false;
    }
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newTicket = await response.json();
      this.tasks[index] = newTicket;
      console.log(newTicket);
      console.log(this.tasks);
      Utils.debugLog("タスク保存に成功しました: ", response.status);
    } catch (error) {
      return false;
    }
    return true;
  }

  static async removeTicket(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      Utils.debugLog("対象のチケットが見つかりません");
      return false;
    }
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: SimpleAuth.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.tasks.splice(index, 1);
      Utils.debugLog("タスク保存に成功しました: ", response.status);
    } catch (error) {
      return false;
    }
    return true;
  }
}
