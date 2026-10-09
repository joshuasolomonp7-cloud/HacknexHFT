import React, { useState } from 'react';
import { Terminal, Play, Loader2, CheckCircle2, XCircle, Trash2, Zap } from 'lucide-react';

interface TerminalViewerProps {
  repoPath: string;
  apiBase: string;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  passed: boolean;
  timestamp: string;
}

export const TerminalViewer: React.FC<TerminalViewerProps> = ({ repoPath, apiBase }) => {
  const [command, setCommand] = useState('pytest');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);

  const QUICK_COMMANDS = [
    'pytest -v',
    'python -m unittest discover tests',
    'npm test',
    'git status',
    'git diff',
    'python -c "print(\'Hello CodeNexus\')"'
  ];

  const handleExecute = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || command).trim();
    if (!cmd || !repoPath || isRunning) return;

    setIsRunning(true);
    try {
      const res = await fetch(`${apiBase}/api/repo/terminal_exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: repoPath,
          command: cmd
        })
      });

      const data = await res.json();
      const newItem: CommandHistoryItem = {
        id: `cmd_${Date.now()}`,
        command: cmd,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exit_code: data.exit_code,
        passed: data.passed,
        timestamp: new Date().toLocaleTimeString()
      };

      setHistory((prev) => [newItem, ...prev]);
    } catch (err: any) {
      const errorItem: CommandHistoryItem = {
        id: `cmd_${Date.now()}`,
        command: cmd,
        stdout: '',
        stderr: String(err),
        exit_code: -1,
        passed: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setHistory((prev) => [errorItem, ...prev]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2 font-semibold text-gray-300">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Interactive Shell Console</span>
          <span className="text-[10px] text-gray-500 font-mono">({repoPath || 'No active workspace'})</span>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setHistory([])}
            className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
            title="Clear output history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Clear</span>
          </button>
        )}
      </div>

      {/* Quick command buttons */}
      <div className="flex items-center gap-1.5 pb-2 overflow-x-auto no-scrollbar">
        <span className="text-gray-500 text-[10px] uppercase font-bold shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Quick:
        </span>
        {QUICK_COMMANDS.map((quick, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCommand(quick);
              handleExecute(quick);
            }}
            disabled={isRunning || !repoPath}
            className="bg-[#0d1117] hover:bg-[#21262d] text-gray-300 hover:text-amber-300 px-2 py-0.5 rounded border border-[#30363d] font-mono text-[10px] shrink-0 transition-colors disabled:opacity-50"
          >
            {quick}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 focus-within:border-amber-500 transition-colors">
          <span className="text-amber-400 font-mono mr-2 font-bold">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExecute();
            }}
            placeholder="Type bash / shell command..."
            className="w-full bg-transparent text-white font-mono placeholder-gray-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => handleExecute()}
          disabled={isRunning || !command.trim() || !repoPath}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-600/20 shrink-0"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Exec</span>
            </>
          )}
        </button>
      </div>

      {/* Output Console */}
      <div className="flex-1 overflow-y-auto space-y-3 bg-[#0d1117] rounded-lg p-3 font-mono border border-[#30363d]/40">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center space-y-1">
            <Terminal className="w-6 h-6 opacity-30 text-amber-400" />
            <p>Interactive terminal ready. Run tests or shell commands inside the workspace.</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="border-b border-[#30363d]/40 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-amber-400">$</span>
                  <span className="text-white">{item.command}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[10px]">{item.timestamp}</span>
                  {item.passed ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Exit 0
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      <XCircle className="w-3 h-3" /> Exit {item.exit_code}
                    </span>
                  )}
                </div>
              </div>

              {item.stdout && (
                <pre className="text-gray-300 text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto pl-3 border-l border-gray-700/50 my-1">
                  {item.stdout}
                </pre>
              )}

              {item.stderr && (
                <pre className="text-red-300 text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto pl-3 border-l border-red-500/50 my-1">
                  {item.stderr}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
