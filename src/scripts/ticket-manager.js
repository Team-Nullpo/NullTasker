import { SimpleAuth } from "./simple-auth.js";
import { Utils } from "./utils.js";
import { Logger } from "./logger.js";
import { LoadingManager } from "./loading-manager.js";

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
    return LoadingManager.wrap(async () => {
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
          Logger.warn("APIレスポンスが配列ではありません:", data);
          this.tasks = [];
        }
        Logger.debug('Fetched tickets:', this.tasks.length);
      } catch (error) {
        Logger.error("チケットの取得に失敗しました", error);
      }
    }, 'タスクデータを読み込んでいます...');
  }

  static async createTicket(ticket) {
    return LoadingManager.wrap(async () => {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: SimpleAuth.getAuthHeaders(),
          body: JSON.stringify(ticket),
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error("サーバーエラーレスポンス:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newTicket = await response.json();
        // サーバーが返すタスクを正規化して格納
        this.tasks.push(this.normalizeTask(newTicket));
        Logger.debug(newTicket);
        Logger.debug(this.tasks);
        Logger.info("タスク保存に成功しました: ", response.status);

      } catch (error) {
        Logger.error('タスク作成エラー:', error);
        return false;
      }
      return true;
    }, 'タスクを作成しています...');
  }

  static async updateTicket(ticket, id) {
    return LoadingManager.wrap(async () => {
      const index = this.tasks.findIndex((t) => t.id === id);
      if (index === -1) {
        Logger.warn("対象のチケットが見つかりません");
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
          Logger.error("サーバーエラーレスポンス:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newTicket = await response.json();
        // 更新レスポンスはDBからのスネークケースかもしれないので正規化して置換
        this.tasks[index] = this.normalizeTask(newTicket);
        Logger.debug(newTicket);
        Logger.debug(this.tasks);
        Logger.info("タスク保存に成功しました: ", response.status);
      } catch (error) {
        Logger.error('タスク更新エラー:', error);
        return false;
      }
      return true;
    }, 'タスクを更新しています...');
  }

  static async removeTicket(id) {
    return LoadingManager.wrap(async () => {
      const index = this.tasks.findIndex((t) => t.id === id);
      if (index === -1) {
        Logger.warn("対象のチケットが見つかりません");
        return false;
      }
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: "DELETE",
          headers: SimpleAuth.getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error("サーバーエラーレスポンス:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.tasks.splice(index, 1);
        Logger.info("タスク削除に成功しました: ", response.status);
      } catch (error) {
        Logger.error('タスク削除エラー:', error);
        return false;
      }
      return true;
    }, 'タスクを削除しています...');
  }
}
