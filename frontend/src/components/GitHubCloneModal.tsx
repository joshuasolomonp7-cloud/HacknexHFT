import React, { useState } from 'react';
import { Github, FolderGit2, X, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface GitHubCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoCloned: (repoPath: string, repoName: string) => void;
  apiBase: string;
}

const POPULAR_PRESETS = [
  {
    name: 'Flask Example App',
    url: 'https://github.com/pallets/flask',
    branch: 'main',
    description: 'Python lightweight web framework'
  },
  {
    name: 'Express Starter',
    url: 'https://github.com/expressjs/express',
    branch: 'master',
    description: 'Node.js web application framework'
  },
  {
    name: 'Python Design Patterns',
    url: 'https://github.com/faif/python-patterns',
    branch: 'master',
    description: 'Collection of design patterns and idioms in Python'
  }
];

export const GitHubCloneModal: React.FC<GitHubCloneModalProps> = ({
  isOpen,
  onClose,
  onRepoCloned,
  apiBase
}) => {
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClone = async () => {
    if (!url.trim()) {
      setError('Please provide a valid GitHub or Git repository URL.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiBase}/api/repo/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          branch: branch.trim() || undefined,
          name: customName.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to clone repository.');
      }

      setSuccessMsg(`Successfully cloned repository '${data.name}'!`);
      setTimeout(() => {
        onRepoCloned(data.path, data.name);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error occurred while cloning repository.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: typeof POPULAR_PRESETS[0]) => {
    setUrl(preset.url);
    setBranch(preset.branch);
    setCustomName(preset.name.toLowerCase().replace(/\s+/g, '_'));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Github className="w-4 h-4" />
            </div>
            <span>Clone GitHub / Git Repository</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Repository URL input */}
          <div className="space-y-1.5">
            <label className="text-gray-300 font-medium flex items-center gap-1.5">
              <span>Repository URL</span>
              <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <FolderGit2 className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository.git"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Optional Branch and Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-medium">Branch / Tag (Optional)</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main / master"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-300 font-medium">Workspace Alias (Optional)</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="custom_repo_name"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2 pt-1 border-t border-[#30363d]/60">
            <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Quick Open-Source Repositories:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {POPULAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="flex items-center justify-between p-2 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-left transition-colors group"
                >
                  <div>
                    <div className="font-semibold text-gray-200 group-hover:text-purple-300">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">{preset.url}</div>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-[#161b22] px-2 py-0.5 rounded">Select</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-[#30363d] bg-[#0d1117]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg border border-[#30363d] text-gray-300 hover:text-white hover:bg-[#21262d] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cloning & Indexing...</span>
              </>
            ) : (
              <>
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Clone & Open Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
