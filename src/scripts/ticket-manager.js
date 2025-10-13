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

  static async addTicket(ticket) {
    const previousTask = [...this.tasks];
    this.tasks.push(ticket);
    try {
      await this.saveTickets();
    } catch (error) {
      this.tasks = previousTask;
      return false;
    }
    return true;
  }

  static async updateTicket(ticket) {
    const previousTask = [...this.tasks];
    const index = this.tasks.findIndex((t) => t.id === ticket.id);
    if (index === -1) {
      Utils.debugLog("対象のチケットが見つかりません");
      return false;
    }
    this.tasks[index] = {
      ...this.tasks[index],
      ...ticket,
      updatedAt: new Date().toISOString(),
    };
    try {
      await this.saveTickets();
    } catch (error) {
      this.tasks = previousTask;
      return false;
    }
    return true;
  }

  static async removeTicket(ticketId) {
    const previousTask = [...this.tasks];
    this.tasks = this.tasks.filter((t) => t.id !== ticketId);
    try {
      await this.saveTickets();
    } catch (error) {
      this.tasks = previousTask;
      return false;
    }
    return true;
  }

  static async saveTickets() {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify({ tasks: this.tasks }),
      });

      Utils.debugLog(
        "レスポンスステータス:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      Utils.debugLog("タスク保存に成功しました: ", result);
    } catch (error) {
      console.error("タスク保存に失敗しました: ", error.message);
      throw new Error(error);
    }
  }
}
