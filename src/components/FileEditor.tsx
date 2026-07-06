import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, X, FileEdit, CheckCircle, Volume2, Image as ImageIcon } from 'lucide-react';

interface FileEditorProps {
  path: string | null;
  content: string;
  isSaving: boolean;
  onSave: (path: string, content: string) => void;
  onClose: () => void;
}

export default function FileEditor({
  path,
  content: initialContent,
  isSaving,
  onSave,
  onClose
}: FileEditorProps) {
  const [editedContent, setEditedContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync content when file path changes
  useEffect(() => {
    setEditedContent(initialContent);
    setHasChanges(false);
    setSaveStatus('idle');
  }, [path, initialContent]);

  // Synchronize scrolling between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/40 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
          <FileEdit className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1 text-sm">No File Opened</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
          Select any file from the workspace file tree on the left to inspect, configure, and edit its contents.
        </p>
      </div>
    );
  }

  const ext = path.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);

  const handleSave = () => {
    onSave(path, editedContent);
    setHasChanges(false);
    setSaveStatus('success');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Support Cmd+S / Ctrl+S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors duration-200">
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded">
            {isImage ? (
              <ImageIcon className="w-4 h-4" />
            ) : isAudio ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <FileEdit className="w-4 h-4" />
            )}
          </span>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{path.split('/').pop()}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">/{path}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveStatus === 'success' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md animate-fade-in">
              <CheckCircle className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
          
          {!isImage && !isAudio && (
            <button 
              id="editor-save-btn"
              disabled={!hasChanges || isSaving}
              onClick={handleSave}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                hasChanges 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Changes
            </button>
          )}

          <button 
            id="editor-close-btn"
            onClick={onClose}
            title="Close editor"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 min-h-0 relative flex flex-row bg-white dark:bg-slate-900">
        {isImage ? (
          /* Image Viewer Panel */
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 p-6 overflow-auto">
            <div className="relative max-w-full max-h-[70vh] flex flex-col items-center">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] dark:bg-[linear-gradient(45deg,#222_25%,transparent_25%),linear-gradient(-45deg,#222_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#222_75%),linear-gradient(-45deg,transparent_75%,#222_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] rounded-xl opacity-20" />
              <img 
                id="image-preview"
                src={`/api/workspace/file?path=${encodeURIComponent(path)}`}
                alt={path.split('/').pop() || ''}
                referrerPolicy="no-referrer"
                className="relative max-w-full max-h-[50vh] object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10"
              />
            </div>
            <div className="mt-4 text-center z-10">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{path.split('/').pop()}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">Media Image Preview • {ext.toUpperCase()}</p>
            </div>
          </div>
        ) : isAudio ? (
          /* Audio Viewer Panel */
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 p-8 overflow-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-lg flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse">
                <Volume2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[280px]">
                  {path.split('/').pop()}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">/{path}</p>
              </div>
              
              <audio 
                id="audio-preview-player"
                src={`/api/workspace/file?path=${encodeURIComponent(path)}`}
                controls
                className="w-full focus:outline-hidden"
              />
              
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Supported HTML5 Audio Stream • {ext.toUpperCase()}
              </div>
            </div>
          </div>
        ) : (
          /* Raw Code Text Area */
          <>
            {/* Line Numbers Sim */}
            <div 
              ref={lineNumbersRef}
              className="w-12 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 py-4 select-none text-right pr-3 font-mono text-xs text-slate-300 dark:text-slate-700 shrink-0 overflow-hidden h-full"
            >
              {Array.from({ length: Math.max(15, editedContent.split('\n').length) }).map((_, idx) => (
                <div key={idx} className="h-[20px] leading-[20px]">{idx + 1}</div>
              ))}
            </div>

            {/* Text Area */}
            <textarea 
              ref={textareaRef}
              id="editor-textarea"
              value={editedContent}
              onChange={e => {
                setEditedContent(e.target.value);
                setHasChanges(true);
              }}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              placeholder="# Write code or Dockerfile settings here..."
              spellCheck={false}
              className="flex-1 h-full p-4 font-mono text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-hidden resize-none leading-[20px] overflow-y-auto"
            />
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-1.5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 bg-slate-50/20 dark:bg-slate-950/20">
        {isImage || isAudio ? (
          <span>Media Mode • Read-Only</span>
        ) : (
          <>
            <span>Lines: {editedContent.split('\n').length}</span>
            <span>UTF-8 • Ctrl+S to save</span>
          </>
        )}
      </div>
    </div>
  );
}
