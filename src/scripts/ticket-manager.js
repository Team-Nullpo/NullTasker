import { SimpleAuth } from "./simple-auth.js";
import { Utils } from "./utils.js";

export class TicketManager {
  static tasks = [];

  // DB/APIから返却されるスネークケースのフィールドをキャメルケースに正規化する
  static normalizeTask(raw) {
    if (!raw) return raw;
    return {
      id: raw.id,
      project: raw.project,
      title: raw.title,
      description: raw.description ?? raw.desc ?? null,
      assignee: raw.assignee ?? null,
      category: raw.category ?? null,
      priority: raw.priority ?? null,
      status: raw.status ?? null,
      progress: raw.progress ?? 0,
      // DBは snake_case、APIの一部は camelCase を返す可能性があるため両方をチェック
      startDate: raw.startDate ?? raw.start_date ?? null,
      dueDate: raw.dueDate ?? raw.due_date ?? null,
      estimatedHours: raw.estimatedHours ?? raw.estimated_hours ?? null,
      actualHours: raw.actualHours ?? raw.actual_hours ?? null,
      tags: raw.tags ?? raw.tags_list ?? [],
      parentTask: raw.parentTask ?? raw.parent_task ?? null,
      createdAt: raw.createdAt ?? raw.created_at ?? null,
      updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    };
  }

  static async fetchTickets() {
    try {
      const res = await fetch("/api/tasks", {
        headers: SimpleAuth.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        // 正規化して内部データにセット
        this.tasks = data.tasks.map((t) => this.normalizeTask(t));
      } else if (Array.isArray(data)) {
        this.tasks = data.map((t) => this.normalizeTask(t));
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
  // サーバーが返すタスクを正規化して格納
  this.tasks.push(this.normalizeTask(newTicket));
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
  // 更新レスポンスはDBからのスネークケースかもしれないので正規化して置換
  this.tasks[index] = this.normalizeTask(newTicket);
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
