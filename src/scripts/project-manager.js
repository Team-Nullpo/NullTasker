import { AppConfig } from "./config.js";
import { SimpleAuth } from "./simple-auth.js";
import { Utils } from "./utils.js";
import { Logger } from "./logger.js";
import { LoadingManager } from "./loading-manager.js";
import { Validator } from "./validator.js";
export class ProjectManager {
  static STORAGE_KEY = "currentProject";
  static currentProject = null;
  static projectSettings = [];

  static setCurrentProject(project) {
    localStorage.setItem(this.STORAGE_KEY, project);
    this.currentProject = project;
    Logger.debug(`現在のプロジェクト: ${project}`);
  }
  static getCurrentProjectId() {
    if (!this.currentProject) {
      this.currentProject = localStorage.getItem(this.STORAGE_KEY);
      Logger.debug(`Loaded project from localStorage: ${this.currentProject}`);
    }

    // 保存されているプロジェクトIDが実際に存在するか確認
    if (this.currentProject && this.projectSettings && this.projectSettings.length > 0) {
      const projectExists = this.projectSettings.some(p => p.id === this.currentProject);
      if (!projectExists) {
        Logger.warn(`Saved project (${this.currentProject}) not found in available projects. Selecting first available.`);
        this.currentProject = null; // リセットして再選択
      }
    }

    if (!this.currentProject) {
      // 利用可能なプロジェクトがあるか確認
      if (this.projectSettings && this.projectSettings.length > 0) {
        this.currentProject = this.projectSettings[0].id;
        Logger.debug(`Using first available project: ${this.currentProject}`);
      } else {
        this.currentProject = "default";
        Logger.warn(`No projects available, using default: ${this.currentProject}`);
      }
      this.setCurrentProject(this.currentProject);
    }
    return this.currentProject;
  }
  static getProjectSettings(id = null) {
    if (!id) return this.projectSettings;
    Logger.debug(`Looking for project: ${id}, Available projects:`, this.projectSettings);
    const currentSetting = this.projectSettings.find((p) => (p.id === id));
    if (!currentSetting) {
      Logger.warn(`指定のプロジェクト(${id})が見つかりません。利用可能なプロジェクト:`, this.projectSettings);
      return null;
    }
    return currentSetting;
  }
  static clearCurrentProject() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentProject = null;
    Logger.debug("現在のプロジェクトをクリアしました");
  }
  static async fetchProjectSettings(admin = false) {
    return LoadingManager.wrap(async () => {
      try {
        const url = admin ? "/api/admin/projects" : "/api/projects";
        Logger.debug(`Fetching projects from: ${url}`);
        const res = await fetch(url, {
          headers: SimpleAuth.getAuthHeaders(),
        });
        Logger.debug(`Response status: ${res.status}`);
        if (!res.ok) {
          const errorText = await res.text();
          Logger.error('Server error response:', errorText);
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        const data = await res.json();
        Logger.debug('Fetched projects:', data);
        this.projectSettings = data;
      } catch (error) {
        Logger.error("プロジェクト設定の読み込みに失敗しました:", error);
        Logger.error('Error details:', error.message);
        this.projectSettings = [];
      }
    }, 'プロジェクトデータを読み込んでいます...');
  }
  static async addProject(payload) {
    return LoadingManager.wrap(async () => {
      try {
        // バリデーション
        const validation = Validator.validateProject(payload);
        if (!validation.valid) {
          Logger.warn('Project validation failed:', validation.errors);
          alert('入力エラー:\n' + validation.errors.join('\n'));
          return false;
        }

        const response = await fetch("/api/admin/projects", {
          method: "POST",
          headers: SimpleAuth.getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error("サーバーエラーレスポンス:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newProject = await response.json();
        this.projectSettings.push(newProject);
        Logger.info("プロジェクト作成に成功しました: ", response.status);
      } catch (error) {
        Logger.error('プロジェクト作成エラー:', error);
        return false;
      }
      return true;
    }, 'プロジェクトを作成しています...');
  }
  static async updateProject(payload, id) {
    return LoadingManager.wrap(async () => {
      const index = this.projectSettings.findIndex((p) => p.id === id);
      if (index === -1) {
        Logger.warn("対象のプロジェクトが見つかりません");
        return false;
      }

      // バリデーション（部分的な更新を許可）
      const validation = Validator.validateProject(payload, true);
      if (!validation.valid) {
        Logger.warn('Project validation failed:', validation.errors);
        alert('入力エラー:\n' + validation.errors.join('\n'));
        return false;
      }

      try {
        const response = await fetch(`/api/admin/projects/${id}`, {
          method: "PUT",
          headers: SimpleAuth.getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error("サーバーエラーレスポンス:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newProject = await response.json();
        this.projectSettings[index] = newProject;
        Logger.info("プロジェクト更新に成功しました: ", response.status);
      } catch (error) {
        Logger.error('プロジェクト更新エラー:', error);
        return false;
      }
      return true;
    }, 'プロジェクトを更新しています...');
  }
  static async removeProject(id) {
    return LoadingManager.wrap(async () => {
      const index = this.projectSettings.findIndex((p) => p.id === id);
      if (index === -1) {
        Logger.warn("対象のプロジェクトが見つかりません");
        return false;
      }
      try {
        const response = await fetch(`/api/admin/projects/${id}`, {
          method: "DELETE",
          headers: SimpleAuth.getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.error("サーバーエラーレスポンス:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.projectSettings.splice(index, 1);
        Logger.info("プロジェクト削除に成功しました: ", response.status);
      } catch (error) {
        Logger.error('プロジェクト削除エラー:', error);
        return false;
      }
      return true;
    }, 'プロジェクトを削除しています...');
  }
}
