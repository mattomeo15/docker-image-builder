export interface FileItem {
  name: string;
  path: string; // Relative path from workspace root, e.g., "Dockerfile" or "src/index.js"
  type: 'file' | 'directory';
  size?: number;
  content?: string; // Loaded on demand for text editing
}

export interface BuildHistoryItem {
  id: string;
  imageName: string;
  tag: string;
  timestamp: string;
  status: 'success' | 'failed' | 'building' | 'pushing' | 'pushed';
  duration?: number;
  logs?: string[];
}

export interface DockerHubCredentials {
  username: string;
  token: string;
  isConfigured: boolean;
}

export interface WorkspaceStatus {
  files: FileItem[];
  currentImageName: string;
  currentTag: string;
}
