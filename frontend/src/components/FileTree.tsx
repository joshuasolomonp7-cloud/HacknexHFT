import React from 'react';
import { Folder, FileCode, CheckCircle2 } from 'lucide-react';

interface FileTreeProps {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, selectedFile, onSelectFile }) => {
  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#30363d] text-sm font-semibold text-gray-300">
        <Folder className="w-4 h-4 text-accent" />
        <span>Repository Files</span>
        <span className="ml-auto text-xs bg-[#21262d] px-2 py-0.5 rounded text-gray-400">
          {files.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 text-sm">
        {files.length === 0 ? (
          <div className="text-xs text-gray-500 py-4 text-center">No repository loaded</div>
        ) : (
          files.map((file) => {
            const isSelected = selectedFile === file;
            return (
              <button
                key={file}
                onClick={() => onSelectFile(file)}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40'
                    : 'text-gray-300 hover:bg-[#21262d] hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{file}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
