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
  Film
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
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('GEMINI_API_KEY') || '';
    } catch {
      return '';
    }
  });
  const [modelName, setModelName] = useState<string>('gemini-2.5-flash');
  const [isSupervised, setIsSupervised] = useState<boolean>(false);
  const [forceDemo, setForceDemo] = useState<boolean>(false);
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);

  // AST Symbol & Blast Radius View
  const [astSymbols, setAstSymbols] = useState<any>(null);
  const [showAstView, setShowAstView] = useState<boolean>(false);

  // IDE layout states
  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'search' | 'git' | 'debug'>('files');
  const [bottomPanelTab, setBottomPanelTab] = useState<'TESTS' | 'TERMINAL' | 'OUTPUT' | 'PROBLEMS'>('TESTS');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState<boolean>(false);
  const apiKeyPopoverRef = useRef<HTMLDivElement>(null);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    try {
      localStorage.setItem('GEMINI_API_KEY', val);
    } catch {}
  };

  // Close API key popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (apiKeyPopoverRef.current && !apiKeyPopoverRef.current.contains(event.target as Node)) {
        setIsApiKeyOpen(false);
      }
    }
    if (isApiKeyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isApiKeyOpen]);

  // Fetch sample repos on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/repos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.repos && data.repos.length > 0) {
          setRepos(data.repos);
          setSelectedRepo(data.repos[0].path);
          loadAstSymbols(data.repos[0].path);
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

  // Real Repository Reset
  const handleResetRepo = () => {
    if (!selectedRepo) return;
    fetch(`${API_BASE}/api/repo/reset?path=${encodeURIComponent(selectedRepo)}`, { method: 'POST' })
      .then((res) => res.json())
      .then(() => {
        if (selectedFile) loadFileContent(selectedRepo, selectedFile);
        loadAstSymbols(selectedRepo);
        runTestManually();
      })
      .catch((err) => console.error('Failed to reset repo:', err));
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

      // If a tool was executed that changed a file or ran tests, refresh file and tests
      if (parsed.type === 'tool_result' && parsed.tool === 'edit_file_replace') {
        if (selectedFile) {
          loadFileContent(selectedRepo, selectedFile);
        }
        loadAstSymbols(selectedRepo);
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

  const currentRepoName = repos.find((r) => r.path === selectedRepo)?.name || 'workspace';
  const fileNameOnly = selectedFile ? selectedFile.split('/').pop() : 'Welcome';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-[#cccccc] overflow-hidden font-sans select-none text-[13px]">
      
      {/* 1. TOP WINDOW TITLE BAR (Clean Pure Black, No Traffic Lights) */}
      <header className="h-9 bg-[#000000] border-b border-[#161616] flex items-center justify-between px-3 text-xs select-none shrink-0 z-20">
        {/* Left: Branding & Main Menus */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white font-bold text-xs mr-2 tracking-wide">
            <Bot className="w-4 h-4 text-white" />
            <span>CodeNexus</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[12px] text-[#888888]">
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]">File</span>
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]">Edit</span>
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]">Selection</span>
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]">View</span>
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]">Go</span>
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]" onClick={runTestManually}>Run</span>
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]" onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}>Terminal</span>
            <span className="hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-[#111111]">Help</span>
          </div>
        </div>

        {/* Center: Command Palette Search Bar with Integrated Model & API Key */}
        <div className="flex items-center justify-center flex-1 max-w-xl mx-4">
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#222222] px-3 py-1 rounded text-[11px] text-[#888888] w-full transition-colors relative">
            <Search className="w-3.5 h-3.5 text-[#888888] shrink-0" />
            <span className="truncate text-white/90">CodeNexus AI — {currentRepoName}</span>
            <span className="text-[10px] text-[#666666] bg-[#000000] px-1 py-0.2 rounded border border-[#1a1a1a] shrink-0">⌘P</span>

            {/* Embedded Controls: Divider, Minimal Model Selector & API Key Icon */}
            <div className="ml-auto flex items-center gap-2 border-l border-[#222222] pl-2 shrink-0">
              {/* Minimal Model Selector */}
              <div className="flex items-center gap-1 text-[#cccccc]">
                <Cpu className="w-3 h-3 text-[#888888]" />
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="bg-transparent text-[#cccccc] hover:text-white outline-none cursor-pointer text-[11px] py-0 border-none pr-1"
                >
                  <option value="gemini-2.5-flash" className="bg-[#0a0a0a] text-[#cccccc]">Gemini 2.5 Flash</option>
                  <option value="gemini-3.1-pro-preview" className="bg-[#0a0a0a] text-[#cccccc]">Gemini 3.1 Pro Preview</option>
                  <option value="gemini-1.5-flash" className="bg-[#0a0a0a] text-[#cccccc]">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro" className="bg-[#0a0a0a] text-[#cccccc]">Gemini 1.5 Pro</option>
                </select>
              </div>

              {/* Minimal API Key Action Icon & Lightweight Popover */}
              <div className="relative flex items-center" ref={apiKeyPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsApiKeyOpen(!isApiKeyOpen)}
                  title={apiKey ? "API Key Configured" : "Configure Gemini API Key"}
                  className={`p-1 rounded hover:bg-[#1a1a1a] transition-colors ${apiKey ? 'text-white' : 'text-[#777777] hover:text-white'}`}
                >
                  <Key className="w-3 h-3" />
                </button>

                {isApiKeyOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#0a0a0a] border border-[#222222] rounded shadow-2xl p-3 z-50 text-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] text-[#cccccc] font-medium border-b border-[#1a1a1a] pb-1.5">
                      <span className="flex items-center gap-1.5 text-white">
                        <Key className="w-3.5 h-3.5 text-white" />
                        Gemini API Key
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsApiKeyOpen(false)} 
                        className="text-[#666666] hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-[#777777] leading-tight">
                      Auto-saved to localStorage. Defaults to .env if empty:
                    </p>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      className="w-full bg-[#000000] border border-[#222222] focus:border-white rounded px-2 py-1 text-xs text-white outline-none font-mono"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      {apiKey && (
                        <button
                          type="button"
                          onClick={() => handleApiKeyChange('')}
                          className="text-[10px] text-[#888888] hover:text-rose-400 px-1.5 py-0.5 rounded"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsApiKeyOpen(false)}
                        className="text-[10px] bg-white text-black font-semibold px-2 py-0.5 rounded hover:bg-neutral-200"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Repository Selector & Window Layout Toggles */}
        <div className="flex items-center gap-2 text-xs">
          {/* Target Repo Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#141414] px-2 py-0.5 rounded border border-[#222222] text-[11px]">
            <FolderGit2 className="w-3.5 h-3.5 text-white" />
            <select
              value={selectedRepo}
              onChange={(e) => handleSelectRepo(e.target.value)}
              className="bg-transparent text-[#cccccc] outline-none cursor-pointer text-[11px]"
            >
              {repos.map((r) => (
                <option key={r.path} value={r.path} className="bg-[#0a0a0a] text-[#cccccc]">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Toggle Buttons */}
          <div className="flex items-center gap-1 border-l border-[#1a1a1a] pl-2 ml-1 text-[#888888]">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Primary Sidebar"
              className={`p-1 rounded hover:bg-[#141414] ${isSidebarOpen ? 'text-white' : 'text-[#555555]'}`}
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
              title="Toggle Panel"
              className={`p-1 rounded hover:bg-[#141414] ${isBottomPanelOpen ? 'text-white' : 'text-[#555555]'}`}
            >
              <PanelBottomClose className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              title="Toggle Cursor Chat"
              className={`p-1 rounded hover:bg-[#141414] ${isChatOpen ? 'text-blue-400' : 'text-[#555555]'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ACTIVITY BAR (Leftmost Icon Strip) */}
        <aside className="w-12 bg-[#000000] border-r border-[#161616] flex flex-col items-center py-2 justify-between shrink-0 select-none">
          <div className="flex flex-col items-center gap-4 text-[#777777]">
            <button 
              onClick={() => { setActiveSidebarTab('files'); setIsSidebarOpen(true); }}
              title="Explorer (⇧⌘E)" 
              className={`relative p-2 rounded hover:text-white transition-colors ${activeSidebarTab === 'files' && isSidebarOpen ? 'text-white' : ''}`}
            >
              {activeSidebarTab === 'files' && isSidebarOpen && (
                <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-[#2563EB]" />
              )}
              <Files className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setActiveSidebarTab('search'); setIsSidebarOpen(true); }}
              title="Search (⇧⌘F)" 
              className={`relative p-2 rounded hover:text-white transition-colors ${activeSidebarTab === 'search' && isSidebarOpen ? 'text-white' : ''}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setActiveSidebarTab('git'); setIsSidebarOpen(true); }}
              title="Source Control (⌃⇧G)" 
              className={`relative p-2 rounded hover:text-white transition-colors ${activeSidebarTab === 'git' && isSidebarOpen ? 'text-white' : ''}`}
            >
              <GitBranch className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setActiveSidebarTab('debug'); setIsSidebarOpen(true); }}
              title="Run and Debug (⇧⌘D)" 
              className={`relative p-2 rounded hover:text-white transition-colors ${activeSidebarTab === 'debug' && isSidebarOpen ? 'text-white' : ''}`}
            >
              <PlayCircle className="w-5 h-5" />
            </button>
            <button 
              title="AST Code Intelligence" 
              onClick={() => setShowAstView(!showAstView)}
              className={`relative p-2 rounded hover:text-white transition-colors ${showAstView ? 'text-white' : ''}`}
            >
              {showAstView && (
                <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-[#2563EB]" />
              )}
              <Network className="w-5 h-5" />
            </button>
            <button 
              title="Extensions (⇧⌘X)" 
              className="p-2 rounded hover:text-white transition-colors"
            >
              <Blocks className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 text-[#777777]">
            <button title="Accounts" className="p-2 rounded hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </button>
            <button title="Settings (⌘,)" className="p-2 rounded hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* PRIMARY SIDEBAR (Explorer Panel) */}
        {isSidebarOpen && (
          <aside className="w-60 bg-[#000000] border-r border-[#161616] flex flex-col shrink-0 overflow-hidden text-xs select-none">
            {/* Header */}
            <div className="h-9 px-3 border-b border-[#161616] flex items-center justify-between text-[11px] font-bold tracking-wider text-[#999999] shrink-0">
              <span>EXPLORER</span>
              <div className="flex items-center gap-1 text-[#666666]">
                <button title="New File" className="hover:text-white p-0.5"><Plus className="w-3.5 h-3.5" /></button>
                <button title="Collapse Folders" className="hover:text-white p-0.5"><MoreHorizontal className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Folder Header */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="px-2 py-1 flex items-center gap-1 font-bold text-[11px] text-[#cccccc] bg-[#000000] border-b border-[#161616]">
                <ChevronDown className="w-3.5 h-3.5 text-white" />
                <span className="truncate uppercase tracking-wide">{currentRepoName}</span>
                <span className="ml-auto text-[10px] bg-[#141414] px-1.5 py-0.2 rounded text-[#aaaaaa] font-mono border border-[#222222]">
                  {files.length}
                </span>
              </div>

              {/* FileTree Component */}
              <div className="flex-1 overflow-y-auto">
                <FileTree 
                  files={files} 
                  selectedFile={selectedFile} 
                  onSelectFile={(f) => {
                    setShowAstView(false);
                    loadFileContent(selectedRepo, f);
                  }} 
                />
              </div>

              {/* Lower Collapsible Sections (Outline, Timeline) */}
              <div className="border-t border-[#161616] shrink-0">
                <button 
                  onClick={() => setIsOutlineOpen(!isOutlineOpen)}
                  className="w-full px-2 py-1 flex items-center gap-1 text-[11px] font-semibold text-[#777777] hover:text-white hover:bg-[#111111] transition-colors"
                >
                  {isOutlineOpen ? <ChevronDown className="w-3 h-3 text-[#888888]" /> : <ChevronRight className="w-3 h-3 text-[#888888]" />}
                  <span>OUTLINE</span>
                </button>
                {isOutlineOpen && (
                  <div className="px-4 py-2 text-[11px] text-[#555555]">
                    {astSymbols ? `${astSymbols.symbol_count} Symbols Indexed` : 'Symbol tree ready'}
                  </div>
                )}

                <button 
                  onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                  className="w-full px-2 py-1 flex items-center gap-1 text-[11px] font-semibold text-[#777777] hover:text-white hover:bg-[#111111] transition-colors border-t border-[#161616]"
                >
                  {isTimelineOpen ? <ChevronDown className="w-3 h-3 text-[#888888]" /> : <ChevronRight className="w-3 h-3 text-[#888888]" />}
                  <span>TIMELINE</span>
                </button>
                {isTimelineOpen && (
                  <div className="px-4 py-2 text-[11px] text-[#555555]">
                    Git transactional history synced
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* 3. CENTER VIEWPORT: EDITOR & BOTTOM PANEL */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-hidden">
          
          {/* EDITOR TABS BAR */}
          <div className="h-9 bg-[#000000] border-b border-[#161616] flex items-center justify-between overflow-x-auto shrink-0 select-none">
            {/* Active Tabs */}
            <div className="flex items-center h-full">
              {/* Code File Tab */}
              <div 
                onClick={() => setShowAstView(false)}
                className={`h-full border-r border-[#161616] px-3 flex items-center gap-2 text-xs font-sans cursor-pointer transition-colors ${
                  !showAstView ? 'bg-[#000000] border-t-2 border-[#2563EB] text-white' : 'bg-[#050505] text-[#777777] hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-white" />
                <span className="font-medium tracking-tight">{fileNameOnly}</span>
                {selectedFile && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFileContent(null); }}
                    className="ml-2 p-0.5 rounded hover:bg-[#1a1a1a] text-[#777777] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* AST Intelligence Tab */}
              <div 
                onClick={() => setShowAstView(true)}
                className={`h-full border-r border-[#161616] px-3 flex items-center gap-2 text-xs font-sans cursor-pointer transition-colors ${
                  showAstView ? 'bg-[#000000] border-t-2 border-[#2563EB] text-white' : 'bg-[#050505] text-[#777777] hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-white" />
                <span className="font-medium tracking-tight">AST Symbol Index</span>
                {astSymbols && (
                  <span className="text-[10px] bg-[#141414] px-1 py-0.2 rounded text-[#aaaaaa] border border-[#222222]">
                    {astSymbols.symbol_count}
                  </span>
                )}
              </div>
            </div>

            {/* Editor Action Buttons (Reset Bug, AST toggle, Run test, Split) */}
            <div className="flex items-center gap-1.5 px-3 text-[#777777]">
              {/* Reset Bug Button */}
              <button
                onClick={handleResetRepo}
                title="Reset the current repo to its initial buggy baseline"
                className="flex items-center gap-1 bg-[#0a0a0a] hover:bg-[#141414] text-[#cccccc] hover:text-white px-2 py-0.5 rounded border border-[#222222] text-[11px] transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-white" />
                <span>Reset Bug</span>
              </button>

              <button 
                onClick={runTestManually} 
                title="Run Verification Tests"
                className="p-1 hover:bg-[#141414] hover:text-white rounded"
              >
                <Play className="w-3.5 h-3.5 text-white" />
              </button>
              <button title="Split Editor Right" className="p-1 hover:bg-[#141414] hover:text-white rounded">
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
              </button>
              <button title="More Actions" className="p-1 hover:bg-[#141414] hover:text-white rounded">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BREADCRUMB NAVIGATION */}
          <div className="h-6 bg-[#000000] border-b border-[#161616] px-4 flex items-center gap-1.5 text-[11px] text-[#777777] shrink-0 select-none">
            <span className="hover:text-white cursor-pointer">{currentRepoName}</span>
            <span>&gt;</span>
            <span className="text-[#cccccc] font-medium">
              {showAstView ? 'AST Symbol & Blast Radius Index' : (selectedFile || 'Welcome')}
            </span>
          </div>

          {/* CODE EDITOR WORKSPACE OR AST CODE INTELLIGENCE VIEW */}
          <div className="flex-1 overflow-hidden relative bg-[#000000]">
            {showAstView ? (
              <div className="flex flex-col h-full bg-[#000000] p-3 overflow-hidden select-text">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161616] text-xs font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-white" />
                    <span>AST Symbol & Blast Radius Index</span>
                  </div>
                  <span className="text-[10px] text-[#888888] font-mono">
                    {astSymbols ? `${astSymbols.symbol_count} Symbols | ${astSymbols.call_count} Calls` : 'Analyzing codebase...'}
                  </span>
                </div>
                <div className="flex-1 overflow-auto space-y-2 pr-1 font-mono text-xs">
                  {astSymbols && astSymbols.symbols && astSymbols.symbols.length > 0 ? (
                    astSymbols.symbols.map((sym: any, idx: number) => (
                      <div key={idx} className="bg-[#0a0a0a] p-2.5 rounded border border-[#1a1a1a] hover:border-[#333333] transition-colors space-y-1">
                        <div className="flex items-center justify-between text-white font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-[#141414] px-1.5 py-0.2 rounded border border-[#262626] text-[#aaaaaa]">
                              {sym.type === 'class' ? 'CLASS' : 'FUNC'}
                            </span>
                            <span>{sym.full_name || sym.name}()</span>
                          </span>
                          <span className="text-[10px] text-[#666666] font-normal">{sym.file}:{sym.line_start}</span>
                        </div>
                        {sym.docstring && (
                          <div className="text-[#888888] text-[11px] italic font-sans">{sym.docstring}</div>
                        )}
                        {sym.calls && sym.calls.length > 0 && (
                          <div className="text-[10px] text-[#666666] flex items-center gap-1 pt-0.5">
                            <span>Calls:</span>
                            <span className="text-[#aaaaaa]">{sym.calls.slice(0, 5).join(', ')}{sym.calls.length > 5 ? '...' : ''}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[#666666] text-center py-10 font-sans text-xs">
                      No AST symbols extracted or select a Python workspace to view AST intelligence.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <CodeViewer fileName={selectedFile} content={fileContent} />
            )}
          </div>

          {/* BOTTOM DOCKED PANEL (Terminal & Verification Suite) */}
          {isBottomPanelOpen && (
            <div className="h-64 bg-[#000000] border-t border-[#161616] flex flex-col shrink-0 overflow-hidden">
              {/* Terminal Tabs Header */}
              <div className="h-8 bg-[#000000] border-b border-[#161616] px-3 flex items-center justify-between select-none shrink-0 text-xs">
                <div className="flex items-center gap-4 h-full">
                  <button 
                    onClick={() => setBottomPanelTab('PROBLEMS')}
                    className={`h-full flex items-center gap-1.5 px-1 border-b-2 text-[11px] transition-colors ${
                      bottomPanelTab === 'PROBLEMS' 
                        ? 'border-blue-500 text-white font-medium' 
                        : 'border-transparent text-[#777777] hover:text-white'
                    }`}
                  >
                    <span>PROBLEMS</span>
                    <span className="bg-[#111111] px-1.5 py-0.2 rounded text-[10px] text-[#666666]">0</span>
                  </button>

                  <button 
                    onClick={() => setBottomPanelTab('OUTPUT')}
                    className={`h-full flex items-center gap-1.5 px-1 border-b-2 text-[11px] transition-colors ${
                      bottomPanelTab === 'OUTPUT' 
                        ? 'border-blue-500 text-white font-medium' 
                        : 'border-transparent text-[#777777] hover:text-white'
                    }`}
                  >
                    <span>OUTPUT</span>
                  </button>

                  <button 
                    onClick={() => setBottomPanelTab('TERMINAL')}
                    className={`h-full flex items-center gap-1.5 px-1 border-b-2 text-[11px] transition-colors ${
                      bottomPanelTab === 'TERMINAL' 
                        ? 'border-blue-500 text-white font-medium' 
                        : 'border-transparent text-[#777777] hover:text-white'
                    }`}
                  >
                    <span>TERMINAL</span>
                  </button>

                  <button 
                    onClick={() => setBottomPanelTab('TESTS')}
                    className={`h-full flex items-center gap-1.5 px-1 border-b-2 text-[11px] transition-colors ${
                      bottomPanelTab === 'TESTS' 
                        ? 'border-blue-500 text-white font-semibold' 
                        : 'border-transparent text-[#777777] hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-white" />
                    <span>VERIFICATION TESTS</span>
                    {testOutput && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${testOutput.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}>
                        {testOutput.passed ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </button>
                </div>

                {/* Right Panel Actions */}
                <div className="flex items-center gap-1 text-[#777777]">
                  <button onClick={runTestManually} title="Re-run Test Suite" className="p-1 hover:bg-[#141414] hover:text-white rounded">
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={() => setIsBottomPanelOpen(false)} title="Close Panel" className="p-1 hover:bg-[#141414] hover:text-white rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Panel Content Body */}
              <div className="flex-1 overflow-hidden bg-[#000000]">
                {bottomPanelTab === 'TESTS' && (
                  <TestResults 
                    testOutput={testOutput} 
                    onRunTestManually={runTestManually} 
                    isRunningTest={isRunningTest} 
                  />
                )}
                {bottomPanelTab === 'TERMINAL' && (
                  <div className="h-full p-3 font-terminal text-xs text-gray-300 bg-[#000000] overflow-auto">
                    <div className="text-gray-500 mb-2">CodeNexus Execution Shell v1.0 [Sandboxed Subprocess]</div>
                    <div className="text-white">$ cd {selectedRepo || './'}</div>
                    <div className="text-gray-400">$ pytest / unittest / node:test runner hooked</div>
                    <div className="text-gray-600 mt-2">Active sandbox ready for automated validation.</div>
                  </div>
                )}
                {bottomPanelTab === 'OUTPUT' && (
                  <div className="h-full p-3 font-terminal text-xs text-gray-400 bg-[#000000] overflow-auto">
                    [CodeNexus Engine] Connected to backend on {API_BASE}
                    <br />[Agent WebSocket] Listening on {WS_BASE}/ws/agent
                  </div>
                )}
                {bottomPanelTab === 'PROBLEMS' && (
                  <div className="h-full flex items-center justify-center text-gray-600 text-xs font-sans">
                    No problems detected in workspace.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* 4. RIGHT SIDEBAR: CURSOR-STYLE AGENT CHAT PANEL */}
        {isChatOpen && (
          <aside className="w-[420px] bg-[#000000] border-l border-[#161616] flex flex-col shrink-0 overflow-hidden select-none">
            
            {/* Chat Panel Header */}
            <div className="h-9 px-3 border-b border-[#161616] flex items-center justify-between text-xs shrink-0 bg-[#000000]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="font-bold text-white text-[11px] tracking-wide">CHAT</span>
                <span className="text-[10px] bg-[#141414] text-[#cccccc] px-1.5 py-0.2 rounded border border-[#262626] font-semibold">
                  COMPOSER
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
                <span className="bg-[#0a0a0a] px-2 py-0.5 rounded text-[10px] text-[#aaaaaa] border border-[#1a1a1a]">
                  {modelName}
                </span>
                <button 
                  onClick={() => setEvents([])} 
                  title="Clear Chat / Reset Session"
                  className="p-1 hover:bg-[#141414] hover:text-white rounded text-[#888888]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Benchmark Quick Presets Bar */}
            <div className="px-3 py-2 border-b border-[#161616] bg-[#000000] flex flex-col gap-1.5 shrink-0 text-xs">
              <span className="text-[10px] text-[#777777] font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#aaaaaa]" /> Demo Benchmarks:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(p)}
                    className="bg-[#0a0a0a] hover:bg-[#141414] text-[#cccccc] hover:text-white px-2 py-1 rounded border border-[#222222] hover:border-[#444444] transition-colors flex items-center gap-1 text-[10px]"
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
                <span className="text-[10px] text-[#555555]">(Current File)</span>
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
                  placeholder="Ask anything or describe the bug / feature to implement..."
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

                  {/* Primary CTA: Run SWE Agent (Clean Monochrome White) / Stop Agent */}
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

      {/* 5. BOTTOM STATUS BAR (Minimal Monochrome Theme) */}
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
            {selectedFile?.endsWith('.py') ? 'Python' : selectedFile?.endsWith('.js') ? 'JavaScript' : selectedFile?.endsWith('.json') ? 'JSON' : 'Plain Text'}
          </span>
          <span className="hover:bg-[#111111] px-1 rounded cursor-pointer font-medium text-[#aaaaaa]">
            {modelName}
          </span>
          <Bell className="w-3 h-3 hover:text-white cursor-pointer" />
        </div>
      </footer>

    </div>
  );
}
