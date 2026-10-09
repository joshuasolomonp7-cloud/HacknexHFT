import React from 'react';
import { CheckCircle2, XCircle, Play, Loader2, Terminal, ShieldAlert, ShieldCheck } from 'lucide-react';

interface TestResultsProps {
  testOutput: {
    passed?: boolean;
    stdout?: string;
    stderr?: string;
    exit_code?: number;
  } | null;
  onRunTestManually: () => void;
  isRunningTest: boolean;
}

// Colorizes standard test log lines for immediate diagnostic clarity
const formatTerminalLog = (logText: string) => {
  return logText.split('\n').map((line, idx) => {
    const isPass = /(passed|PASSED|ok|OK|SUCCESS)/i.test(line) && !/fail/i.test(line);
    const isFail = /(failed|FAILED|FAIL|ERROR|error|AssertionError|Exception)/i.test(line);

    let textColor = 'text-slate-300';
    if (isPass) textColor = 'text-emerald-400 font-medium';
    if (isFail) textColor = 'text-rose-400 font-semibold';

    return (
      <div key={idx} className={`${textColor} leading-relaxed hover:bg-[#161b22]/50 px-1 rounded`}>
        {line || '\u00A0'}
      </div>
    );
  });
};

export const TestResults: React.FC<TestResultsProps> = ({ testOutput, onRunTestManually, isRunningTest }) => {
  return (
    <div className="flex flex-col h-full bg-[#000000] text-[#cccccc] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1a1a1a] bg-[#000000] text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          {testOutput ? (
            testOutput.passed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            )
          ) : (
            <Terminal className="w-3.5 h-3.5 text-white" />
          )}
          <span className="font-medium text-[#cccccc]">Test Runner Console</span>
        </div>

        <button
          onClick={onRunTestManually}
          disabled={isRunningTest}
          className="flex items-center gap-1.5 text-[11px] bg-white hover:bg-neutral-200 text-black px-2.5 py-0.5 rounded transition-colors disabled:opacity-50 font-semibold shadow-sm"
        >
          {isRunningTest ? (
            <Loader2 className="w-3 h-3 animate-spin text-black" />
          ) : (
            <Play className="w-3 h-3 text-black fill-current" />
          )}
          <span>Run Test Suite</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#000000] p-3 text-xs font-terminal space-y-3">
        {testOutput ? (
          <div className="space-y-3">
            {/* Terminal status bar with exit code */}
            <div className="flex items-center justify-between bg-[#080e1a] px-3 py-2 rounded border border-[#1a1a1a] text-[11px]">
              <div className="flex items-center gap-2">
                {testOutput.passed ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                )}
                <span
                  className={`px-2 py-0.5 rounded font-bold font-mono tracking-wide ${
                    testOutput.passed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {testOutput.passed ? 'ALL TESTS PASSED' : 'TESTS FAILED (REGRESSION / BUG)'}
                </span>
              </div>

              {testOutput.exit_code !== undefined && (
                <span className="font-mono text-slate-400 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]/50 text-[10px]">
                  exit code: {testOutput.exit_code}
                </span>
              )}
            </div>

            {/* STDOUT Stream */}
            {testOutput.stdout && (
              <div className="space-y-1">
                <div className="text-slate-400 text-[11px] font-mono font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>stdout (raw shell execution):</span>
                </div>
                <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d]/50 font-terminal text-[11px] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {formatTerminalLog(testOutput.stdout)}
                </div>
              </div>
            )}

            {/* STDERR Stream */}
            {testOutput.stderr && (
              <div className="space-y-1">
                <div className="text-rose-400 text-[11px] font-mono font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>stderr (traceback log):</span>
                </div>
                <pre className="bg-rose-950/20 p-2.5 rounded border border-rose-500/30 font-terminal text-[11px] text-rose-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {testOutput.stderr}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs font-sans space-y-1 select-none">
            <Terminal className="w-5 h-5 text-gray-600 mb-1" />
            <p>Run the test suite to verify codebase integrity.</p>
            <p className="text-[11px] text-gray-600">Subprocess execution output will render here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

