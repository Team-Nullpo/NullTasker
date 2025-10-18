// ユーザー関連の型定義
export type UserRole = 'system_admin' | 'project_admin' | 'user';

export interface User {
  id: string;
  loginId: string;
  displayName: string;
  email: string;
  password?: string; // クライアント側では通常含まれない
  role: UserRole;
  projects: string[];
  createdAt: string;
  lastLogin: string | null;
}

export interface UserProfile {
  id: string;
  loginId: string;
  displayName: string;
  email: string;
  role: UserRole;
  projects: string[];
}

// 認証関連の型定義
export interface LoginRequest {
  loginId: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: UserProfile;
  message: string;
}

export interface RegisterRequest {
  loginId: string;
  displayName: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (loginId: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// タスク関連の型定義
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  progress: number;
  project: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasksData {
  tasks: Task[];
  lastUpdated: string;
}

// プロジェクト関連の型定義
export interface ProjectSettings {
  categories: string[];
  priorities: Array<{ value: TaskPriority; label: string; color: string }>;
  statuses: Array<{ value: TaskStatus; label: string; color: string }>;
  notifications: boolean;
  autoAssign: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: string[];
  admins: string[];
  settings: ProjectSettings;
  createdAt: string;
  lastUpdated: string;
}

export interface ProjectsData {
  projects: Project[];
  lastUpdated: string;
}

// 設定関連の型定義
export interface AppSettings {
  appName: string;
  version: string;
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  features: {
    notifications: boolean;
    autoSave: boolean;
    backupEnabled: boolean;
  };
  lastUpdated: string;
}

// API レスポンスの型定義
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface UsersResponse {
  users: UserProfile[];
  projects?: Project[];
  lastUpdated: string;
}

// フォーム関連の型定義
export interface TaskFormData {
  title: string;
  description: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  progress: number;
  project: string;
}

export interface UserFormData {
  loginId: string;
  displayName: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface ProjectFormData {
  id: string;
  name: string;
  description: string;
  owner: string;
}

// ユーティリティ型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
