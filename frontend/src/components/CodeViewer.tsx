import React from 'react';
import { Code2 } from 'lucide-react';

interface CodeViewerProps {
  fileName: string | null;
  content: string | null;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ fileName, content }) => {
  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#30363d] text-sm font-semibold text-gray-300">
        <Code2 className="w-4 h-4 text-emerald-400" />
        <span className="truncate">{fileName || 'Code Preview'}</span>
      </div>

      <div className="flex-1 overflow-auto bg-[#0d1117] rounded p-3 text-xs font-mono border border-[#30363d]/40">
        {content ? (
          <pre className="text-gray-300 whitespace-pre leading-relaxed">{content}</pre>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs">
            Select a file from the repository to view its content.
          </div>
        )}
      </div>
    </div>
  );
};
