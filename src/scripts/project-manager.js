import { AppConfig } from "./config.js";
import { SimpleAuth } from "./simple-auth.js";
import { Utils } from "./utils.js";
export class ProjectManager {
  static STORAGE_KEY = "currentProject";
  static currentProject = null;
  static projectSettings = [];

  static setCurrentProject(project) {
    localStorage.setItem(this.STORAGE_KEY, project);
    this.currentProject = project;
    console.log(`現在のプロジェクト: ${project}`);
  }
  static getCurrentProjectId() {
    if (!this.currentProject) {
      this.currentProject = localStorage.getItem(this.STORAGE_KEY);
      console.log(`Loaded project from localStorage: ${this.currentProject}`);
    }

    // 保存されているプロジェクトIDが実際に存在するか確認
    if (this.currentProject && this.projectSettings && this.projectSettings.length > 0) {
      const projectExists = this.projectSettings.some(p => p.id === this.currentProject);
      if (!projectExists) {
        console.warn(`Saved project (${this.currentProject}) not found in available projects. Selecting first available.`);
        this.currentProject = null; // リセットして再選択
      }
    }

    if (!this.currentProject) {
      // 利用可能なプロジェクトがあるか確認
      if (this.projectSettings && this.projectSettings.length > 0) {
        this.currentProject = this.projectSettings[0].id;
        console.log(`Using first available project: ${this.currentProject}`);
      } else {
        this.currentProject = "default";
        console.warn(`No projects available, using default: ${this.currentProject}`);
      }
      this.setCurrentProject(this.currentProject);
    }
    return this.currentProject;
  }
  static getProjectSettings(id = null) {
    if (!id) return this.projectSettings;
    console.log(`Looking for project: ${id}, Available projects:`, this.projectSettings);
    const currentSetting = this.projectSettings.find((p) => (p.id === id));
    if (!currentSetting) {
      console.warn(`指定のプロジェクト(${id})が見つかりません。利用可能なプロジェクト:`, this.projectSettings);
      return null;
    }
    return currentSetting;
  }
  static clearCurrentProject() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentProject = null;
    console.log("現在のプロジェクトをクリアしました");
  }
  static async fetchProjectSettings(admin = false) {
    try {
      const url = admin ? "/api/admin/projects" : "/api/projects";
      console.log(`Fetching projects from: ${url}`);
      const res = await fetch(url, {
        headers: SimpleAuth.getAuthHeaders(),
      });
      console.log(`Response status: ${res.status}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }
      const data = await res.json();
      console.log('Fetched projects:', data);
      this.projectSettings = data;
    } catch (error) {
      console.error("プロジェクト設定の読み込みに失敗しました:", error);
      console.error('Error details:', error.message);
      this.projectSettings = [];
    }
  }
  static async addProject(payload) {
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: SimpleAuth.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newProject = await response.json();
      this.projectSettings.push(newProject);
      Utils.debugLog("プロジェクト作成に成功しました: ", response.status);
    } catch (error) {
      return false;
    }
    return true;
  }
  static async updateProject(payload, id) {
    const index = this.projectSettings.findIndex((p) => p.id === id);
    if (index === -1) {
      Utils.debugLog("対象のプロジェクトが見つかりません");
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
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newProject = await response.json();
      this.projectSettings[index] = newProject;
      Utils.debugLog("プロジェクト更新に成功しました: ", response.status);
    } catch (error) {
      return false;
    }
    return true;
  }
  static async removeProject(id) {
    const index = this.projectSettings.findIndex((p) => p.id === id);
    if (index === -1) {
      Utils.debugLog("対象のプロジェクトが見つかりません");
      return false;
    }
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
        headers: SimpleAuth.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("サーバーエラーレスポンス:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.projectSettings.splice(index, 1);
      Utils.debugLog("プロジェクト削除に成功しました: ", response.status);
    } catch (error) {
      return false;
    }
    return true;
  }
}
