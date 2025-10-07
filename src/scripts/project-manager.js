import { AppConfig } from "./config.js";
import { SimpleAuth } from "./simple-auth.js";
export class ProjectManager {
  static STORAGE_KEY = "currentProject";
  static currentProject = null;
  static currentProjectSettings = null;
  static projectSettings = null;

  static setCurrentProject(project) {
    localStorage.setItem(this.STORAGE_KEY, project);
    this.currentProject = project;
    console.log(`現在のプロジェクト: ${project}`);
  }
  static getCurrentProject() {
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
  static clearCurrentProject() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentProject = null;
    console.log("現在のプロジェクトをクリアしました");
  }
  static async fetchProjectSettings() {
    this.getCurrentProject();
    try {
      const res = await fetch(`/api/projects`, {
        headers: SimpleAuth.getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      this.projectSettings = data;
      this.currentProjectSettings = data.projects.find(p => p.id === this.currentProject);
      if (!this.currentProjectSettings) {
        this.currentProjectSettings = data.projects.find(p => p.id === 'default');
        console.warn(`プロジェクト${this.currentProject}が見つかりません。デフォルトプロジェクトを読み込みます。`);
        this.setCurrentProject('default');
      }

    } catch (error) {
      console.error("設定の読み込みに失敗しました:", error);
      this.currentProjectSettings = AppConfig.getDefaultSettings();
    }
    console.log(this.currentProject);
    console.log(this.projectSettings);
    console.log(this.currentProjectSettings);
  }
}
