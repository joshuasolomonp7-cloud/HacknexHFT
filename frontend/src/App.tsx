import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  FolderGit2, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Key, 
  Zap,
  ShieldCheck,
  Code2,
  FileCode2,
  RotateCcw,
  Film,
  Network,
  Activity,
  Layers
} from 'lucide-react';
import { FileTree } from './components/FileTree';
import { AgentTimeline, TimelineEvent } from './components/AgentTimeline';
import { CodeViewer } from './components/CodeViewer';
import { TestResults } from './components/TestResults';

const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

const PRESETS = [
  {
    label: 'Python MathUtils (Fibonacci Bug)',
    repoName: 'math_utils',
    prompt: 'The fibonacci function in calculator.py has a bug where fibonacci(1) returns 0 instead of 1, causing unit tests to fail. Fix the bug, keep all other arithmetic working, and make sure all tests pass.'
  },
  {
    label: 'E-Commerce Multi-File (Order & Pricing API)',
    repoName: 'ecommerce_order_api',
    prompt: 'VIP orders in test_orders.py are failing with 0.0 != 40.0 discount. Use AST symbol analysis to trace calculate_discount across models.py, pricing_service.py, and order_controller.py. Fix the cross-file dependency bug without breaking existing order rules.'
  },
  {
    label: 'JavaScript StringUtils (Slugify Bug)',
    repoName: 'js_string_utils',
    prompt: 'The slugify function in index.js currently replaces spaces with underscores and misses lowercasing. Update slugify to lowercase the input and replace spaces with hyphens (-) so that all tests in test/index.test.js pass with zero regressions.'
  },
  {
    label: '🔥 HACKNEX Bug Stress 1000',
    repoName: 'bug_stress_1000',
    prompt: 'In bug_stress_1000, users.py::register fails with "Invalid user details" because valid_email() in utils.py has an escaped regex dot bug, and deposit/withdraw have inverted balance operations. Localize and fix the defects in utils.py and users.py to pass registration and balance test suites.'
  }
];

