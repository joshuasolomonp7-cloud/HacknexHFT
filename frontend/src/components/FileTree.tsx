import React from 'react';
import { Folder, FileCode } from 'lucide-react';

interface FileTreeProps {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
}

const renderFileIcon = (fileName: string, isSelected: boolean) => {
  const iconColor = isSelected ? "text-white" : "text-[#888888] group-hover:text-white";
  return <FileCode className={`w-3.5 h-3.5 shrink-0 transition-colors ${iconColor}`} />;
};

export const FileTree: React.FC<FileTreeProps> = ({ files, selectedFile, onSelectFile }) => {
  return (
    <div className="flex flex-col h-full bg-[#000000] text-[#cccccc] select-none text-xs">
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="text-[11px] text-[#666666] py-4 text-center">No files found</div>
        ) : (
          files.map((file) => {
            const isSelected = selectedFile === file;
            return (
              <button
                key={file}
                onClick={() => onSelectFile(file)}
                className={`group relative w-full text-left pl-4 pr-2 py-1 flex items-center gap-2 text-[12px] transition-colors ${
                  isSelected
                    ? 'bg-[#0F2B5C] text-white font-medium'
                    : 'text-[#cccccc] hover:bg-[#111111] hover:text-white'
                }`}
              >
                {/* 2px solid neon strip on the absolute left boundary */}
                {isSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#2563EB] shadow-[0_0_8px_#2563EB]" />
                )}
                {renderFileIcon(file, isSelected)}
                <span className="truncate tracking-tight font-sans">{file}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};


