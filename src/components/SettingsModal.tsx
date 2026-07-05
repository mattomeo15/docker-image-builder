import React, { useState, useEffect } from 'react';
import { X, Lock, User, Save, RefreshCw, KeyRound, Check, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string, token: string) => Promise<void>;
  currentUsername: string;
  isConfigured: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentUsername,
  isConfigured: initialIsConfigured,
  isDarkMode,
  onToggleDarkMode
}: SettingsModalProps) {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername || '');
      setToken('');
      setSuccess(false);
      setError('');
    }
  }, [isOpen, currentUsername]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !token.trim()) {
      setError('Please provide both username and access token/token password.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave(username.trim(), token.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight text-base">Docker Hub Credentials</h3>
          </div>
          <button 
            id="settings-close"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Credentials updated successfully!
            </div>
          )}

          {/* Preferences Section */}
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Application Preferences</h4>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Dark Mode</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500">Switch application appearance</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {initialIsConfigured && !success && (
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-400 rounded-xl text-xs">
              <span className="font-semibold">Current State:</span> Docker Hub is configured with username <span className="font-mono font-bold text-slate-900 dark:text-slate-200">@{currentUsername}</span>. Entering credentials below will overwrite your current saved credentials.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Docker Hub Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                id="hub-username-input"
                type="text"
                required
                placeholder="e.g. dockerhubusername"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full text-sm pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 focus:border-indigo-500 bg-slate-50/20 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 dark:placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Personal Access Token
              </label>
              <a 
                href="https://hub.docker.com/settings/security" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Create token on Docker Hub
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                id="hub-token-input"
                type="password"
                required
                placeholder="Paste Access Token (dckr_pat_...)"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full text-sm pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 focus:border-indigo-500 bg-slate-50/20 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 dark:placeholder-slate-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
              For security, it is highly recommended to generate and use a **Personal Access Token** instead of your raw account password.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button 
              id="settings-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              id="settings-save-btn"
              type="submit"
              disabled={isSaving || success}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
