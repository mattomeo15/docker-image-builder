import React, { useState, useRef, useMemo } from 'react';
import { 
  Folder, 
  File, 
  Trash2, 
  Upload, 
  Plus, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  FileCode,
  HardDrive,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { FileItem } from '../types.js';

interface FileTreeProps {
  files: FileItem[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onDeletePath: (path: string) => void;
  onCreateFile: (name: string, dir: string) => void;
  onCreateFolder: (name: string, dir: string) => void;
  onUploadFile: (file: File, relativePath: string) => void;
  onClearWorkspace: () => void;
}

// Tree builder structure for precise hierarchical sorting
interface TreeNode {
  item?: FileItem;
  name: string;
  type: 'directory' | 'file';
  path: string;
  children: TreeNode[];
}

const buildTree = (items: FileItem[]): TreeNode => {
  const root: TreeNode = { name: '', type: 'directory', path: '', children: [] };
  
  items.forEach(item => {
    const parts = item.path.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');
      let existing = current.children.find(child => child.name === part);
      
      if (!existing) {
        existing = {
          name: part,
          type: (isLast && item.type === 'file') ? 'file' : 'directory',
          path: currentPath,
          children: []
        };
        if (isLast) {
          existing.item = item;
        }
        current.children.push(existing);
      } else if (isLast && !existing.item) {
        existing.item = item;
      }
      
      current = existing;
    });
  });
  
  return root;
};

const sortAndFlatten = (node: TreeNode, method: 'default' | 'reverse' | 'type'): FileItem[] => {
  node.children.sort((a, b) => {
    // Directories always first
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    
    // Both are directories or both are files
    if (method === 'reverse') {
      return b.name.localeCompare(a.name);
    } else if (method === 'type' && a.type === 'file' && b.type === 'file') {
      const extA = a.name.split('.').pop()?.toLowerCase() || '';
      const extB = b.name.split('.').pop()?.toLowerCase() || '';
      if (extA !== extB) {
        return extA.localeCompare(extB);
      }
      return a.name.localeCompare(b.name);
    } else {
      // 'default' (A-Z) or directories comparing under 'type' mode
      return a.name.localeCompare(b.name);
    }
  });
  
  let results: FileItem[] = [];
  node.children.forEach(child => {
    const item: FileItem = child.item || {
      name: child.name,
      path: child.path,
      type: child.type as 'directory' | 'file'
    };
    
    results.push(item);
    
    if (child.type === 'directory') {
      results = results.concat(sortAndFlatten(child, method));
    }
  });
  
  return results;
};

