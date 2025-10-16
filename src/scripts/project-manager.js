import { AppConfig } from "./config.js";
import { SimpleAuth } from "./simple-auth.js";
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
    }
    if (!this.currentProject) {
      this.currentProject = "default";
      this.setCurrentProject(this.currentProject);
      console.warn(
        "プロジェクトIDの取得に失敗しました。デフォルトを使用します"
      );
    }
    return this.currentProject;
  }
  static getProjectSettings(id = null) {
    if (!id) return this.projectSettings;
    const currentSetting = this.projectSettings.find(p => p.id = id);
    if (!currentSetting) {
      console.warn("指定のプロジェクトが見つかりません。");
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
      const url = admin ? '/api/admin/projects' : '/api/projects';
      const res = await fetch(url, {
        headers: SimpleAuth.getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      this.projectSettings = data;
      console.log(this.projectSettings);
    } catch (error) {
      console.error("設定の読み込みに失敗しました:", error);
      this.currentProjectSettings = AppConfig.getDefaultSettings();
    }
  }
  static async addProject() {
    
  }
}
