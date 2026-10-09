import React from 'react';
import { 
  Radar, 
  Layers, 
  FileText, 
  Code, 
  Clock, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export interface InspectionTelemetry {
  level: number;
  level_label: string;
  files_inspected: string[];
  files_count: number;
  lines_inspected: number;
  symbols_inspected: string[];
  symbols_count: number;
  duration_ms: number;
  statement: string;
  slices?: Array<{
    file: string;
    start_line: number;
    end_line: number;
    lines_count: number;
    symbol?: string;
    reason: string;
  }>;
}

export interface BlastRadiusData {
  symbol: string;
  caller_count: number;
  affected_files_count: number;
  affected_files: string[];
  related_tests_count: number;
  related_tests: string[];
  risk_rating: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_color: string;
  recommended_verification: string;
}

interface InspectionScopeViewerProps {
  telemetry: InspectionTelemetry | null;
  blastRadius?: BlastRadiusData | null;
}

export const InspectionScopeViewer: React.FC<InspectionScopeViewerProps> = ({ telemetry, blastRadius }) => {
  if (!telemetry) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
        <Radar className="w-8 h-8 opacity-30 text-blue-400 mb-2" />
        <span>Adaptive inspection telemetry will appear when agent investigates code slices.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3 overflow-y-auto">
      {/* Header with Level Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
          <Radar className="w-4 h-4 text-blue-400" />
          <span>Adaptive Code Inspection</span>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {telemetry.level_label}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]/60">
          <div className="text-gray-400 text-[10px]">Lines Inspected</div>
          <div className="text-base font-bold text-white font-mono">{telemetry.lines_inspected}</div>
        </div>
        <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]/60">
          <div className="text-gray-400 text-[10px]">Files Inspected</div>
          <div className="text-base font-bold text-blue-400 font-mono">{telemetry.files_count}</div>
        </div>
        <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]/60">
          <div className="text-gray-400 text-[10px]">Symbols</div>
          <div className="text-base font-bold text-purple-400 font-mono">{telemetry.symbols_count}</div>
        </div>
      </div>

      {/* Truthful Inspection Principle Statement */}
      <div className="text-[11px] text-gray-400 bg-[#0d1117] p-2 rounded border border-[#30363d]/40 italic leading-relaxed">
        "{telemetry.statement}"
      </div>

      {/* Blast Radius Section */}
      {blastRadius && (
        <div className="bg-[#1c2128] border border-[#30363d] rounded p-2.5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" style={{ color: blastRadius.risk_color }} />
              <span>Change Blast Radius</span>
            </span>
            <span 
              className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border"
              style={{ 
                backgroundColor: `${blastRadius.risk_color}20`, 
                color: blastRadius.risk_color,
                borderColor: `${blastRadius.risk_color}40`
              }}
            >
              Risk: {blastRadius.risk_rating}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-400">
            <div>Direct Callers: <span className="text-gray-200 font-mono">{blastRadius.caller_count}</span></div>
            <div>Affected Files: <span className="text-gray-200 font-mono">{blastRadius.affected_files_count}</span></div>
            <div className="col-span-2">Bound Tests: <span className="text-gray-200 font-mono">{blastRadius.related_tests_count}</span></div>
          </div>
        </div>
      )}

      {/* Slices Tree */}
      {telemetry.slices && telemetry.slices.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Inspected Code Slices
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {telemetry.slices.map((sl, idx) => (
              <div key={idx} className="bg-[#0d1117] p-1.5 rounded border border-[#30363d]/40 text-[11px]">
                <div className="flex items-center justify-between text-gray-300 font-mono text-[10px]">
                  <span>{sl.file}:{sl.start_line}-{sl.end_line}</span>
                  <span className="text-gray-500">({sl.lines_count} lines)</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{sl.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
