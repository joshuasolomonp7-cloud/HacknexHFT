import React, { useState } from 'react';
import { 
  Folder, 
  FileCode, 
  FilePlus, 
  Trash2, 
  Search, 
  FileText, 
  FileJson, 
  FileSpreadsheet, 
  Layers
} from 'lucide-react';

interface FileTreeProps {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
  onCreateFile?: (fileName: string) => void;
  onDeleteFile?: (fileName: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const filteredFiles = files.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.py')) return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
      return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    }
    if (fileName.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (fileName.endsWith('.md')) return <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    return <FileCode className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim() && onCreateFile) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d] font-semibold text-gray-300">
        <div className="flex items-center gap-1.5">
          <Folder className="w-4 h-4 text-blue-400" />
          <span>Files ({files.length})</span>
        </div>

        {onCreateFile && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-gray-400 hover:text-white p-1 rounded hover:bg-[#21262d] transition-colors"
            title="Create New File"
          >
            <FilePlus className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px]">New</span>
          </button>
        )}
      </div>

      {/* New file input form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="mb-2 space-y-1 bg-[#0d1117] p-2 rounded border border-purple-500/40">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. src/utils.py"
            autoFocus
            className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-gray-400 hover:text-white px-2 py-0.5 rounded text-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newFileName.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      {files.length > 5 && (
        <div className="relative mb-2 flex items-center">
          <Search className="w-3 h-3 text-gray-500 absolute left-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded pl-7 pr-2 py-1 text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono">
        {filteredFiles.length === 0 ? (
          <div className="text-[11px] text-gray-500 py-4 text-center">
            {search ? 'No matching files found' : 'No files in workspace'}
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFile === file;
            return (
              <div
                key={file}
                className={`group flex items-center justify-between rounded px-2 py-1 transition-colors ${
                  isSelected
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40'
                    : 'text-gray-300 hover:bg-[#21262d] hover:text-white'
                }`}
              >
                <button
                  onClick={() => onSelectFile(file)}
                  className="flex-1 text-left flex items-center gap-1.5 truncate"
                >
                  {getFileIcon(file)}
                  <span className="truncate text-[11px]">{file}</span>
                </button>

                {onDeleteFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete '${file}'?`)) {
                        onDeleteFile(file);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-0.5 rounded transition-opacity"
                    title={`Delete ${file}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
