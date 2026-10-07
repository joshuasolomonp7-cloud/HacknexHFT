import React, { useEffect, useRef } from 'react';
import { 
  Bot, 
  Terminal, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export interface TimelineEvent {
  type: 'status' | 'thought' | 'tool_call' | 'tool_result' | 'complete' | 'error';
  iteration?: number;
  content?: string;
  tool?: string;
  args?: any;
  result?: any;
  message?: string;
  summary?: string;
}

interface AgentTimelineProps {
  events: TimelineEvent[];
  isRunning: boolean;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ events, isRunning }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  // Smooth autoscroll anchored to bottom without page jumping
  useEffect(() => {
    if (isRunning && bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [events, isRunning]);

  return (
    <div className="relative flex flex-col h-full bg-[#000000] text-[#cccccc] overflow-hidden">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#161616] text-xs font-medium text-[#cccccc] shrink-0 px-1">
        <Bot className="w-3.5 h-3.5 text-white" />
        <span>Execution Stream</span>
        {isRunning && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-white bg-[#141414] px-2 py-0.5 rounded-full border border-[#262626]">
            <Loader2 className="w-3 h-3 animate-spin text-white" />
            <span>Reasoning...</span>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overscroll-contain space-y-2.5 pr-1.5 scroll-smooth font-sans text-xs"
      >
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 select-none">
            <div className="space-y-1 max-w-xs">
              <h3 className="text-xs font-semibold text-white tracking-wide">
                Agent Ready to Inspect Codebase
              </h3>
              <p className="text-[11px] text-[#777777] leading-relaxed">
                Re-Act reasoning loop standing by to localize bugs, generate surgical diffs, and self-heal test regressions.
              </p>
            </div>

            {/* Directional visual anchors - Minimal Monochrome */}
            <div className="pt-2 flex flex-col items-center gap-1.5 text-[11px]">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0a0a0a] border border-[#1f1f1f] text-[#888888]">
                <span>Select a <strong className="text-white font-medium">Demo Benchmark</strong></span>
                <ArrowUpRight className="w-3 h-3 text-[#aaaaaa]" />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#666666]">
                <span>or trigger</span>
                <span className="px-1.5 py-0.2 rounded bg-[#141414] border border-[#222222] text-white font-medium flex items-center gap-1">
                  Run SWE Agent <ArrowDownLeft className="w-2.5 h-2.5 text-[#aaaaaa]" />
                </span>
                <span>in panel</span>
              </div>
            </div>
          </div>
        ) : (
          events.map((ev, idx) => {
            if (ev.type === 'thought') {
              return (
                <div key={idx} className="bg-[#0a0a0a] border-l-2 border-[#555555] border-y border-r border-[#161616] rounded-r p-2.5 text-[11px] space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span>Thought #{ev.iteration}</span>
                  </div>
                  <p className="text-[#cccccc] whitespace-pre-wrap leading-relaxed font-sans">{ev.content}</p>
                </div>
              );
            }

            if (ev.type === 'tool_call') {
              return (
                <div key={idx} className="bg-[#080808] border border-[#161616] rounded p-2 text-[11px] space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <Wrench className="w-3 h-3 text-[#aaaaaa]" />
                    <span>Tool: <code className="bg-[#141414] px-1 py-0.2 rounded text-white font-mono text-[10px] border border-[#262626]">{ev.tool}</code></span>
                  </div>
                  <pre className="font-terminal text-[#aaaaaa] text-[10px] overflow-x-auto bg-[#000000] p-1.5 rounded border border-[#141414] leading-relaxed">
                    {JSON.stringify(ev.args, null, 2)}
                  </pre>
                </div>
              );
            }

            if (ev.type === 'tool_result') {
              return (
                <div key={idx} className="bg-[#05080e] border border-[#1a1a1a] rounded p-2.5 text-xs shadow-sm">
                  <div className="flex items-center gap-1 text-emerald-400 font-medium mb-1">
                    <Terminal className="w-3 h-3" />
                    <span>Result ({ev.tool})</span>
                  </div>
                  <pre className="font-terminal text-gray-300 text-[11px] overflow-x-auto max-h-44 overflow-y-auto leading-relaxed bg-[#000000] p-1.5 rounded border border-[#1a1a1a]">
                    {JSON.stringify(ev.result, null, 2)}
                  </pre>
                </div>
              );
            }

            if (ev.type === 'complete') {
              return (
                <div key={idx} className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-3.5 text-xs space-y-1.5 text-emerald-200 shadow-md">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Task Completed & Verified!</span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{ev.summary}</p>
                </div>
              );
            }

            if (ev.type === 'error') {
              return (
                <div key={idx} className="bg-red-950/40 border border-red-500/50 rounded-lg p-3.5 text-xs space-y-1.5 text-red-200 shadow-md">
                  <div className="flex items-center gap-1.5 font-bold text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Execution Error</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed">{ev.message}</p>
                </div>
              );
            }

            return (
              <div key={idx} className="text-gray-400 text-xs italic px-1">
                {ev.message}
              </div>
            );
          })
        )}
        <div ref={bottomAnchorRef} />
      </div>
    </div>
  );
};

