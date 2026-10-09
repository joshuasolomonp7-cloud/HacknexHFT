import React, { useState } from 'react';
import { 
  BarChart3, 
  Dna, 
  X, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose, apiBase }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [mutationData, setMutationData] = useState<any>(null);

  if (!isOpen) return null;

  const runBenchmarks = () => {
    setLoading(true);
    fetch(`${apiBase}/api/repo/benchmark/run`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        setBenchmarkData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Benchmark failed:', err);
        setLoading(false);
      });
  };

  const runMutation = () => {
    setLoading(true);
    fetch(`${apiBase}/api/repo/mutation/run?path=sample_repos/math_utils&file=calculator.py`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        setMutationData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Mutation test failed:', err);
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-2xl p-5 shadow-2xl flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 text-purple-400 p-2 rounded-lg border border-purple-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Evaluation & Mutation Dashboard</h3>
              <p className="text-[11px] text-gray-400">Run verifiable benchmarks across all repository test suites.</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#21262d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={runBenchmarks}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-gray-200 p-3 rounded-lg border border-[#30363d] text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Play className="w-4 h-4 text-purple-400" />}
            <span>Evaluate All Repositories</span>
          </button>

          <button
            onClick={runMutation}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-gray-200 p-3 rounded-lg border border-[#30363d] text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Dna className="w-4 h-4 text-emerald-400" />}
            <span>Run Synthetic Mutation Test</span>
          </button>
        </div>

        {/* Benchmark Results */}
        {benchmarkData && (
          <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d] space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-gray-300">
              <span>Benchmark Pass Rate</span>
              <span className="text-emerald-400 font-mono">
                {benchmarkData.passing_benchmarks} / {benchmarkData.total_benchmarks} Repos Passing
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {benchmarkData.benchmark_results.map((r: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 bg-[#161b22] rounded border border-[#30363d]/40">
                  <span className="font-mono text-gray-300">{r.repo_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-mono">{r.duration_ms}ms</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mutation Results */}
        {mutationData && (
          <div className="bg-[#0d1117] p-3 rounded-lg border border-emerald-500/30 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Mutation Testing Result</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Injected Mutation: <code className="text-amber-300">{mutationData.mutation_applied}</code>
            </p>
            <div className="text-[11px] text-emerald-400 font-semibold">
              {mutationData.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
