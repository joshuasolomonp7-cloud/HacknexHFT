import React from 'react';
import { 
  Bot, 
  Terminal, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Radar,
  ShieldCheck,
  RotateCcw,
  GitCommit,
  Layers,
  Bug
} from 'lucide-react';

export interface TimelineEvent {
  type: string;
  iteration?: number;
  content?: string;
  tool?: string;
  args?: any;
  result?: any;
  message?: string;
  summary?: string;
  telemetry?: any;
  blast_radius?: any;
  patch?: any;
  report?: any;
  bug_id?: string;
  bugs?: any[];
  bug?: any;
  evidence?: any;
}

interface AgentTimelineProps {
  events: TimelineEvent[];
  isRunning: boolean;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ events, isRunning }) => {
  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 overflow-hidden">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#30363d] text-sm font-semibold text-gray-300">
        <Bot className="w-4 h-4 text-purple-400" />
        <span>Agent Execution Stream</span>
        {isRunning && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/30">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Reasoning & Verifying...</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center space-y-2">
            <Sparkles className="w-6 h-6 opacity-40 text-purple-400" />
            <span>Ready. Click "Run Autonomous Repair" to initiate closed-loop diagnosis and verification.</span>
          </div>
        ) : (
          events.map((ev, idx) => {
            if (ev.type === 'thought') {
              return (
                <div key={idx} className="bg-[#1c2128] border-l-2 border-purple-500 rounded-r p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Thought #{ev.iteration || 1}</span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{ev.content}</p>
                </div>
              );
            }

            if (ev.type === 'ast_indexed') {
              return (
                <div key={idx} className="bg-[#0d1117] border border-blue-500/30 rounded p-2 text-xs flex items-center gap-2 text-blue-300 font-mono">
                  <Radar className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>AST Index Complete: {ev.telemetry?.indexed_files} files, {ev.telemetry?.total_symbols} symbols mapped.</span>
                </div>
              );
            }

            if (ev.type === 'snapshot_created') {
              return (
                <div key={idx} className="bg-[#0d1117] border border-emerald-500/30 rounded p-2 text-xs flex items-center gap-2 text-emerald-300 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{ev.message}</span>
                </div>
              );
            }

            if (ev.type === 'tool_call') {
              return (
                <div key={idx} className="bg-[#0d1117] border border-[#30363d] rounded p-2 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Tool Call: <code className="bg-[#21262d] px-1 py-0.5 rounded text-white font-mono">{ev.tool}</code></span>
                  </div>
                  {ev.args && Object.keys(ev.args).length > 0 && (
                    <pre className="text-gray-400 text-[10px] font-mono overflow-x-auto bg-[#161b22] p-1.5 rounded border border-[#30363d]/50">
                      {JSON.stringify(ev.args, null, 2)}
                    </pre>
                  )}
                </div>
              );
            }

            if (ev.type === 'tool_result') {
              return (
                <div key={idx} className="bg-[#0d1117]/60 border border-[#30363d]/50 rounded p-2 text-xs">
                  <div className="flex items-center gap-1 text-emerald-400 font-medium mb-1">
                    <Terminal className="w-3 h-3" />
                    <span>Result ({ev.tool})</span>
                  </div>
                  <pre className="text-gray-400 text-[10px] font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {JSON.stringify(ev.result, null, 2)}
                  </pre>
                </div>
              );
            }

            if (ev.type === 'patch_applied') {
              return (
                <div key={idx} className="bg-purple-950/20 border border-purple-500/40 rounded p-2 text-xs text-purple-200">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <GitCommit className="w-3.5 h-3.5 text-purple-400" />
                    <span>Surgical Patch Applied ({ev.bug_id || 'Active Bug'})</span>
                  </div>
                  <div className="text-[11px] text-gray-300 font-mono">
                    {ev.patch?.message || 'Code replacement committed to workspace.'}
                  </div>
                </div>
              );
            }

            if (ev.type === 'rollback_completed') {
              return (
                <div key={idx} className="bg-amber-950/30 border border-amber-500/40 rounded p-2 text-xs text-amber-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ev.message}</span>
                  </div>
                </div>
              );
            }

            if (ev.type === 'final_report') {
              return (
                <div key={idx} className="bg-[#0d1117] border border-emerald-500/40 rounded p-3 text-xs space-y-2 text-gray-200">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified Final Repair Report</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
                    <div>Session ID: <span className="text-purple-400">{ev.report?.session_id}</span></div>
                    <div>Bugs Verified: <span className="text-emerald-400">{ev.report?.bugs_verified} / {ev.report?.total_bugs_detected}</span></div>
                    <div>Regression Suite: <span className="text-emerald-400">{ev.report?.regression_status}</span></div>
                    <div>Rollbacks: <span className="text-gray-400">{ev.report?.rollbacks_performed}</span></div>
                  </div>
                </div>
              );
            }

            if (ev.type === 'complete') {
              return (
                <div key={idx} className="bg-emerald-950/30 border border-emerald-500/40 rounded p-3 text-xs space-y-1 text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Verification Success</span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{ev.summary}</p>
                </div>
              );
            }

            if (ev.type === 'error') {
              return (
                <div key={idx} className="bg-red-950/30 border border-red-500/40 rounded p-3 text-xs space-y-1 text-red-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Execution Error</span>
                  </div>
                  <p className="text-gray-300">{ev.message}</p>
                </div>
              );
            }

            return (
              <div key={idx} className="text-gray-400 text-[11px] italic bg-[#0d1117]/40 px-2 py-1 rounded">
                {ev.message || JSON.stringify(ev)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
