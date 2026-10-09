import React from 'react';
import { 
  GitCompare, 
  FileCode, 
  ShieldAlert, 
  CheckCircle, 
  Plus, 
  Minus,
  Sparkles
} from 'lucide-react';

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  old_line?: number | null;
  new_line?: number | null;
  content: string;
}

export interface DiffData {
  file_path: string;
  structured_lines: DiffLine[];
  lines_added: number;
  lines_removed: number;
  minimality_score: number;
  blast_radius_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface DiffViewerProps {
  diffData: DiffData | null;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffData }) => {
  if (!diffData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs p-6 bg-[#161b22] border border-[#30363d] rounded-lg">
        <GitCompare className="w-8 h-8 opacity-30 text-purple-400 mb-2" />
        <span>No patch generated yet. Run the agent to inspect proposed surgical diffs.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1c2128] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="font-mono font-semibold text-gray-200">{diffData.file_path}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center">
              <Plus className="w-3 h-3" /> {diffData.lines_added}
            </span>
            <span className="text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30 flex items-center">
              <Minus className="w-3 h-3" /> {diffData.lines_removed}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Minimality: {Math.round(diffData.minimality_score * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Line-by-line Diff Table */}
      <div className="flex-1 overflow-auto font-mono text-xs p-1 bg-[#0d1117]">
        <table className="w-full border-collapse">
          <tbody>
            {diffData.structured_lines.map((line, idx) => {
              const isAdd = line.type === 'addition';
              const isDel = line.type === 'deletion';

              return (
                <tr 
                  key={idx}
                  className={`leading-5 ${
                    isAdd 
                      ? 'bg-emerald-950/30 text-emerald-300' 
                      : isDel 
                      ? 'bg-red-950/30 text-red-300 line-through opacity-80' 
                      : 'text-gray-300 hover:bg-[#161b22]'
                  }`}
                >
                  <td className="w-10 text-right pr-2 text-gray-500 select-none border-r border-[#30363d]/40 text-[10px]">
                    {line.old_line || ''}
                  </td>
                  <td className="w-10 text-right pr-2 text-gray-500 select-none border-r border-[#30363d]/40 text-[10px]">
                    {line.new_line || ''}
                  </td>
                  <td className="w-6 text-center select-none font-bold">
                    {isAdd ? '+' : isDel ? '-' : ' '}
                  </td>
                  <td className="pl-2 whitespace-pre font-mono text-[11px]">
                    {line.content}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