export function App() {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  
  const [taskPrompt, setTaskPrompt] = useState<string>(PRESETS[0].prompt);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [modelName, setModelName] = useState<string>('gemini-2.5-flash');
  const [isSupervised, setIsSupervised] = useState<boolean>(false);
  const [forceDemo, setForceDemo] = useState<boolean>(false);
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  
  // AST & Blast Radius View
  const [astSymbols, setAstSymbols] = useState<any>(null);
  const [showAstView, setShowAstView] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('GEMINI_API_KEY', val);
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/repos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.repos && data.repos.length > 0) {
          setRepos(data.repos);
          setSelectedRepo(data.repos[0].path);
          setFiles(data.repos[0].files || []);
          if (data.repos[0].files && data.repos[0].files.length > 0) {
            loadFileContent(data.repos[0].path, data.repos[0].files[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load repos:', err));
  }, []);

  const loadFileContent = (repoPath: string, file: string) => {
    setSelectedFile(file);
    fetch(`${API_BASE}/api/repo/file_content?path=${encodeURIComponent(repoPath)}&file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) {
          setFileContent(data.content);
        } else {
          setFileContent(data.error || 'Error reading file.');
        }
      })
      .catch((err) => setFileContent(`Failed to fetch file content: ${err}`));
  };

  const loadAstSymbols = (repoPath: string) => {
    fetch(`${API_BASE}/api/repo/ast_symbols?path=${encodeURIComponent(repoPath)}`)
      .then((res) => res.json())
      .then((data) => setAstSymbols(data))
      .catch((err) => console.error('Failed to load AST symbols:', err));
  };

  const handleSelectRepo = (repoPath: string) => {
    setSelectedRepo(repoPath);
    loadAstSymbols(repoPath);
    fetch(`${API_BASE}/api/repo/files?path=${encodeURIComponent(repoPath)}`)
      .then((res) => res.json())
      .then((data) => {
        setFiles(data.files || []);
        if (data.files && data.files.length > 0) {
          loadFileContent(repoPath, data.files[0]);
        } else {
          setSelectedFile(null);
          setFileContent(null);
        }
      });
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const targetRepo = repos.find((r) => r.name === preset.repoName);
    if (targetRepo) {
      handleSelectRepo(targetRepo.path);
    }
    setTaskPrompt(preset.prompt);
  };

  const runTestManually = () => {
    if (!selectedRepo) return;
    setIsRunningTest(true);
    fetch(`${API_BASE}/api/repo/run_test?path=${encodeURIComponent(selectedRepo)}`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        setTestOutput(data);
        setIsRunningTest(false);
      })
      .catch((err) => {
        setTestOutput({ passed: false, stderr: String(err) });
        setIsRunningTest(false);
      });
  };

  // Real Repository Reset
  const handleResetRepo = () => {
    if (!selectedRepo) return;
    fetch(`${API_BASE}/api/repo/reset?path=${encodeURIComponent(selectedRepo)}`, { method: 'POST' })
      .then((res) => res.json())
      .then(() => {
        if (selectedFile) loadFileContent(selectedRepo, selectedFile);
        runTestManually();
      })
      .catch((err) => console.error('Failed to reset repo:', err));
  };

  const handleStartAgent = () => {
    if (!selectedRepo || isRunning) return;
    setIsRunning(true);
    setEvents([]);

    const ws = new WebSocket(`${WS_BASE}/ws/agent`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          repo_path: selectedRepo,
          task_prompt: taskPrompt,
          api_key: apiKey || undefined,
          model_name: modelName,
          demo_mode: forceDemo
        })
      );
    };

    ws.onmessage = (event) => {
      const parsed: TimelineEvent = JSON.parse(event.data);
      setEvents((prev) => [...prev, parsed]);

      if (parsed.type === 'tool_result' && parsed.tool === 'edit_file_replace') {
        if (selectedFile) {
          loadFileContent(selectedRepo, selectedFile);
        }
      }

      if (parsed.type === 'tool_result' && parsed.tool === 'run_tests') {
        setTestOutput(parsed.result);
      }

      if (parsed.type === 'complete' || parsed.type === 'error') {
        setIsRunning(false);
        runTestManually();
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setEvents((prev) => [...prev, { type: 'error', message: 'WebSocket connection failed.' }]);
      setIsRunning(false);
    };

    ws.onclose = () => {
      setIsRunning(false);
    };
  };

  const handleStopAgent = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-gray-200 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-2 rounded-lg text-white shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
              CodeNexus AI <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">HACKNEX 2026</span>
            </h1>
            <p className="text-[11px] text-gray-400">Autonomous Software Engineering & Verification Workbench</p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3">
          {/* Target Repo */}
          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1 rounded border border-[#30363d] text-xs">
            <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedRepo}
              onChange={(e) => handleSelectRepo(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              {repos.map((r) => (
                <option key={r.path} value={r.path} className="bg-[#161b22]">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1 rounded border border-[#30363d] text-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              <option value="gemini-2.5-flash" className="bg-[#161b22]">Gemini 2.5 Flash</option>
              <option value="gemini-3.1-pro-preview" className="bg-[#161b22]">Gemini 3.1 Pro Preview</option>
              <option value="gemini-1.5-flash" className="bg-[#161b22]">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro" className="bg-[#161b22]">Gemini 1.5 Pro</option>
            </select>
          </div>

          {/* API Key */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] px-3 py-1 rounded border border-[#30363d] text-xs">
            <Key className="w-3.5 h-3.5 text-yellow-400" />
            <input
              type="password"
              placeholder="Gemini Key (Auto-saved)"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="bg-transparent text-gray-200 outline-none w-44 text-[11px]"
            />
          </div>
        </div>
      </header>

      {/* Demo Preset Bar */}
      <div className="flex items-center gap-3 px-6 py-2 bg-[#0d1117] border-b border-[#30363d] text-xs">
        <span className="text-gray-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Benchmarks:
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(p)}
            className="bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-white px-2.5 py-1 rounded border border-[#30363d] transition-colors flex items-center gap-1.5"
          >
            <FileCode2 className="w-3 h-3 text-accent" />
            <span>{p.label}</span>
          </button>
        ))}

        <button
          onClick={handleResetRepo}
          title="Reset the current repo to its initial buggy state"
          className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-600/40 px-2 py-1 rounded flex items-center gap-1 text-[11px] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Bug</span>
        </button>

        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={() => setShowAstView(!showAstView)}
            className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
              showAstView ? 'bg-purple-900/40 text-purple-300 border-purple-500' : 'bg-[#161b22] text-gray-300 border-[#30363d]'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span>AST Code Intelligence</span>
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 select-none">
            <input
              type="checkbox"
              checked={forceDemo}
              onChange={(e) => setForceDemo(e.target.checked)}
              className="rounded bg-[#0d1117] border-[#30363d] text-blue-600 focus:ring-0 cursor-pointer"
            />
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-medium text-blue-300">Offline Benchmark Mode</span>
          </label>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Repository Tree & Task Definition */}
        <div className="col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          <div className="h-2/5">
            <FileTree 
              files={files} 
              selectedFile={selectedFile} 
              onSelectFile={(f) => loadFileContent(selectedRepo, f)} 
            />
          </div>

          <div className="h-3/5 bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[#30363d] text-xs font-semibold text-gray-300">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Issue / Feature Specification</span>
            </div>

            <textarea
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Describe the bug or feature to implement..."
              className="flex-1 w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-xs text-gray-200 outline-none focus:border-blue-500 resize-none font-mono"
            />

            <div className="mt-3 flex gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStartAgent}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white py-2 px-3 rounded text-xs font-semibold shadow transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{forceDemo || !apiKey ? 'Run Autonomous Demo' : 'Run Live AI Agent'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStopAgent}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-xs font-semibold shadow transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Agent</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center Column: Live Agent Re-Act Stream */}
        <div className="col-span-5 h-full overflow-hidden">
          <AgentTimeline events={events} isRunning={isRunning} />
        </div>

        {/* Right Column: Code Viewer / AST Explorer & Test Suite */}
        <div className="col-span-4 flex flex-col gap-3 h-full overflow-hidden">
          <div className="h-3/5">
            {showAstView ? (
              <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d] text-xs font-semibold text-purple-400">
                  <div className="flex items-center gap-1.5">
                    <Network className="w-4 h-4" />
                    <span>AST Symbol & Blast Radius Index</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {astSymbols ? `${astSymbols.symbol_count} Symbols | ${astSymbols.call_count} Calls` : 'Loading...'}
                  </span>
                </div>
                <div className="flex-1 overflow-auto bg-[#0d1117] rounded p-2 text-xs font-mono space-y-2">
                  {astSymbols && astSymbols.symbols ? (
                    astSymbols.symbols.map((sym: any, idx: number) => (
                      <div key={idx} className="bg-[#161b22] p-2 rounded border border-[#30363d]/60 space-y-1">
                        <div className="flex items-center justify-between text-blue-400 font-bold">
                          <span>{sym.type === 'class' ? '🏛️ Class' : '⚡ Function'}: {sym.full_name || sym.name}()</span>
                          <span className="text-[10px] text-gray-500">{sym.file}:{sym.line_start}</span>
                        </div>
                        {sym.docstring && <div className="text-gray-400 text-[11px] italic">{sym.docstring}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center py-6">Select a Python repo to view AST symbols</div>
                  )}
                </div>
              </div>
            ) : (
              <CodeViewer fileName={selectedFile} content={fileContent} />
            )}
          </div>

          <div className="h-2/5">
            <TestResults 
              testOutput={testOutput} 
              onRunTestManually={runTestManually} 
              isRunningTest={isRunningTest} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
