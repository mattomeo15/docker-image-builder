import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  GitBranch, 
  Settings, 
  HelpCircle, 
  History, 
  Play, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Github, 
  Info,
  Container,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Eye,
  HardDrive,
  Terminal as TerminalIcon,
  Download
} from 'lucide-react';
import { FileItem, BuildHistoryItem, DockerHubCredentials } from './types';
import FileTree from './components/FileTree';
import FileEditor from './components/FileEditor';
import Terminal from './components/Terminal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  // State variables
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [openedFileContent, setOpenedFileContent] = useState('');
  const [isEditorSaving, setIsEditorSaving] = useState(false);
  
  // Importer state
  const [gitUrl, setGitUrl] = useState('');
  const [clearFirst, setClearFirst] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [gitStatus, setGitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Naming & tag state
  const [imageName, setImageName] = useState('username/my-app');
  const [tag, setTag] = useState('latest');
  const [suggestDropdownOpen, setSuggestDropdownOpen] = useState(false);

  // History & logs
  const [history, setHistory] = useState<BuildHistoryItem[]>([]);
  const [terminalLogs, setTerminalLogs] = useState('');
  const [isActionRunning, setIsActionRunning] = useState(false);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [creds, setCreds] = useState<DockerHubCredentials>({
    username: '',
    token: '',
    isConfigured: false
  });

  // Sidebar and mobile responsiveness states
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'files' | 'viewer' | 'console' | 'config'>('files');

  // Dark theme preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('docker-builder-theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('docker-builder-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('docker-builder-theme', 'light');
    }
  }, [isDarkMode]);

  // Load initial data
  useEffect(() => {
    fetchWorkspaceFiles();
    fetchHistory();
    fetchCredentials();
  }, []);

  // API Call: Fetch workspace file list
  const fetchWorkspaceFiles = async () => {
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Error fetching workspace files:', err);
    }
  };

  // API Call: Fetch build history
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching build history:', err);
    }
  };

  // API Call: Fetch active credentials setup (username only)
  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials');
      if (res.ok) {
        const data = await res.json();
        setCreds({
          username: data.username,
          token: '', // token hidden
          isConfigured: data.isConfigured
        });
      }
    } catch (err) {
      console.error('Error fetching credentials info:', err);
    }
  };

  // Selection Action: Read file content
  const handleSelectFile = async (path: string) => {
    setSelectedPath(path);
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext);
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);
    
    if (isImage || isAudio) {
      setOpenedFileContent('');
      return;
    }

    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setOpenedFileContent(data.content);
      }
    } catch (err) {
      console.error('Error loading file content:', err);
    }
  };

  // Creation Action: New File
  const handleCreateFile = async (name: string, dir: string) => {
    const relPath = dir ? `${dir}/${name}` : name;
    try {
      const res = await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relPath, content: '' })
      });
      if (res.ok) {
        await fetchWorkspaceFiles();
        await handleSelectFile(relPath);
      }
    } catch (err) {
      console.error('Error creating file:', err);
    }
  };

  // Creation Action: New Folder
  const handleCreateFolder = async (name: string, dir: string) => {
    const relPath = dir ? `${dir}/${name}` : name;
    try {
      const res = await fetch('/api/workspace/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relPath })
      });
      if (res.ok) {
        await fetchWorkspaceFiles();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  // Save Action: Overwrite File
  const handleSaveFile = async (path: string, content: string) => {
    setIsEditorSaving(true);
    try {
      const res = await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content })
      });
      if (res.ok) {
        setOpenedFileContent(content);
        await fetchWorkspaceFiles();
      }
    } catch (err) {
      console.error('Error saving file:', err);
    } finally {
      setIsEditorSaving(false);
    }
  };

  // Deletion Action: Delete File/Folder
  const handleDeletePath = async (path: string) => {
    if (!confirm(`Are you sure you want to delete ${path}? This action is permanent.`)) return;
    try {
      const res = await fetch(`/api/workspace/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedPath === path) {
          setSelectedPath(null);
          setOpenedFileContent('');
        }
        await fetchWorkspaceFiles();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  // Upload Action: File Manager Upload
  const handleUploadFile = async (file: File, relativePath: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', relativePath);

    try {
      const res = await fetch('/api/workspace/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        await fetchWorkspaceFiles();
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  // Clear Action: Purge entire workspace
  const handleClearWorkspace = async () => {
    if (!confirm('Are you sure you want to clear the entire workspace? All custom Dockerfiles and scripts will be permanently lost.')) return;
    try {
      const res = await fetch('/api/workspace/clear', { method: 'POST' });
      if (res.ok) {
        setSelectedPath(null);
        setOpenedFileContent('');
        await fetchWorkspaceFiles();
      }
    } catch (err) {
      console.error('Error clearing workspace:', err);
    }
  };

  // Importer Action: GitHub Clone Integration
  const handleImportGit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitUrl.trim()) return;

    setIsCloning(true);
    setGitStatus(null);
    try {
      const res = await fetch('/api/workspace/git-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gitUrl.trim(), clearFirst })
      });
      const data = await res.json();
      if (res.ok) {
        setGitStatus({ type: 'success', message: data.message || 'Repository imported successfully!' });
        setGitUrl('');
        await fetchWorkspaceFiles();
      } else {
        setGitStatus({ type: 'error', message: data.error || 'Failed to clone repository.' });
      }
    } catch (err: any) {
      setGitStatus({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsCloning(false);
    }
  };

  // Settings Action: Update credentials
  const handleSaveCredentials = async (username: string, token: string) => {
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, token })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save credentials.');
    }
    await fetchCredentials();
  };

  // Docker Action Execution: Runs standard Build/Push stream
  const executeDockerCommand = async (endpoint: string) => {
    if (!imageName.trim() || !tag.trim()) {
      alert('Please fill out both the Image Name and Tag fields.');
      return;
    }

    setIsActionRunning(true);
    setTerminalLogs('');
    setSuggestDropdownOpen(false);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName: imageName.trim(), tag: tag.trim() })
      });

      if (!res.ok) {
        const errorText = await res.text();
        setTerminalLogs(`❌ CONNECTION FAILURE: ${res.status} ${res.statusText}\n${errorText}`);
        setIsActionRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setTerminalLogs('❌ ERROR: Readable stream response is not supported in this browser.');
        setIsActionRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setTerminalLogs(prev => prev + chunk);
      }

      // Reload built tag list and history on finish
      await fetchHistory();
      await fetchWorkspaceFiles();
    } catch (err: any) {
      setTerminalLogs(prev => prev + `\n\n❌ CONNECTION INTERRUPTED: ${err.message}\n`);
    } finally {
      setIsActionRunning(false);
    }
  };

  // Helper to click history and pre-fill form
  const selectHistoryItem = (item: BuildHistoryItem) => {
    setImageName(item.imageName);
    setTag(item.tag);
    setSuggestDropdownOpen(false);
  };

  // Generate list of unique previous image names for autocomplete
  const getUniquePreviousImages = () => {
    const names = history.map(h => h.imageName);
    return Array.from(new Set(names)).slice(0, 5);
  };

  // Download Image Action
  const handleDownloadImage = () => {
    if (!imageName.trim() || !tag.trim()) {
      setTerminalLogs('❌ ERROR: Please specify an Image Name and Tag first to download.\n');
      return;
    }
    
    setTerminalLogs(prev => prev + `[EXPORT-START] Requesting download for: ${imageName.trim()}:${tag.trim()}...\n`);
    
    const downloadUrl = `/api/download?imageName=${encodeURIComponent(imageName.trim())}&tag=${encodeURIComponent(tag.trim())}`;
    
    // Create an invisible anchor element and click it to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${imageName.trim().replace(/[^a-zA-Z0-9]/g, '_')}_${tag.trim()}.tar`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTerminalLogs(prev => prev + `[SUCCESS] Download request initiated. Check your browser downloads for the exported image tarball.\n`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased overflow-hidden transition-colors duration-200">
      {/* 1. Global Navigation Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1 mr-2">
          <div className="p-2 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 dark:shadow-none shrink-0">
            <Container className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm lg:text-base tracking-tight leading-none flex items-center gap-2">
              <span className="truncate">Docker Image Builder</span>
              <span className="text-[9px] lg:text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md self-center shadow-2xs shrink-0">v1.2.0</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] lg:text-xs mt-1 truncate">Self-Hosted Visual Docker-in-Docker CI/CD</p>
          </div>
        </div>

        {/* Credentials / Controls section */}
        <div className="flex items-center gap-2.5 lg:gap-4 shrink-0">
          <div className="flex items-center">
            {creds.isConfigured ? (
              <span className="flex items-center gap-1.5 text-[10px] lg:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Docker Hub: </span><span className="font-mono font-bold">@{creds.username}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] lg:text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded-full shadow-2xs animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Docker Hub Credentials Missing</span>
                <span className="sm:hidden">Creds Required</span>
              </span>
            )}
          </div>

          <button 
            id="open-settings"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
            title="Configure Credentials"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 2. Primary Layout Container */}
      <main className="flex-1 flex min-h-0 relative">
        
        {/* ========================================================== */}
        {/* DESKTOP LAYOUT (flex on lg screens, hidden on mobile)       */}
        {/* ========================================================== */}
        <div className="hidden lg:flex flex-1 min-h-0 w-full">
          {/* LEFT SIDEBAR */}
          {isLeftSidebarCollapsed ? (
            <aside className="w-12 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-5 shrink-0 bg-white dark:bg-slate-900 transition-all duration-300">
              <button 
                id="expand-left-btn"
                onClick={() => setIsLeftSidebarCollapsed(false)}
                className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer shadow-sm"
                title="Expand Workspace Files"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
              <div className="h-[1px] w-6 bg-slate-100 dark:bg-slate-800" />
              <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-500">
                <HardDrive className="w-4.5 h-4.5" title="Workspace Files" />
                <Github className="w-4.5 h-4.5" title="Pull GitHub Repo" />
              </div>
            </aside>
          ) : (
            <aside className="w-80 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 shrink-0 bg-white dark:bg-slate-900 overflow-y-auto relative transition-all duration-300">
              <button
                onClick={() => setIsLeftSidebarCollapsed(true)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-md hover:scale-105 transition-all cursor-pointer z-10"
                title="Collapse Left Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex-1 flex flex-col min-h-[350px]">
                <FileTree 
                  files={files}
                  selectedPath={selectedPath}
                  onSelectFile={handleSelectFile}
                  onDeletePath={handleDeletePath}
                  onCreateFile={handleCreateFile}
                  onCreateFolder={handleCreateFolder}
                  onUploadFile={handleUploadFile}
                  onClearWorkspace={handleClearWorkspace}
                />
              </div>

              {/* GitHub public repository integration importer */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800/60 px-4 py-2.5 flex items-center gap-2">
                  <Github className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pull GitHub Repo</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900">
                  <form onSubmit={handleImportGit} className="space-y-3">
                    <div>
                      <input 
                        id="github-url-input"
                        type="url"
                        required
                        placeholder="https://github.com/user/repo"
                        value={gitUrl}
                        onChange={e => setGitUrl(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-500 bg-white dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 transition-all font-mono placeholder-slate-400 dark:placeholder-slate-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        id="clear-workspace-checkbox"
                        type="checkbox"
                        checked={clearFirst}
                        onChange={e => setClearFirst(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium select-none cursor-pointer">
                        Wipe workspace before pulling
                      </label>
                    </div>

                    <button 
                      id="git-pull-btn"
                      type="submit"
                      disabled={isCloning}
                      className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-950 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isCloning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Pulling Repository...
                        </>
                      ) : (
                        <>
                          <GitBranch className="w-3.5 h-3.5" />
                          Pull Repository
                        </>
                      )}
                    </button>

                    {gitStatus && (
                      <div className={`p-2.5 rounded-lg text-[11px] font-medium leading-relaxed ${
                        gitStatus.type === 'success' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' 
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
                      }`}>
                        {gitStatus.message}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </aside>
          )}

          {/* MIDDLE COLUMN: Interactive File Editor (Top) & Real-time Console Log (Bottom) */}
          <main className="flex-1 flex flex-col p-4 gap-4 min-w-0 bg-slate-50/50 dark:bg-slate-950/40 transition-colors duration-200">
            {/* Top Half: Visual Code Editor */}
            <div className="flex-1 min-h-[220px]">
              <FileEditor 
                path={selectedPath}
                content={openedFileContent}
                isSaving={isEditorSaving}
                onSave={handleSaveFile}
                onClose={() => {
                  setSelectedPath(null);
                  setOpenedFileContent('');
                }}
              />
            </div>

            {/* Bottom Half: Real-time Terminal Log Output */}
            <div className="h-2/5 min-h-[200px]">
              <Terminal 
                logs={terminalLogs}
                onClear={() => setTerminalLogs('')}
                isRunning={isActionRunning}
              />
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          {isRightSidebarCollapsed ? (
            <aside className="w-12 border-l border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-5 shrink-0 bg-white dark:bg-slate-900 transition-all duration-300">
              <button 
                id="expand-right-btn"
                onClick={() => setIsRightSidebarCollapsed(false)}
                className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer shadow-sm"
                title="Expand Pipeline config"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <div className="h-[1px] w-6 bg-slate-100 dark:bg-slate-800" />
              <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-500">
                <Cpu className="w-4.5 h-4.5" title="Pipeline Config" />
                <History className="w-4.5 h-4.5" title="Pipeline History" />
                <Info className="w-4.5 h-4.5" title="Docker Info" />
              </div>
            </aside>
          ) : (
            <aside className="w-80 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 shrink-0 bg-white dark:bg-slate-900 overflow-y-auto relative transition-all duration-300">
              <button
                onClick={() => setIsRightSidebarCollapsed(true)}
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-md hover:scale-105 transition-all cursor-pointer z-10"
                title="Collapse Right Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Action Trigger Block */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800/60 px-4 py-2.5 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pipeline Config</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 space-y-3.5 relative">
                  
                  {/* Image Name input */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Image Name
                    </label>
                    <div className="relative">
                      <input 
                        id="image-name-input-desktop"
                        type="text"
                        required
                        placeholder="e.g. username/my-app"
                        value={imageName}
                        onChange={e => setImageName(e.target.value)}
                        onFocus={() => setSuggestDropdownOpen(true)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-500 bg-white dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 font-mono transition-all placeholder-slate-400 dark:placeholder-slate-600"
                      />
                    </div>

                    {/* Autocomplete suggestion dropdown */}
                    {suggestDropdownOpen && getUniquePreviousImages().length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 overflow-hidden text-xs max-h-40 overflow-y-auto">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide uppercase px-2.5">
                          Previously Built Images
                        </div>
                        {getUniquePreviousImages().map((prevName, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImageName(prevName);
                              setSuggestDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border-b border-slate-50 dark:border-slate-800 last:border-b-0 transition-colors cursor-pointer"
                          >
                            {prevName}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSuggestDropdownOpen(false)}
                          className="w-full text-center py-1.5 bg-slate-50 dark:bg-slate-950 text-[10px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 font-semibold cursor-pointer"
                        >
                          Close Suggestions
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tag input */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Tag
                    </label>
                    <input 
                      id="image-tag-input-desktop"
                      type="text"
                      required
                      placeholder="e.g. latest or 1.0.0"
                      value={tag}
                      onChange={e => setTag(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-500 bg-white dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 font-mono transition-all placeholder-slate-400 dark:placeholder-slate-600"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2">
                    <button 
                      id="build-image-btn-desktop"
                      disabled={isActionRunning}
                      onClick={() => executeDockerCommand('/api/build')}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isActionRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Executing Pipeline...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Build Image
                        </>
                      )}
                    </button>

                    <button 
                      id="push-image-btn-desktop"
                      disabled={isActionRunning}
                      onClick={() => executeDockerCommand('/api/push')}
                      className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isActionRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          Executing Pipeline...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Push to Docker Hub
                        </>
                      )}
                    </button>

                    <button 
                      id="download-image-btn-desktop"
                      disabled={isActionRunning}
                      onClick={handleDownloadImage}
                      className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Compiled Image
                    </button>
                  </div>

                </div>
              </div>

              {/* Build History Block */}
              <div className="flex-1 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs flex flex-col min-h-[220px]">
                <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800/60 px-4 py-2.5 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pipeline History</span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 flex-1 overflow-y-auto space-y-2.5 max-h-[350px]">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-[11px] italic">
                      No execution history logs found. Trigger a build or push to view history.
                    </div>
                  ) : (
                    history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => selectHistoryItem(item)}
                        className="p-2.5 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-xl bg-white dark:bg-slate-950/20 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-[11px] font-mono text-slate-800 dark:text-slate-200 truncate block flex-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {item.imageName}:{item.tag}
                          </span>
                          
                          {/* Status indicator badges */}
                          {item.status === 'success' && (
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 px-1.5 py-0.5 rounded-md">
                              BUILT
                            </span>
                          )}
                          {item.status === 'pushed' && (
                            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-1.5 py-0.5 rounded-md">
                              PUSHED
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 px-1.5 py-0.5 rounded-md">
                              FAILED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 pt-1 border-t border-slate-50 dark:border-slate-800">
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[9px] opacity-0 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400 transition-opacity font-semibold">
                            Use config &rarr;
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/30">
                <div className="flex gap-2 text-indigo-900 dark:text-indigo-300">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">Docker-in-Docker Info:</span> This app executes builds inside an isolated DinD container environment. Base image caches are saved persistently inside Docker volumes.
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* ========================================================== */}
        {/* MOBILE LAYOUT (shown on mobile, hidden on lg screens)       */}
        {/* ========================================================== */}
        <div className="lg:hidden flex-1 flex flex-col min-h-0 w-full overflow-y-auto p-4 pb-20">
          {activeMobileTab === 'files' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 min-h-[350px]">
                <FileTree 
                  files={files}
                  selectedPath={selectedPath}
                  onSelectFile={(path) => {
                    handleSelectFile(path);
                    setActiveMobileTab('viewer'); // Auto switch to viewer when file is tapped on mobile
                  }}
                  onDeletePath={handleDeletePath}
                  onCreateFile={handleCreateFile}
                  onCreateFolder={handleCreateFolder}
                  onUploadFile={handleUploadFile}
                  onClearWorkspace={handleClearWorkspace}
                />
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800/60 px-4 py-2.5 flex items-center gap-2">
                  <Github className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pull GitHub Repo</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900">
                  <form onSubmit={handleImportGit} className="space-y-3">
                    <div>
                      <input 
                        id="github-url-input-mobile"
                        type="url"
                        required
                        placeholder="https://github.com/user/repo"
                        value={gitUrl}
                        onChange={e => setGitUrl(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-500 bg-white dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 transition-all font-mono placeholder-slate-400 dark:placeholder-slate-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        id="clear-workspace-checkbox-mobile"
                        type="checkbox"
                        checked={clearFirst}
                        onChange={e => setClearFirst(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium select-none cursor-pointer">
                        Wipe workspace before pulling
                      </label>
                    </div>

                    <button 
                      id="git-pull-btn-mobile"
                      type="submit"
                      disabled={isCloning}
                      className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-950 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isCloning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Pulling Repository...
                        </>
                      ) : (
                        <>
                          <GitBranch className="w-3.5 h-3.5" />
                          Pull Repository
                        </>
                      )}
                    </button>

                    {gitStatus && (
                      <div className={`p-2.5 rounded-lg text-[11px] font-medium leading-relaxed ${
                        gitStatus.type === 'success' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' 
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
                      }`}>
                        {gitStatus.message}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeMobileTab === 'viewer' && (
            <div className="flex-1 flex flex-col min-h-[300px]">
              <FileEditor 
                path={selectedPath}
                content={openedFileContent}
                isSaving={isEditorSaving}
                onSave={handleSaveFile}
                onClose={() => {
                  setSelectedPath(null);
                  setOpenedFileContent('');
                }}
              />
            </div>
          )}

          {activeMobileTab === 'console' && (
            <div className="flex-1 flex flex-col min-h-[300px]">
              <Terminal 
                logs={terminalLogs}
                onClear={() => setTerminalLogs('')}
                isRunning={isActionRunning}
              />
            </div>
          )}

          {activeMobileTab === 'config' && (
            <div className="flex-1 flex flex-col gap-4">
              {/* Action Trigger Block */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800/60 px-4 py-2.5 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pipeline Config</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 space-y-3.5 relative">
                  
                  {/* Image Name input */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Image Name
                    </label>
                    <div className="relative">
                      <input 
                        id="image-name-input-mobile"
                        type="text"
                        required
                        placeholder="e.g. username/my-app"
                        value={imageName}
                        onChange={e => setImageName(e.target.value)}
                        onFocus={() => setSuggestDropdownOpen(true)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-500 bg-white dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 font-mono transition-all placeholder-slate-400 dark:placeholder-slate-600"
                      />
                    </div>

                    {/* Autocomplete suggestion dropdown */}
                    {suggestDropdownOpen && getUniquePreviousImages().length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 overflow-hidden text-xs max-h-40 overflow-y-auto">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide uppercase px-2.5">
                          Previously Built Images
                        </div>
                        {getUniquePreviousImages().map((prevName, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImageName(prevName);
                              setSuggestDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border-b border-slate-50 dark:border-slate-800 last:border-b-0 transition-colors cursor-pointer"
                          >
                            {prevName}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSuggestDropdownOpen(false)}
                          className="w-full text-center py-1.5 bg-slate-50 dark:bg-slate-950 text-[10px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 font-semibold cursor-pointer"
                        >
                          Close Suggestions
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tag input */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Tag
                    </label>
                    <input 
                      id="image-tag-input-mobile"
                      type="text"
                      required
                      placeholder="e.g. latest or 1.0.0"
                      value={tag}
                      onChange={e => setTag(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 focus:border-indigo-500 bg-white dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 font-mono transition-all placeholder-slate-400 dark:placeholder-slate-600"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2">
                    <button 
                      id="build-image-btn-mobile"
                      disabled={isActionRunning}
                      onClick={() => executeDockerCommand('/api/build')}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isActionRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Executing Pipeline...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Build Image
                        </>
                      )}
                    </button>

                    <button 
                      id="push-image-btn-mobile"
                      disabled={isActionRunning}
                      onClick={() => executeDockerCommand('/api/push')}
                      className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isActionRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          Executing Pipeline...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Push to Docker Hub
                        </>
                      )}
                    </button>

                    <button 
                      id="download-image-btn-mobile"
                      disabled={isActionRunning}
                      onClick={handleDownloadImage}
                      className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Compiled Image
                    </button>
                  </div>

                </div>
              </div>

              {/* Build History Block */}
              <div className="flex-1 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs flex flex-col min-h-[220px]">
                <div className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100/80 dark:border-slate-800/60 px-4 py-2.5 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pipeline History</span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 flex-1 overflow-y-auto space-y-2.5 max-h-[350px]">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-[11px] italic">
                      No execution history logs found. Trigger a build or push to view history.
                    </div>
                  ) : (
                    history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => selectHistoryItem(item)}
                        className="p-2.5 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-xl bg-white dark:bg-slate-950/20 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-[11px] font-mono text-slate-800 dark:text-slate-200 truncate block flex-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {item.imageName}:{item.tag}
                          </span>
                          
                          {/* Status indicator badges */}
                          {item.status === 'success' && (
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 px-1.5 py-0.5 rounded-md">
                              BUILT
                            </span>
                          )}
                          {item.status === 'pushed' && (
                            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-1.5 py-0.5 rounded-md">
                              PUSHED
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 px-1.5 py-0.5 rounded-md">
                              FAILED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 pt-1 border-t border-slate-50 dark:border-slate-800">
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[9px] opacity-0 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400 transition-opacity font-semibold">
                            Use config &rarr;
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/30">
                <div className="flex gap-2 text-indigo-900 dark:text-indigo-300">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">Docker-in-Docker Info:</span> This app executes builds inside an isolated DinD container environment. Base image caches are saved persistently inside Docker volumes.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* TAB NAVIGATION BAR (MOBILE ONLY)                           */}
        {/* ========================================================== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 shadow-lg">
          <button
            id="mobile-tab-files"
            type="button"
            onClick={() => setActiveMobileTab('files')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
              activeMobileTab === 'files' 
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] tracking-wide uppercase">Files</span>
          </button>
          
          <button
            id="mobile-tab-viewer"
            type="button"
            onClick={() => setActiveMobileTab('viewer')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
              activeMobileTab === 'viewer' 
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] tracking-wide uppercase">Viewer</span>
          </button>

          <button
            id="mobile-tab-console"
            type="button"
            onClick={() => setActiveMobileTab('console')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
              activeMobileTab === 'console' 
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <TerminalIcon className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] tracking-wide uppercase">Console</span>
          </button>

          <button
            id="mobile-tab-config"
            type="button"
            onClick={() => setActiveMobileTab('config')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
              activeMobileTab === 'config' 
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] tracking-wide uppercase">Config</span>
          </button>
        </nav>

      </main>

      {/* 3. Docker Hub Credentials Settings Dialog Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveCredentials}
        currentUsername={creds.username}
        isConfigured={creds.isConfigured}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />
    </div>
  );
}
