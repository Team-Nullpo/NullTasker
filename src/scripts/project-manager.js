export class ProjectManager {
    static STORAGE_KEY = 'currentProject';
    constructor() {
        this.currentProject = null;
    }
    static setCurrentProject(project) {
        localStorage.setItem(this.STORAGE_KEY, project);
        this.currentProject = project;
        console.log(`現在のプロジェクト: ${project}`)
    }
    static getCurrentProject() {
        if (!this.currentProject) {
            this.currentProject = localStorage.getItem(this.STORAGE_KEY);
        }
        if (!this.currentProject) {
            this.currentProject = "default";
            this.setCurrentProject(this.currentProject);
            console.warn("プロジェクトIDの取得に失敗しました。デフォルトを使用します");
        }
        return this.currentProject;
    }
    static clearCurrentProject() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.currentProject = null;
        console.log("現在のプロジェクトをクリアしました");
    }
}