export default function FileTree({
  files,
  selectedPath,
  onSelectFile,
  onDeletePath,
  onCreateFile,
  onCreateFolder,
  onUploadFile,
  onClearWorkspace
}: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMethod, setSortMethod] = useState<'default' | 'reverse' | 'type'>('default');
  const [isDragging, setIsDragging] = useState(false);
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});
  const [showNewFileFor, setShowNewFileFor] = useState<string | null>(null); // path of directory
  const [showNewFolderFor, setShowNewFolderFor] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle collapsing of folders
  const toggleFolder = (dirPath: string) => {
    setCollapsedDirs(prev => ({
      ...prev,
      [dirPath]: prev[dirPath] === false ? true : false
    }));
  };

  const expandAll = () => {
    const nextState: Record<string, boolean> = {};
    files.forEach(f => {
      if (f.type === 'directory') {
        nextState[f.path] = false; // false means expanded
      }
    });
    setCollapsedDirs(nextState);
  };

  const collapseAll = () => {
    setCollapsedDirs({}); // empty means collapsed by default
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const uploadedFiles = e.dataTransfer.files;
    if (uploadedFiles.length > 0) {
      for (let i = 0; i < uploadedFiles.length; i++) {
        // Upload to the root or selected folder
        onUploadFile(uploadedFiles[i], uploadedFiles[i].name);
      }
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        onUploadFile(selectedFiles[i], selectedFiles[i].name);
      }
    }
  };

  // Format file size
  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    return files.filter(f => 
      f.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  // Sort files using built-in tree builder
  const sortedFiles = useMemo(() => {
    const tree = buildTree(filteredFiles);
    return sortAndFlatten(tree, sortMethod);
  }, [filteredFiles, sortMethod]);

  // Organize files into a structured list
  const renderItem = (item: FileItem) => {
    const depth = item.path.split('/').length - 1;
    const isDir = item.type === 'directory';
    const isSelected = selectedPath === item.path;

    // Check if parent directory is collapsed
    const pathParts = item.path.split('/');
    if (pathParts.length > 1) {
      for (let i = 1; i < pathParts.length; i++) {
        const parentPath = pathParts.slice(0, i).join('/');
        if (collapsedDirs[parentPath] !== false) {
          return null; // Don't render if parent is collapsed (collapsed by default unless false)
        }
      }
    }

    return (
      <div 
        key={item.path}
        id={`file-item-${item.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`group flex items-center justify-between py-1.5 px-3 rounded-lg text-sm transition-all duration-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
          isSelected 
            ? 'bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-semibold border-l-2 border-indigo-600 dark:border-indigo-500' 
            : 'text-slate-700 dark:text-slate-300'
        }`}
        onClick={() => {
          if (isDir) {
            toggleFolder(item.path);
          } else {
            onSelectFile(item.path);
          }
        }}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {isDir ? (
            collapsedDirs[item.path] !== false ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )
          ) : (
            <span className="w-3.5" /> // spacing spacer for files
          )}
          
          {isDir ? (
            <Folder className="w-4 h-4 text-amber-500 shrink-0 fill-amber-100 dark:fill-amber-950/30" />
          ) : item.name.toLowerCase() === 'dockerfile' ? (
            <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
          ) : (
            <File className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          
          <span className="truncate">{item.name}</span>
          {!isDir && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden group-hover:inline">
              ({formatSize(item.size)})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={e => e.stopPropagation()}>
          {isDir && (
            <>
              <button 
                id={`add-file-btn-${item.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                title="Add file inside"
                onClick={() => {
                  setShowNewFolderFor(null);
                  setShowNewFileFor(item.path);
                  setNewItemName('');
                }}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button 
                id={`add-folder-btn-${item.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                title="Add directory inside"
                onClick={() => {
                  setShowNewFileFor(null);
                  setShowNewFolderFor(item.path);
                  setNewItemName('');
                }}
                className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button 
            id={`delete-btn-${item.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
            title="Delete"
            onClick={() => onDeletePath(item.path)}
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const handleCreateSubmit = (e: React.FormEvent, parentDir: string, isFolder: boolean) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    if (isFolder) {
      onCreateFolder(newItemName.trim(), parentDir);
      setShowNewFolderFor(null);
    } else {
      onCreateFile(newItemName.trim(), parentDir);
      setShowNewFileFor(null);
    }
    setNewItemName('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors duration-200">
      {/* Workspace Header */}
      <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 tracking-tight text-sm">Workspace Files</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            id="expand-all-folders"
            title="Expand All"
            onClick={expandAll}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            id="collapse-all-folders"
            title="Collapse All"
            onClick={collapseAll}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
          <button 
            id="root-new-file-btn"
            title="New File at Root"
            onClick={() => {
              setShowNewFolderFor(null);
              setShowNewFileFor('');
              setNewItemName('');
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            id="root-new-folder-btn"
            title="New Folder at Root"
            onClick={() => {
              setShowNewFileFor(null);
              setShowNewFolderFor('');
              setNewItemName('');
            }}
            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button 
            id="clear-workspace-btn"
            onClick={onClearWorkspace}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Drag & Drop Overlay Info */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 flex flex-col min-h-0 relative ${
          isDragging ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-400 dark:border-indigo-500' : ''
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-indigo-50/80 dark:bg-slate-950/80 z-10 p-4 text-center">
            <Upload className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-2 animate-bounce" />
            <p className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm">Drop files to upload</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Files will be assembled into the current workspace</p>
          </div>
        )}

        {/* Search and Sort Dropdown */}
        <div className="px-3 pt-3 pb-1 shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input 
              id="search-files"
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/30 dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1 border-b border-slate-50 dark:border-slate-800/40 pb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Sorting</span>
            <select
              id="file-sort-select"
              value={sortMethod}
              onChange={(e) => setSortMethod(e.target.value as 'default' | 'reverse' | 'type')}
              className="text-xs bg-transparent border-none py-0.5 pl-1 pr-5 font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-0 cursor-pointer hover:underline"
            >
              <option value="default" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Folders A-Z</option>
              <option value="reverse" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Folders Z-A</option>
              <option value="type" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">By File Type</option>
            </select>
          </div>
        </div>

        {/* Create Input Box if triggered */}
        {(showNewFileFor !== null || showNewFolderFor !== null) && (
          <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/10 border-b border-indigo-50 dark:border-indigo-900/40 shrink-0">
            <form onSubmit={(e) => handleCreateSubmit(e, (showNewFileFor ?? showNewFolderFor)!, showNewFolderFor !== null)}>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                New {showNewFolderFor !== null ? 'Folder' : 'File'} { (showNewFileFor || showNewFolderFor) ? `in /${showNewFileFor || showNewFolderFor}` : 'at root' }
              </label>
              <div className="flex gap-1.5">
                <input 
                  id="new-item-input"
                  type="text"
                  required
                  autoFocus
                  placeholder={showNewFolderFor !== null ? 'folder-name' : 'filename.txt'}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 border border-slate-200 dark:border-slate-800 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
                />
                <button 
                  id="submit-new-item"
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Create
                </button>
                <button 
                  id="cancel-new-item"
                  type="button"
                  onClick={() => {
                    setShowNewFileFor(null);
                    setShowNewFolderFor(null);
                  }}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* File tree list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sortedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Workspace is empty</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Drag & drop files here, create files with the plus icon, or pull a GitHub repository to get started.
              </p>
              <button
                id="upload-click-btn"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Upload File Manually
              </button>
              <input 
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelectChange}
                className="hidden"
              />
            </div>
          ) : (
            sortedFiles.map(renderItem)
          )}
        </div>

        {/* Upload Footer Link */}
        {sortedFiles.length > 0 && (
          <div className="p-3 border-t border-slate-50 dark:border-slate-800 shrink-0 bg-slate-50/20 dark:bg-slate-950/20">
            <button 
              id="footer-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-center gap-1.5 font-medium cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Additional Files
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelectChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
