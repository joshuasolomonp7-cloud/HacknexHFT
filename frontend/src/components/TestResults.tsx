import React from 'react';
import { CheckCircle2, XCircle, Play, Loader2 } from 'lucide-react';

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

export const TestResults: React.FC<TestResultsProps> = ({ testOutput, onRunTestManually, isRunningTest }) => {
  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d] text-sm font-semibold text-gray-300">
        <div className="flex items-center gap-2">
          {testOutput ? (
            testOutput.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )
          ) : (
            <Play className="w-4 h-4 text-blue-400" />
          )}
          <span>Verification Test Suite</span>
        </div>

        <button
          onClick={onRunTestManually}
          disabled={isRunningTest}
          className="flex items-center gap-1 text-xs bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 px-2.5 py-1 rounded transition-colors disabled:opacity-50"
        >
          {isRunningTest ? (
            <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
          ) : (
            <Play className="w-3 h-3 text-emerald-400" />
          )}
          <span>Run Tests</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#0d1117] rounded p-2.5 text-xs font-mono border border-[#30363d]/40">
        {testOutput ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  testOutput.passed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                {testOutput.passed ? 'ALL TESTS PASSED' : 'TESTS FAILED (REGRESSION/BUG)'}
              </span>
            </div>

            {testOutput.stdout && (
              <div>
                <div className="text-gray-400 mb-1 text-[11px]">stdout:</div>
                <pre className="text-gray-300 whitespace-pre-wrap">{testOutput.stdout}</pre>
              </div>
            )}

            {testOutput.stderr && (
              <div>
                <div className="text-red-400 mb-1 text-[11px]">stderr:</div>
                <pre className="text-red-300 whitespace-pre-wrap">{testOutput.stderr}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs">
            Run the test suite to verify codebase integrity.
          </div>
        )}
      </div>
    </div>
  );
};
