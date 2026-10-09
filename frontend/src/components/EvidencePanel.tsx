import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  ArrowRight,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';

export interface ExecutionEvidence {
  command: string;
  passed: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  total_tests?: number;
  failed_tests?: number;
  status?: string;
}

interface EvidencePanelProps {
  beforeEvidence: ExecutionEvidence | null;
  afterEvidence: ExecutionEvidence | null;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ beforeEvidence, afterEvidence }) => {
  if (!beforeEvidence && !afterEvidence) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
        <ShieldCheck className="w-8 h-8 opacity-30 text-emerald-400 mb-2" />
        <span>Execution evidence will appear as the repair pipeline tests before and after code changes.</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 h-full overflow-hidden">
      {/* BEFORE FIX PANEL */}
      <div className="flex flex-col bg-[#161b22] border border-red-500/30 rounded-lg p-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d] text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-red-400">
            <XCircle className="w-4 h-4" />
            <span>BEFORE FIX (Baseline Failure)</span>
          </div>
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            FAILED
          </span>
        </div>

        <div className="flex-1 overflow-auto space-y-2 text-xs font-mono bg-[#0d1117] p-2.5 rounded border border-[#30363d]/40">
          {beforeEvidence ? (
            <>
              <div className="text-[11px] text-gray-400">
                Command: <code className="text-gray-200">{beforeEvidence.command}</code>
              </div>
              {beforeEvidence.stdout && (
                <div>
                  <div className="text-gray-500 text-[10px]">stdout:</div>
                  <pre className="text-gray-300 text-[10px] whitespace-pre-wrap">{beforeEvidence.stdout}</pre>
                </div>
              )}
              {beforeEvidence.stderr && (
                <div>
                  <div className="text-red-400 text-[10px]">Traceback / Failure:</div>
                  <pre className="text-red-300 text-[10px] whitespace-pre-wrap leading-tight">{beforeEvidence.stderr}</pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-[11px]">Executing baseline test suite...</div>
          )}
        </div>
      </div>

      {/* AFTER FIX PANEL */}
      <div className="flex flex-col bg-[#161b22] border border-emerald-500/30 rounded-lg p-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d] text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>AFTER FIX (Verified State)</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            afterEvidence?.passed 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
          }`}>
            {afterEvidence ? (afterEvidence.passed ? 'PASSED (0 REGRESSIONS)' : 'FAILED') : 'PENDING'}
          </span>
        </div>

        <div className="flex-1 overflow-auto space-y-2 text-xs font-mono bg-[#0d1117] p-2.5 rounded border border-[#30363d]/40">
          {afterEvidence ? (
            <>
              <div className="text-[11px] text-gray-400">
                Command: <code className="text-gray-200">{afterEvidence.command}</code>
              </div>
              <div className="text-emerald-400 text-[11px]">
                Total Tests Passed: {afterEvidence.total_tests || 'All assertions valid'}
              </div>
              {afterEvidence.stdout && (
                <div>
                  <div className="text-gray-500 text-[10px]">stdout:</div>
                  <pre className="text-gray-300 text-[10px] whitespace-pre-wrap">{afterEvidence.stdout}</pre>
                </div>
              )}
              {afterEvidence.stderr && (
                <div>
                  <div className="text-gray-400 text-[10px]">stderr:</div>
                  <pre className="text-emerald-300 text-[10px] whitespace-pre-wrap leading-tight">{afterEvidence.stderr}</pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-[11px]">Awaiting patch verification run...</div>
          )}
        </div>
      </div>
    </div>
  );
};
