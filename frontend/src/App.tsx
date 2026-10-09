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
  Files,
  Search,
  GitBranch,
  PlayCircle,
  Blocks,
  Settings,
  User,
  Terminal,
  ChevronRight,
  ChevronDown,
  SplitSquareHorizontal,
  MoreHorizontal,
  RotateCcw,
  X,
  Plus,
  PanelBottomClose,
  PanelLeftClose,
  Bell,
  Network,
  Film,
  Github,
  UploadCloud,
  Check,
  Copy,
  Layers,
  Activity,
  GitCompare
} from 'lucide-react';
import { FileTree } from './components/FileTree';
import { AgentTimeline, TimelineEvent } from './components/AgentTimeline';
import { CodeViewer } from './components/CodeViewer';
import { TestResults } from './components/TestResults';
import { DiffViewer, DiffData } from './components/DiffViewer';
import { InspectionScopeViewer, InspectionTelemetry } from './components/InspectionScopeViewer';
import { GitHubCloneModal } from './components/GitHubCloneModal';
import { UploadWorkspaceModal } from './components/UploadWorkspaceModal';

const API_BASE = 'http://localhost:8090';
const WS_BASE = 'ws://localhost:8090';

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
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<'code' | 'diff'>('code');
  
  const [taskPrompt, setTaskPrompt] = useState<string>(PRESETS[0].prompt);
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('GEMINI_API_KEY') || '';
    } catch {
      return '';
    }
  });
  const [modelName, setModelName] = useState<string>('gemini-3.1-pro-preview');
  const [isSupervised, setIsSupervised] = useState<boolean>(false);
  const [forceDemo, setForceDemo] = useState<boolean>(false);
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [activeDiff, setActiveDiff] = useState<DiffData | null>(null);
  const [inspectionScope, setInspectionScope] = useState<InspectionTelemetry | null>(null);

  // AST Symbol & Blast Radius View
  const [astSymbols, setAstSymbols] = useState<any>(null);

  // IDE layout states
  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'search' | 'git' | 'ast' | 'debug'>('files');
  const [bottomPanelTab, setBottomPanelTab] = useState<'TESTS' | 'TERMINAL' | 'AST_SCOPE'>('TESTS');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);

  // Modals
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Save API key to localStorage
  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem('GEMINI_API_KEY', key);
    } catch (e) {
      console.error(e);
    }
  };

  // Load repositories on startup
  const fetchRepos = async (preferRepo?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/repos`);
      const data = await res.json();
      const list = data.repos || data.workspaces || [];
      setRepos(list);
      if (list.length > 0) {
        const target = preferRepo && list.some((r: any) => r.name === preferRepo || r.path === preferRepo)
          ? preferRepo
          : list[0].name || list[0].path;
        setSelectedRepo(target);
      }
    } catch (err) {
      console.error('Failed to load repos:', err);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  // When selected repo changes, load its file list
  useEffect(() => {
    if (!selectedRepo) return;
    const loadRepoFiles = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/repo/files?repo_name=${encodeURIComponent(selectedRepo)}`);
        const data = await res.json();
        setFiles(data.files || []);
        if (data.files && data.files.length > 0) {
          const firstCodeFile = data.files.find((f: string) => 
            !f.startsWith('test') && !f.includes('/test') && (f.endsWith('.py') || f.endsWith('.js') || f.endsWith('.ts'))
          ) || data.files[0];
          setSelectedFile(firstCodeFile);
          setOpenTabs([firstCodeFile]);
        } else {
          setSelectedFile(null);
          setOpenTabs([]);
          setFileContent(null);
        }
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    };
    loadRepoFiles();
  }, [selectedRepo]);

  // When selected file changes, load its content & AST symbols
  useEffect(() => {
    if (!selectedRepo || !selectedFile) {
      setFileContent(null);
      setAstSymbols(null);
      return;
    }
    const loadContent = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/file?repo_name=${encodeURIComponent(selectedRepo)}&file_path=${encodeURIComponent(selectedFile)}`
        );
        const data = await res.json();
        setFileContent(data.content || '');
      } catch (err) {
        console.error('Failed to load file content:', err);
      }
    };

    const loadAst = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/ast/symbols?repo_name=${encodeURIComponent(selectedRepo)}&file_path=${encodeURIComponent(selectedFile)}`
        );
        const data = await res.json();
        setAstSymbols(data);
      } catch (err) {
        console.error('Failed to load AST symbols:', err);
      }
    };

    loadContent();
    loadAst();
  }, [selectedRepo, selectedFile]);

  // WebSocket lifecycle for real-time agent execution stream
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('CodeNexus Agent WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status' && data.message === 'Agent loop completed.') {
          setIsRunning(false);
        }
        if (data.type === 'complete' || data.type === 'error') {
          setIsRunning(false);
        }
        if (data.type === 'diff' || data.diff) {
          setActiveDiff(data.diff || data);
          setEditorMode('diff');
        }
        if (data.type === 'inspection_scope' || data.scope) {
          setInspectionScope(data.scope || data);
        }
        setEvents((prev) => [...prev, data]);
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onclose = () => {
      console.log('CodeNexus Agent WebSocket Disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleStartAgent = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setEvents([]);
    setBottomPanelTab('TERMINAL');

    try {
      const res = await fetch(`${API_BASE}/api/agent/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskPrompt,
          repo_name: selectedRepo,
          api_key: apiKey || undefined,
          model_name: modelName,
          is_supervised: isSupervised,
          force_demo: forceDemo
        })
      });
      const data = await res.json();
      if (!data.success) {
        setEvents((prev) => [
          ...prev,
          { type: 'error', message: data.message || 'Failed to start agent.' }
        ]);
        setIsRunning(false);
      }
    } catch (err: any) {
      setEvents((prev) => [
        ...prev,
        { type: 'error', message: err.message || 'Network error starting agent.' }
      ]);
      setIsRunning(false);
    }
  };

  const handleStopAgent = async () => {
    try {
      await fetch(`${API_BASE}/api/agent/stop`, { method: 'POST' });
      setIsRunning(false);
      setEvents((prev) => [
        ...prev,
        { type: 'status', message: '🛑 SWE Agent execution aborted by user.' }
      ]);
    } catch (err) {
      console.error('Failed to stop agent:', err);
    }
  };

  const handleRunTests = async () => {
    if (!selectedRepo || isRunningTest) return;
    setIsRunningTest(true);
    setBottomPanelTab('TESTS');
    try {
      const res = await fetch(`${API_BASE}/api/test/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: selectedRepo })
      });
      const data = await res.json();
      setTestOutput(data);
    } catch (err) {
      console.error('Failed to execute test suite:', err);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setSelectedRepo(preset.repoName);
    setTaskPrompt(preset.prompt);
    setEvents([]);
    setTestOutput(null);
    setActiveDiff(null);
    setEditorMode('code');
  };

  const handleTabClick = (file: string) => {
    setSelectedFile(file);
    setEditorMode('code');
    if (!openTabs.includes(file)) {
      setOpenTabs([...openTabs, file]);
    }
  };

  const handleTabClose = (e: React.MouseEvent, file: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== file);
    setOpenTabs(newTabs);
    if (selectedFile === file) {
      setSelectedFile(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const fileNameOnly = selectedFile ? selectedFile.split('/').pop() || selectedFile : '';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-[#cccccc] font-sans antialiased overflow-hidden select-none">
      
      {/* 1. TOP GLOBAL APPLICATION & MODEL BAR (Pure Black Theme) */}
      <header className="h-10 bg-[#000000] border-b border-[#161616] flex items-center justify-between px-3 text-xs shrink-0 select-none z-30">
        {/* Left: Branding & Workspace Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-sm">
            <div className="p-1 bg-white text-black rounded flex items-center justify-center font-mono">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-sm tracking-wide">CodeNexus</span>
            <span className="text-[10px] text-[#666666] font-normal hidden sm:inline px-1 border border-[#222222] rounded bg-[#0a0a0a]">IDE</span>
          </div>

          <div className="h-4 w-[1px] bg-[#222222]" />

          {/* Workspace Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#141414] border border-[#222222] px-2 py-1 rounded transition-colors">
            <FolderGit2 className="w-3.5 h-3.5 text-[#888888]" />
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-transparent text-[11px] text-[#e0e0e0] outline-none cursor-pointer font-medium"
            >
              {repos.map((r: any) => (
                <option key={r.name || r.path} value={r.name || r.path} className="bg-[#111111] text-white">
                  {r.name || r.path}
                </option>
              ))}
            </select>
          </div>

          {/* Clone Git Button */}
          <button
            onClick={() => setIsCloneModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#161616] text-[#cccccc] hover:text-white border border-[#222222] px-2 py-1 rounded text-[11px] font-medium transition-colors"
            title="Clone external Git repository"
          >
            <Github className="w-3.5 h-3.5 text-purple-400" />
            <span>Clone Git</span>
          </button>

          {/* Upload Codebase Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#161616] text-[#cccccc] hover:text-white border border-[#222222] px-2 py-1 rounded text-[11px] font-medium transition-colors"
            title="Upload ZIP or local project folder"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Upload Codebase</span>
          </button>
        </div>

        {/* Center: Quick Benchmark Presets Selector */}
        <div className="hidden xl:flex items-center gap-1.5 bg-[#0a0a0a] p-0.5 rounded border border-[#1a1a1a]">
          {PRESETS.map((p) => (
            <button
              key={p.repoName}
              onClick={() => handlePresetSelect(p)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all truncate max-w-[150px] ${
                selectedRepo === p.repoName
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#777777] hover:text-[#cccccc] hover:bg-[#141414]'
              }`}
            >
              {p.label.split(' ')[1] || p.label}
            </button>
          ))}
        </div>

        {/* Right: Model Selector & API Key */}
        <div className="flex items-center gap-2">
          {/* AI Model Badge */}
          <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#222222] px-2 py-1 rounded">
            <Cpu className="w-3.5 h-3.5 text-[#888888]" />
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="bg-transparent text-[11px] text-[#e0e0e0] outline-none cursor-pointer font-medium"
            >
              <option value="gemini-3.1-pro-preview" className="bg-[#111111] text-white">Gemini 3.1 Pro (Recommended)</option>
              <option value="gemini-3.8-flash" className="bg-[#111111] text-white">Gemini 3.8 Flash</option>
              <option value="gemini-2.5-flash" className="bg-[#111111] text-white">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro" className="bg-[#111111] text-white">Gemini 2.5 Pro</option>
            </select>
          </div>

          {/* API Key Input */}
          <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#222222] px-2 py-1 rounded max-w-[130px] sm:max-w-[160px]">
            <Key className="w-3 h-3 text-[#777777] shrink-0" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Gemini API Key..."
              className="bg-transparent text-[11px] text-white placeholder-[#555555] outline-none w-full font-mono"
            />
          </div>

          {/* Toggle Panels */}
          <div className="flex items-center gap-1 border-l border-[#222222] pl-2">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-1.5 rounded transition-colors ${
                isChatOpen ? 'bg-[#222222] text-white' : 'text-[#666666] hover:text-[#cccccc]'
              }`}
              title="Toggle AI Agent Stream"
            >
              <Bot className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Activity Bar (Cursor Minimal Left Navigation) */}
        <nav className="w-10 bg-[#000000] border-r border-[#161616] flex flex-col items-center py-2 text-[#777777] shrink-0 z-20">
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              onClick={() => {
                setActiveSidebarTab('files');
                setIsSidebarOpen(true);
              }}
              className={`p-2 rounded hover:text-white transition-colors relative ${
                isSidebarOpen && activeSidebarTab === 'files' ? 'text-white bg-[#141414]' : ''
              }`}
              title="Explorer (Files)"
            >
              <Files className="w-4 h-4" />
              {isSidebarOpen && activeSidebarTab === 'files' && (
                <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-white rounded-r" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('ast');
                setIsSidebarOpen(true);
              }}
              className={`p-2 rounded hover:text-white transition-colors relative ${
                isSidebarOpen && activeSidebarTab === 'ast' ? 'text-white bg-[#141414]' : ''
              }`}
              title="AST Symbols & Outline"
            >
              <Network className="w-4 h-4 text-purple-400" />
              {isSidebarOpen && activeSidebarTab === 'ast' && (
                <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-white rounded-r" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('git');
                setIsSidebarOpen(true);
              }}
              className={`p-2 rounded hover:text-white transition-colors relative ${
                isSidebarOpen && activeSidebarTab === 'git' ? 'text-white bg-[#141414]' : ''
              }`}
              title="Source Control (Git Transaction Rollback)"
            >
              <GitBranch className="w-4 h-4" />
              {isSidebarOpen && activeSidebarTab === 'git' && (
                <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-white rounded-r" />
              )}
            </button>
          </div>

          <div className="mt-auto flex flex-col items-center gap-3">
            <button className="p-2 text-[#555555] hover:text-white" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Primary Sidebar (Explorer / AST Outline / Git) */}
        {isSidebarOpen && (
          <aside className="w-60 bg-[#000000] border-r border-[#161616] flex flex-col shrink-0 select-none z-10">
            {/* Sidebar Title Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#161616] text-[11px] font-semibold text-[#888888] tracking-wider uppercase">
              <span>{activeSidebarTab === 'files' ? 'EXPLORER' : activeSidebarTab === 'ast' ? 'AST SYMBOLS' : 'SOURCE CONTROL'}</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#555555] hover:text-white p-0.5 rounded hover:bg-[#111111]"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Switcher */}
            <div className="flex-1 overflow-y-auto">
              {activeSidebarTab === 'files' && (
                <div className="py-1">
                  <div className="px-3 py-1 flex items-center gap-1 text-[11px] text-[#cccccc] font-medium font-mono">
                    <ChevronDown className="w-3 h-3 text-[#777777]" />
                    <span className="truncate">{selectedRepo || 'WORKSPACE'}</span>
                  </div>
                  <FileTree
                    files={files}
                    selectedFile={selectedFile}
                    onSelectFile={(f) => handleTabClick(f)}
                  />
                </div>
              )}

              {activeSidebarTab === 'ast' && (
                <div className="p-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-[#1a1a1a]">
                    <span className="font-semibold text-white">AST Index</span>
                    <span className="text-[10px] text-[#888888] bg-[#141414] px-1.5 py-0.2 rounded border border-[#262626]">
                      {astSymbols?.symbol_count || 0} Symbols
                    </span>
                  </div>

                  {astSymbols?.symbols?.length > 0 ? (
                    <div className="space-y-1">
                      {astSymbols.symbols.map((sym: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-[#111111] bg-[#0a0a0a] border border-[#1a1a1a] text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`text-[9px] px-1 rounded font-mono font-bold ${
                              sym.type === 'function' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}>
                              {sym.type === 'function' ? 'fn' : 'cls'}
                            </span>
                            <span className="font-mono text-white truncate">{sym.name}</span>
                          </div>
                          <span className="text-[10px] text-[#666666] font-mono">L{sym.lineno}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#555555] p-2 text-center">
                      No symbols in current file. Select a source code file.
                    </p>
                  )}
                </div>
              )}

              {activeSidebarTab === 'git' && (
                <div className="p-3 space-y-3 text-xs text-[#888888]">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Git State</span>
                    <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded text-[10px]">
                      Clean Working Tree
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#666666]">
                    CodeNexus SWE-Agent performs automated transactional snapshots before each patch to guarantee zero-loss rollbacks.
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Main Stage (Editor + Bottom Panel) */}
        <main className="flex-1 flex flex-col bg-[#000000] overflow-hidden">
          
          {/* File Tab Bar (Cursor Tabs) */}
          <div className="h-8 bg-[#000000] border-b border-[#161616] flex items-center justify-between overflow-x-auto text-xs shrink-0 select-none">
            <div className="flex items-center h-full overflow-x-auto">
              {openTabs.length > 0 ? (
                openTabs.map((tab) => {
                  const isCur = selectedFile === tab && editorMode === 'code';
                  const tabTitle = tab.split('/').pop() || tab;
                  return (
                    <div
                      key={tab}
                      onClick={() => {
                        setSelectedFile(tab);
                        setEditorMode('code');
                      }}
                      className={`h-full flex items-center gap-2 px-3 border-r border-[#161616] cursor-pointer transition-colors text-[11px] group ${
                        isCur
                          ? 'bg-[#0a0a0a] text-white border-t border-t-white font-medium'
                          : 'bg-[#000000] text-[#777777] hover:text-[#cccccc] hover:bg-[#080808]'
                      }`}
                    >
                      <FileCode2 className={`w-3.5 h-3.5 ${isCur ? 'text-white' : 'text-[#777777]'}`} />
                      <span className="truncate max-w-[140px]">{tabTitle}</span>
                      <button
                        onClick={(e) => handleTabClose(e, tab)}
                        className="p-0.5 rounded-full hover:bg-[#222222] text-[#555555] group-hover:text-[#999999]"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 text-[11px] text-[#555555]">No open files</div>
              )}

              {/* Proposed Diff Tab */}
              {activeDiff && (
                <div
                  onClick={() => setEditorMode('diff')}
                  className={`h-full flex items-center gap-1.5 px-3 border-r border-[#161616] cursor-pointer transition-colors text-[11px] ${
                    editorMode === 'diff'
                      ? 'bg-[#12081a] text-purple-300 border-t border-t-purple-400 font-medium'
                      : 'bg-[#000000] text-purple-400/70 hover:text-purple-300 hover:bg-[#0c0512]'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                  <span>Proposed Patch Diff</span>
                </div>
              )}
            </div>

            {/* Editor Mode Quick Switcher */}
            {activeDiff && (
              <div className="flex items-center gap-1 pr-3">
                <button
                  onClick={() => setEditorMode(editorMode === 'code' ? 'diff' : 'code')}
                  className="flex items-center gap-1 text-[10px] bg-[#141414] hover:bg-[#222222] text-white px-2 py-0.5 rounded border border-[#262626]"
                >
                  <GitCompare className="w-3 h-3 text-purple-400" />
                  <span>{editorMode === 'code' ? 'View Diff' : 'View Code'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Code Viewer / Diff Viewer Surface */}
          <div className="flex-1 bg-[#000000] overflow-hidden relative">
            {editorMode === 'code' ? (
              <CodeViewer
                fileName={selectedFile}
                content={fileContent}
              />
            ) : (
              <div className="h-full overflow-auto p-2 bg-[#000000]">
                <DiffViewer diffData={activeDiff} />
              </div>
            )}
          </div>

          {/* Bottom Collapsible Panel (Tests, Terminal, AST Scope) */}
          {isBottomPanelOpen && (
            <div className="h-56 bg-[#000000] border-t border-[#161616] flex flex-col shrink-0 z-10">
              {/* Bottom Panel Tab Header */}
              <div className="h-7 bg-[#000000] border-b border-[#161616] flex items-center justify-between px-3 text-xs select-none">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setBottomPanelTab('TESTS')}
                    className={`h-full pb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wide transition-colors ${
                      bottomPanelTab === 'TESTS'
                        ? 'text-white border-b-2 border-white'
                        : 'text-[#666666] hover:text-[#cccccc]'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>TEST RUNNER</span>
                  </button>

                  <button
                    onClick={() => setBottomPanelTab('TERMINAL')}
                    className={`h-full pb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wide transition-colors ${
                      bottomPanelTab === 'TERMINAL'
                        ? 'text-white border-b-2 border-white'
                        : 'text-[#666666] hover:text-[#cccccc]'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>TERMINAL / LOGS</span>
                  </button>

                  <button
                    onClick={() => setBottomPanelTab('AST_SCOPE')}
                    className={`h-full pb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wide transition-colors ${
                      bottomPanelTab === 'AST_SCOPE'
                        ? 'text-white border-b-2 border-white'
                        : 'text-[#666666] hover:text-[#cccccc]'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5 text-purple-400" />
                    <span>AST INSPECTION SCOPE</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsBottomPanelOpen(false)}
                  className="text-[#555555] hover:text-white p-0.5 rounded hover:bg-[#111111]"
                  title="Close Panel"
                >
                  <PanelBottomClose className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Panel Content */}
              <div className="flex-1 overflow-hidden">
                {bottomPanelTab === 'TESTS' && (
                  <TestResults
                    testOutput={testOutput}
                    onRunTestManually={handleRunTests}
                    isRunningTest={isRunningTest}
                  />
                )}

                {bottomPanelTab === 'TERMINAL' && (
                  <div className="h-full overflow-y-auto bg-[#000000] p-3 font-terminal text-[11px] text-[#aaaaaa] space-y-1.5 select-text">
                    <div className="text-[#555555] pb-1 border-b border-[#141414] flex items-center justify-between">
                      <span>CodeNexus Agent Subprocess Stream [Port 8090]</span>
                      <span>Connected</span>
                    </div>
                    {events.length === 0 ? (
                      <p className="text-[#444444] italic pt-2">Terminal idling. Trigger SWE agent or Run Tests to view real-time log stream.</p>
                    ) : (
                      events.map((ev, i) => (
                        <div key={i} className="leading-relaxed">
                          <span className="text-[#666666]">[{new Date().toLocaleTimeString()}]</span>{' '}
                          <span className={ev.type === 'error' ? 'text-rose-400 font-bold' : ev.type === 'complete' ? 'text-emerald-400 font-bold' : 'text-[#cccccc]'}>
                            {ev.message || ev.content || (ev.summary && `Completed: ${ev.summary}`) || JSON.stringify(ev.args || ev.result || '')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {bottomPanelTab === 'AST_SCOPE' && (
                  <div className="h-full bg-[#000000] p-2 overflow-y-auto">
                    <InspectionScopeViewer telemetry={inspectionScope} />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Collapsible AI Agent Chat Panel (Cursor Theme) */}
        {isChatOpen && (
          <aside className="w-96 bg-[#000000] border-l border-[#161616] flex flex-col shrink-0 z-20">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#161616] text-[11px] font-semibold text-[#888888] tracking-wider uppercase">
              <div className="flex items-center gap-1.5 text-white">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>AGENT RE-ACT STREAM</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-[#555555] hover:text-white p-0.5 rounded hover:bg-[#111111]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Prompt Presets Pill Bar */}
            <div className="p-2 bg-[#000000] border-b border-[#161616] space-y-1 shrink-0">
              <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider">Quick Benchmarks:</span>
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.repoName}
                    onClick={() => handlePresetSelect(p)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a0a0a] hover:bg-[#141414] border border-[#1f1f1f] text-[#aaaaaa] hover:text-white text-[10px] transition-colors"
                  >
                    <FileCode2 className="w-3 h-3 text-[#888888]" />
                    <span className="truncate max-w-[170px]">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Context File Tag Chip */}
            <div className="px-3 py-1.5 bg-[#000000] border-b border-[#161616] flex items-center gap-2 text-[10px] text-[#777777] shrink-0">
              <span className="text-[#555555]">Context:</span>
              <div className="flex items-center gap-1 bg-[#0a0a0a] px-2 py-0.5 rounded text-[#cccccc] border border-[#1a1a1a]">
                <Code2 className="w-3 h-3 text-[#888888]" />
                <span>{selectedFile ? fileNameOnly : 'Workspace Root'}</span>
                <span className="text-[10px] text-[#555555]">(Active File)</span>
              </div>
            </div>

            {/* Chat Timeline Stream (Thoughts, Tools, Tracebacks) */}
            <div className="flex-1 overflow-y-auto p-2 bg-[#000000]">
              <AgentTimeline events={events} isRunning={isRunning} />
            </div>

            {/* Bottom Prompt & Execution Box (Minimal Monochrome Theme) */}
            <div className="p-2.5 bg-[#000000] border-t border-[#161616] flex flex-col gap-2 shrink-0">
              <div className="bg-[#0a0a0a] border border-[#222222] focus-within:border-[#444444] rounded-lg p-2 flex flex-col gap-1.5 shadow-inner transition-colors">
                <textarea
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="Describe the bug or task to fix across the codebase..."
                  rows={3}
                  className="w-full bg-transparent text-[11px] text-white placeholder-[#555555] outline-none resize-none font-sans leading-relaxed select-text"
                />

                {/* Input Card Action Toolbar */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a] text-xs">
                  <div className="flex items-center gap-3">
                    {/* Human-in-the-Loop Toggle */}
                    <label className="flex items-center gap-1 cursor-pointer text-[#777777] hover:text-[#cccccc] select-none text-[10px]">
                      <input
                        type="checkbox"
                        checked={isSupervised}
                        onChange={(e) => setIsSupervised(e.target.checked)}
                        className="rounded bg-[#000000] border-[#333333] text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <ShieldCheck className="w-3 h-3 text-[#888888]" />
                      <span>Human-in-Loop</span>
                    </label>

                    {/* Offline Demo Mode Toggle */}
                    <label className="flex items-center gap-1 cursor-pointer text-[#777777] hover:text-[#cccccc] select-none text-[10px]">
                      <input
                        type="checkbox"
                        checked={forceDemo}
                        onChange={(e) => setForceDemo(e.target.checked)}
                        className="rounded bg-[#000000] border-[#333333] text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <Film className="w-3 h-3 text-[#888888]" />
                      <span>Offline Demo</span>
                    </label>
                  </div>

                  {/* Primary CTA: Run SWE Agent / Stop Agent */}
                  <div>
                    {!isRunning ? (
                      <button
                        onClick={handleStartAgent}
                        className="flex items-center gap-1.5 bg-white hover:bg-neutral-200 active:bg-neutral-300 text-black px-3 py-1.5 rounded text-[11px] font-bold border border-white/20 shadow-sm transition-all active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-black text-black" />
                        <span>{forceDemo || !apiKey ? 'Run Autonomous Demo' : 'Run SWE Agent'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStopAgent}
                        className="flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40 px-3 py-1.5 rounded text-[11px] font-semibold shadow transition-all active:scale-95 animate-pulse"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop Agent</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM STATUS BAR (Minimal Monochrome Theme) */}
      <footer className="h-6 bg-[#000000] border-t border-[#161616] text-[#cccccc] text-[11px] flex items-center justify-between px-3 shrink-0 font-sans select-none z-20">
        {/* Left: Remote, Git Branch, Errors/Warnings & Test Status */}
        <div className="flex items-center gap-3">
          <div className="bg-[#141414] px-2 py-0.5 rounded flex items-center gap-1 font-bold text-white border border-[#222222]">
            <span>&gt;&lt;</span>
            <span>CodeNexus</span>
          </div>

          <div className="flex items-center gap-1 hover:bg-[#111111] px-1 rounded cursor-pointer text-[#888888] hover:text-white">
            <GitBranch className="w-3 h-3 text-[#888888]" />
            <span>main*</span>
          </div>

          <div className="flex items-center gap-2 hover:bg-[#111111] px-1 rounded cursor-pointer text-[#888888]">
            <span>⊗ 0</span>
            <span>⚠ 0</span>
          </div>

          <div className="flex items-center gap-1 font-medium bg-[#0a0a0a] px-1.5 py-0.2 rounded border border-[#1a1a1a]">
            {testOutput ? (
              testOutput.passed ? (
                <span className="text-emerald-400">✓ Tests: Passing</span>
              ) : (
                <span className="text-rose-400">✗ Tests: Failing</span>
              )
            ) : (
              <span className="text-[#666666]">○ Tests: Ready</span>
            )}
          </div>

          {astSymbols && (
            <div className="hidden lg:flex items-center gap-1 text-[10px] text-[#666666] bg-[#0a0a0a] px-1.5 py-0.2 rounded border border-[#1a1a1a]">
              <Network className="w-3 h-3 text-[#888888]" />
              <span>{astSymbols.symbol_count} AST Symbols</span>
            </div>
          )}
        </div>

        {/* Center: Live Agent Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 font-medium">
          {isRunning ? (
            <span className="flex items-center gap-1 text-white animate-pulse">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Agent: Re-Act Loop Running...</span>
            </span>
          ) : (
            <span className="text-[#666666]">Agent: Idle</span>
          )}
        </div>

        {/* Right: Line Numbers, Encoding, Language Mode, Model */}
        <div className="flex items-center gap-3 text-[#777777]">
          <span className="hover:bg-[#111111] px-1 rounded cursor-pointer">Ln 1, Col 1</span>
          <span className="hover:bg-[#111111] px-1 rounded cursor-pointer">Spaces: 4</span>
          <span className="hover:bg-[#111111] px-1 rounded cursor-pointer">UTF-8</span>
          <span className="hover:bg-[#111111] px-1 rounded cursor-pointer text-[#aaaaaa]">
            {selectedFile?.endsWith('.py') ? 'Python' : selectedFile?.endsWith('.js') ? 'JavaScript' : selectedFile?.endsWith('.ts') ? 'TypeScript' : selectedFile?.endsWith('.go') ? 'Go' : selectedFile?.endsWith('.rs') ? 'Rust' : 'Plain Text'}
          </span>
          <span className="hover:bg-[#111111] px-1 rounded cursor-pointer font-medium text-[#aaaaaa]">
            {modelName}
          </span>
          <Bell className="w-3 h-3 hover:text-white cursor-pointer" />
        </div>
      </footer>

      {/* Modals */}
      <GitHubCloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onRepoCloned={(path, name) => {
          fetchRepos(name);
          setIsCloneModalOpen(false);
        }}
        apiBase={API_BASE}
      />

      <UploadWorkspaceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onWorkspaceUploaded={(path, name) => {
          fetchRepos(name);
          setIsUploadModalOpen(false);
        }}
        apiBase={API_BASE}
      />

    </div>
  );
}
