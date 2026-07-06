import React, { useRef, useEffect, useMemo } from 'react';
import { Terminal as TerminalIcon, Copy, Trash2, ChevronRight, CornerDownRight } from 'lucide-react';

interface TerminalProps {
  logs: string;
  onClear: () => void;
  isRunning: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function Terminal({
  logs,
  onClear,
  isRunning,
  isCollapsed = false,
  onToggleCollapse,
  isMaximized = false,
  onToggleMaximize
}: TerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (terminalEndRef.current && !isCollapsed) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isCollapsed]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs);
  };

  // Calculate progress in real-time
  const progressInfo = useMemo(() => {
    if (!logs) return null;
    
    const buildIndex = logs.lastIndexOf('[BUILD-START]');
    const pushIndex = logs.lastIndexOf('[PUSH-START]');
    
    if (buildIndex === -1 && pushIndex === -1) return null;
    
    if (buildIndex > pushIndex) {
      const buildLogs = logs.slice(buildIndex);
      
      if (buildLogs.includes('Successfully built') || buildLogs.includes('🎉 [SUCCESS]')) {
        return { percent: 100, label: 'Build completed successfully!', status: 'success' };
      }
      if (buildLogs.includes('❌ ERROR') || buildLogs.includes('FAILED')) {
        return { percent: 0, label: 'Build failed', status: 'error' };
      }
      
      // Check for steps
      const lines = buildLogs.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        const stepMatch = line.match(/Step\s+(\d+)\s*\/\s*(\d+)/i);
        if (stepMatch) {
          const current = parseInt(stepMatch[1], 10);
          const total = parseInt(stepMatch[2], 10);
          if (total > 0) {
            const percent = Math.min(Math.round((current / total) * 100), 99);
            return { percent, label: `Step ${current} of ${total}`, status: 'running' };
          }
        }
        
        const bracketMatch = line.match(/\[\s*(\d+)\s*\/\s*(\d+)\s*\]/);
        if (bracketMatch) {
          const current = parseInt(bracketMatch[1], 10);
          const total = parseInt(bracketMatch[2], 10);
          if (total > 0) {
            const percent = Math.min(Math.round((current / total) * 100), 99);
            return { percent, label: `Step ${current} of ${total}`, status: 'running' };
          }
        }
      }
      return { percent: 5, label: 'Initializing build context...', status: 'running' };
    } else {
      const pushLogs = logs.slice(pushIndex);
      
      if (pushLogs.includes('Push complete') || pushLogs.includes('🎉 [SUCCESS]')) {
        return { percent: 100, label: 'Push completed successfully!', status: 'success' };
      }
      if (pushLogs.includes('❌ ERROR') || pushLogs.includes('FAILED')) {
        return { percent: 0, label: 'Push failed', status: 'error' };
      }
      
      const lines = pushLogs.split('\n');
      const layers: Record<string, string> = {};
      for (const line of lines) {
        const layerMatch = line.match(/^([a-f0-9]{8,12}):\s+(Preparing|Pushing|Pushed|Layer already exists|Waiting)/i);
        if (layerMatch) {
          const id = layerMatch[1];
          const status = layerMatch[2].toLowerCase();
          layers[id] = status;
        }
      }
      
      const layerIds = Object.keys(layers);
      if (layerIds.length > 0) {
        const completed = layerIds.filter(id => 
          layers[id].includes('pushed') || layers[id].includes('exists')
        ).length;
        const percent = Math.min(Math.round((completed / layerIds.length) * 100), 99);
        return { percent, label: `Pushing: ${completed} of ${layerIds.length} layers`, status: 'running' };
      }
      return { percent: 5, label: 'Connecting to registry...', status: 'running' };
    }
  }, [logs]);

  // Process and color lines based on prefixes
  const renderLogLines = () => {
    if (!logs) {
      return (
        <div className="text-slate-500 italic flex items-center gap-1.5 font-mono text-xs p-2">
          <ChevronRight className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" /> Ready to assemble and build. Click "Build Image" to launch...
        </div>
      );
    }

    const lines = logs.split('\n');
    return lines.map((line, index) => {
      let colorClass = 'text-slate-300';
      
      if (line.includes('❌ ERROR') || line.includes('[ERROR]') || line.startsWith('Error') || line.includes('FAILED')) {
        colorClass = 'text-rose-400 font-semibold';
      } else if (line.includes('🎉 [SUCCESS]') || line.includes('[SUCCESS]') || line.startsWith('Successfully built') || line.includes('Push complete')) {
        colorClass = 'text-emerald-400 font-semibold';
      } else if (line.includes('[INFO]')) {
        colorClass = 'text-blue-300';
      } else if (line.includes('Step ') || line.startsWith(' ---> ')) {
        colorClass = 'text-amber-300 font-medium';
      } else if (line.includes('[BUILD-START]') || line.includes('[PUSH-START]')) {
        colorClass = 'text-indigo-400 font-bold border-b border-indigo-950 pb-1 mb-1 block';
      } else if (line.startsWith('Successfully tagged')) {
        colorClass = 'text-teal-400 font-semibold';
      }

      return (
        <div 
          key={index} 
          className={`font-mono text-xs leading-relaxed whitespace-pre-wrap select-text ${colorClass}`}
        >
          {line}
        </div>
      );
    });
  };

  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
      isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[300px]'
    }`}>
      {/* Console Top bar */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <button 
              type="button"
              id="terminal-dot-red"
              onClick={onClear}
              title="Clear logs"
              className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 shrink-0 cursor-pointer focus:outline-hidden transition-colors"
            />
            <button 
              type="button"
              id="terminal-dot-yellow"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Terminal" : "Collapse Terminal"}
              className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 shrink-0 cursor-pointer focus:outline-hidden transition-colors"
            />
            <button 
              type="button"
              id="terminal-dot-green"
              onClick={onToggleMaximize}
              title={isMaximized ? "Restore Terminal" : "Maximize Terminal"}
              className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 shrink-0 cursor-pointer focus:outline-hidden transition-colors"
            />
          </div>
          <span className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>docker-console@builder</span>
          </div>
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/60 animate-pulse">
              ● RUNNING
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            id="terminal-copy"
            disabled={!logs}
            onClick={handleCopyLogs}
            title="Copy all logs"
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button 
            id="terminal-clear"
            disabled={!logs}
            onClick={onClear}
            title="Clear terminal"
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar Display */}
      {!isCollapsed && progressInfo && (
        <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${
              progressInfo.status === 'success' ? 'bg-emerald-500 animate-pulse' :
              progressInfo.status === 'error' ? 'bg-rose-500' :
              'bg-indigo-500 animate-ping'
            }`} />
            <span className="font-semibold text-slate-300">Pipeline Status:</span>
            <span className="text-indigo-400 font-medium">{progressInfo.label}</span>
          </div>
          <div className="flex-1 max-w-[200px] flex items-center gap-2.5">
            <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  progressInfo.status === 'success' ? 'bg-emerald-500' :
                  progressInfo.status === 'error' ? 'bg-rose-500' :
                  'bg-indigo-500'
                }`}
                style={{ width: `${progressInfo.percent}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-slate-300 min-w-[32px] text-right">
              {progressInfo.percent}%
            </span>
          </div>
        </div>
      )}

      {/* Terminal logs content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 select-text selection:bg-slate-800 custom-scrollbar bg-slate-950">
          {renderLogLines()}
          <div ref={terminalEndRef} />
        </div>
      )}

      {/* Console Bottom bar */}
      {!isCollapsed && (
        <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0">
          <span className="flex items-center gap-1">
            <CornerDownRight className="w-3 h-3" /> Built-in Docker-in-Docker streaming engine
          </span>
          <span>Lines: {logs ? logs.split('\n').length : 0}</span>
        </div>
      )}
    </div>
  );
}
