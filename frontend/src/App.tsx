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
  Bug,
  Radar,
  GitCompare,
  BarChart3,
  Github,
  UploadCloud,
  Download,
  Terminal as TerminalIcon,
  Layers,
  FileDiff,
  FileText
} from 'lucide-react';
import { FileTree } from './components/FileTree';
import { AgentTimeline, TimelineEvent } from './components/AgentTimeline';
import { CodeViewer } from './components/CodeViewer';
import { TestResults } from './components/TestResults';
import { BugCard, BugItem } from './components/BugCard';
import { DiffViewer, DiffData } from './components/DiffViewer';
import { InspectionScopeViewer, InspectionTelemetry, BlastRadiusData } from './components/InspectionScopeViewer';
import { EvidencePanel, ExecutionEvidence } from './components/EvidencePanel';
import { BenchmarkModal } from './components/BenchmarkModal';
import { GitHubCloneModal } from './components/GitHubCloneModal';
import { UploadWorkspaceModal } from './components/UploadWorkspaceModal';
import { TerminalViewer } from './components/TerminalViewer';

const API_BASE = 'http://localhost:8090';
const WS_BASE = 'ws://localhost:8090';

const DYNAMIC_TASK_PRESETS = [
  {
    label: '🧪 Auto-Fix Failing Tests',
    prompt: 'Run test suite across the repository, identify failing assertions, inspect symbols, and synthesize minimal surgical patches with zero regressions.'
  },
  {
    label: '🛡️ AST & Blast Radius Audit',
    prompt: 'Perform comprehensive AST static analysis, identify high-risk blast radius symbols, and resolve syntax or logic edge cases.'
  },
  {
    label: '⚡ Refactor & Surgical Patching',
    prompt: 'Analyze caller dependencies, inspect localized code slices, and apply surgical bug fixes to restore clean test execution.'
  }
];

export function App() {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [rawFileContent, setRawFileContent] = useState<string | null>(null);
  
  const [taskPrompt, setTaskPrompt] = useState<string>(DYNAMIC_TASK_PRESETS[0].prompt);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [modelName, setModelName] = useState<string>('gemini-2.5-flash');
  const [isSupervised, setIsSupervised] = useState<boolean>(false);
  const [forceDemo, setForceDemo] = useState<boolean>(false);
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);

  // Workbench Tabs
  const [activeTab, setActiveTab] = useState<'code' | 'diff' | 'inspection' | 'evidence' | 'tests' | 'terminal'>('code');
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [activeBugId, setActiveBugId] = useState<string | null>(null);
  const [activeDiff, setActiveDiff] = useState<DiffData | null>(null);
  const [inspectionTelemetry, setInspectionTelemetry] = useState<InspectionTelemetry | null>(null);
  const [blastRadius, setBlastRadius] = useState<BlastRadiusData | null>(null);
  const [beforeEvidence, setBeforeEvidence] = useState<ExecutionEvidence | null>(null);
  const [afterEvidence, setAfterEvidence] = useState<ExecutionEvidence | null>(null);
  
  // Modals
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [globalDragOver, setGlobalDragOver] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('GEMINI_API_KEY', val);
  };

  const loadWorkspaces = (preferredPath?: string) => {
    fetch(`${API_BASE}/api/workspaces`)
      .then((res) => res.json())
      .then((data) => {
        if (data.repos && data.repos.length > 0) {
          setRepos(data.repos);
          const target = preferredPath 
            ? data.repos.find((r: any) => r.path === preferredPath) || data.repos[0]
            : data.repos[0];
          
          setSelectedRepo(target.path);
          setFiles(target.files || []);
          if (target.files && target.files.length > 0) {
            loadFileContent(target.path, target.files[0]);
          } else {
            setSelectedFile(null);
            setFileContent(null);
            setRawFileContent(null);
          }
        }
      })
      .catch((err) => console.error('Failed to load workspaces:', err));
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadFileContent = (repoPath: string, file: string) => {
    setSelectedFile(file);
    fetch(`${API_BASE}/api/repo/file_content?path=${encodeURIComponent(repoPath)}&file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) {
          setFileContent(data.content);
          setRawFileContent(data.raw_content || null);
        } else {
          setFileContent(data.error || 'Error reading file.');
          setRawFileContent(null);
        }
      })
      .catch((err) => {
        setFileContent(`Failed to fetch file content: ${err}`);
        setRawFileContent(null);
      });
  };

  const handleSelectRepo = (repoPath: string) => {
    setSelectedRepo(repoPath);
    fetch(`${API_BASE}/api/repo/files?path=${encodeURIComponent(repoPath)}`)
      .then((res) => res.json())
      .then((data) => {
        setFiles(data.files || []);
        if (data.files && data.files.length > 0) {
          loadFileContent(repoPath, data.files[0]);
        } else {
          setSelectedFile(null);
          setFileContent(null);
          setRawFileContent(null);
        }
      });
  };

  const handleCreateFile = async (fileName: string) => {
    if (!selectedRepo) return;
    try {
      const res = await fetch(`${API_BASE}/api/repo/create_file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedRepo,
          file_name: fileName,
          content: ''
        })
      });
      const data = await res.json();
      if (data.success && data.files) {
        setFiles(data.files);
        loadFileContent(selectedRepo, fileName);
      }
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const handleSaveFile = async (fileName: string, newContent: string) => {
    if (!selectedRepo) return;
    try {
      const res = await fetch(`${API_BASE}/api/repo/save_file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedRepo,
          file_name: fileName,
          content: newContent
        })
      });
      const data = await res.json();
      if (data.success) {
        loadFileContent(selectedRepo, fileName);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!selectedRepo) return;
    try {
      const res = await fetch(`${API_BASE}/api/repo/delete_file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedRepo,
          file_name: fileName
        })
      });
      const data = await res.json();
      if (data.success && data.files) {
        setFiles(data.files);
        if (selectedFile === fileName) {
          if (data.files.length > 0) {
            loadFileContent(selectedRepo, data.files[0]);
          } else {
            setSelectedFile(null);
            setFileContent(null);
            setRawFileContent(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleExportZip = () => {
    if (!selectedRepo) return;
    window.open(`${API_BASE}/api/repo/export_zip?path=${encodeURIComponent(selectedRepo)}`, '_blank');
  };

  const handleExportPatch = async () => {
    if (!selectedRepo) return;
    try {
      const res = await fetch(`${API_BASE}/api/repo/export_patch?path=${encodeURIComponent(selectedRepo)}`);
      const data = await res.json();
      if (data.patch) {
        navigator.clipboard.writeText(data.patch);
        alert('Unified patch diff copied to clipboard!');
      }
    } catch (err) {
      console.error('Export patch failed:', err);
    }
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

  const handleResetRepo = () => {
    if (!selectedRepo || isResetting) return;
    setIsResetting(true);
    fetch(`${API_BASE}/api/repo/reset?path=${encodeURIComponent(selectedRepo)}`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        setIsResetting(false);
        if (selectedFile) loadFileContent(selectedRepo, selectedFile);
        runTestManually();
      })
      .catch((err) => {
        console.error('Reset failed:', err);
        setIsResetting(false);
      });
  };

  const handleStartAgent = () => {
    if (!selectedRepo || isRunning) return;
    setIsRunning(true);
    setEvents([]);
    setBugs([]);
    setActiveDiff(null);
    setBeforeEvidence(null);
    setAfterEvidence(null);

    const ws = new WebSocket(`${WS_BASE}/ws/agent`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          repo_path: selectedRepo,
          task_prompt: taskPrompt,
          api_key: apiKey || undefined,
          model_name: modelName,
          demo_mode: forceDemo,
          is_supervised: isSupervised
        })
      );
    };

    ws.onmessage = (event) => {
      const parsed: TimelineEvent = JSON.parse(event.data);
      setEvents((prev) => [...prev, parsed]);

      if (parsed.type === 'bug_queue_updated' && parsed.bugs) {
        setBugs(parsed.bugs);
        if (parsed.bugs.length > 0) {
          setActiveBugId(parsed.bugs[0].id);
        }
      }

      if (parsed.type === 'bug_state_changed' && parsed.bug) {
        setBugs((prev) => prev.map((b) => (b.id === parsed.bug_id ? parsed.bug : b)));
      }

      if (parsed.type === 'inspection_scope') {
        setInspectionTelemetry(parsed.telemetry);
        if (parsed.blast_radius) setBlastRadius(parsed.blast_radius);
      }

      if (parsed.type === 'blast_radius_calculated') {
        setBlastRadius(parsed.blast_radius);
      }

      if (parsed.type === 'patch_applied' && parsed.patch?.diff) {
        setActiveDiff(parsed.patch.diff);
        setActiveTab('diff');
        if (selectedFile) {
          loadFileContent(selectedRepo, selectedFile);
        }
      }

      if (parsed.type === 'evidence_before') {
        setBeforeEvidence(parsed.evidence);
      }

      if (parsed.type === 'evidence_after') {
        setAfterEvidence(parsed.evidence);
        setActiveTab('evidence');
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
    <div 
      className="flex flex-col h-screen w-screen bg-[#0d1117] text-gray-200 overflow-hidden font-sans relative"
      onDragOver={(e) => {
        e.preventDefault();
        setGlobalDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.relatedTarget) setGlobalDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setGlobalDragOver(false);
        setIsUploadModalOpen(true);
      }}
    >
      {/* Global Drag-and-Drop Active Overlay */}
      {globalDragOver && (
        <div className="absolute inset-0 z-40 bg-purple-900/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none border-4 border-dashed border-purple-400 m-4 rounded-2xl">
          <UploadCloud className="w-16 h-16 text-purple-300 animate-bounce mb-3" />
          <h2 className="text-xl font-bold text-white">Drop Codebase / ZIP Archive Here</h2>
          <p className="text-sm text-purple-200">Automatically creates and opens active workspace</p>
        </div>
      )}

      {/* Top Navbar */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-2 rounded-xl text-white shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
              CodeNexus SWE Agent <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Autonomous Repair</span>
            </h1>
            <p className="text-[11px] text-gray-400">Real-World AST Symbol Analysis, Surgical Patching & Verification</p>
          </div>
        </div>

        {/* Top Controls & Workspace Switcher */}
        <div className="flex items-center gap-2">
          {/* Workspace Dropdown */}
          <div className="flex items-center gap-2 bg-[#0d1117] px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs">
            <FolderGit2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={selectedRepo}
              onChange={(e) => handleSelectRepo(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer max-w-[200px] truncate"
            >
              {repos.map((r) => (
                <option key={r.path} value={r.path} className="bg-[#161b22]">
                  {r.name} ({r.file_count || 0} files)
                </option>
              ))}
            </select>
          </div>

          {/* Clone GitHub Button */}
          <button
            onClick={() => setIsCloneModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-purple-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs transition-colors"
            title="Clone a GitHub repository directly"
          >
            <Github className="w-3.5 h-3.5 text-purple-400" />
            <span>Clone Git</span>
          </button>

          {/* Drag & Drop Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-blue-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs transition-colors"
            title="Upload files, folders, or ZIP archives"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Upload / Drop</span>
          </button>

          {/* Export ZIP */}
          <button
            onClick={handleExportZip}
            disabled={!selectedRepo}
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-emerald-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs transition-colors disabled:opacity-50"
            title="Download repaired repository as ZIP archive"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export ZIP</span>
          </button>

          {/* Export Patch */}
          <button
            onClick={handleExportPatch}
            disabled={!selectedRepo}
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs transition-colors disabled:opacity-50"
            title="Copy Git Patch diff to clipboard"
          >
            <FileDiff className="w-3.5 h-3.5 text-gray-400" />
            <span>Patch</span>
          </button>

          {/* Reset Workspace */}
          <button
            onClick={handleResetRepo}
            disabled={isResetting || !selectedRepo}
            title="Reset repository to baseline"
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 hover:text-white px-2 py-1.5 rounded-lg border border-[#30363d] text-xs transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isResetting ? 'animate-spin' : ''}`} />
          </button>

          {/* Benchmark Runner Modal Button */}
          <button
            onClick={() => setIsBenchmarkOpen(true)}
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-purple-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
            <span>Benchmarks</span>
          </button>

          {/* Model Selector */}
          <div className="flex items-center gap-2 bg-[#0d1117] px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              <option value="gemini-2.5-flash" className="bg-[#161b22]">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro" className="bg-[#161b22]">Gemini 2.5 Pro</option>
              <option value="gemini-1.5-flash" className="bg-[#161b22]">Gemini 1.5 Flash</option>
            </select>
          </div>

          {/* API Key */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs">
            <Key className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <input
              type="password"
              placeholder="Gemini API Key (Auto-saved)"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="bg-transparent text-gray-200 outline-none w-32 text-[11px]"
            />
          </div>
        </div>
      </header>

      {/* Dynamic Task Prompt & Quick Presets Bar */}
      <div className="flex items-center gap-2 px-5 py-2 bg-[#0d1117] border-b border-[#30363d] text-xs shrink-0">
        <span className="text-gray-400 font-medium flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Quick Task:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {DYNAMIC_TASK_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setTaskPrompt(p.prompt)}
              className="bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-white px-2.5 py-1 rounded-md border border-[#30363d] transition-colors flex items-center gap-1 text-[11px] shrink-0"
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-xl mx-2">
          <input
            type="text"
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            placeholder="Describe issue, feature, or goal..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-1 text-white text-[11px] placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
          />
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 select-none text-[11px]">
            <input
              type="checkbox"
              checked={forceDemo}
              onChange={(e) => setForceDemo(e.target.checked)}
              className="rounded bg-[#0d1117] border-[#30363d] text-purple-600 focus:ring-0 cursor-pointer"
            />
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium text-purple-300">Autonomous AST Engine</span>
          </label>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Repo Files & Multi-Bug Queue */}
        <div className="col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          <div className="h-1/2">
            <FileTree 
              files={files} 
              selectedFile={selectedFile} 
              onSelectFile={(f) => loadFileContent(selectedRepo, f)}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>

          <div className="h-1/2 bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d] text-xs font-semibold text-gray-300">
              <div className="flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-purple-400" />
                <span>Bug Identity Queue ({bugs.length})</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {bugs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center p-4 space-y-1">
                  <Bug className="w-6 h-6 opacity-30 text-purple-400" />
                  <span>No active defects tracked. Start the agent to diagnose repository bugs.</span>
                </div>
              ) : (
                bugs.map((b) => (
                  <BugCard 
                    key={b.id} 
                    bug={b} 
                    isActive={activeBugId === b.id} 
                    onSelect={() => setActiveBugId(b.id)} 
                  />
                ))
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-[#30363d]">
              {!isRunning ? (
                <button
                  onClick={handleStartAgent}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all active:scale-[0.99]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{apiKey && !forceDemo ? 'Run Live AI Agent' : 'Run Autonomous Repair & Verify'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStopAgent}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Agent</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center Column: Live Agent Re-Act Stream */}
        <div className="col-span-4 h-full overflow-hidden">
          <AgentTimeline events={events} isRunning={isRunning} />
        </div>

        {/* Right Column: Multi-Tab Workbench */}
        <div className="col-span-5 flex flex-col h-full overflow-hidden bg-[#161b22] border border-[#30363d] rounded-lg">
          {/* Workbench Tabs */}
          <div className="flex items-center px-3 py-2 bg-[#1c2128] border-b border-[#30363d] text-xs gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'code' ? 'bg-[#30363d] text-white font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Source</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'diff' ? 'bg-[#30363d] text-purple-300 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Diff {activeDiff ? `(+${activeDiff.lines_added}/-${activeDiff.lines_removed})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('inspection')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'inspection' ? 'bg-[#30363d] text-blue-300 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>AST Scope</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'evidence' ? 'bg-[#30363d] text-emerald-300 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Evidence</span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'tests' ? 'bg-[#30363d] text-amber-300 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Test Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'terminal' ? 'bg-[#30363d] text-amber-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>Terminal</span>
            </button>
          </div>

          {/* Active Tab Content Area */}
          <div className="flex-1 p-2 overflow-hidden">
            {activeTab === 'code' && (
              <CodeViewer 
                fileName={selectedFile} 
                content={fileContent} 
                rawContent={rawFileContent}
                onSave={handleSaveFile}
              />
            )}

            {activeTab === 'diff' && (
              <DiffViewer diffData={activeDiff} />
            )}

            {activeTab === 'inspection' && (
              <InspectionScopeViewer 
                telemetry={inspectionTelemetry} 
                blastRadius={blastRadius} 
              />
            )}

            {activeTab === 'evidence' && (
              <EvidencePanel 
                beforeEvidence={beforeEvidence} 
                afterEvidence={afterEvidence} 
              />
            )}

            {activeTab === 'tests' && (
              <TestResults 
                testOutput={testOutput} 
                onRunTestManually={runTestManually} 
                isRunningTest={isRunningTest} 
              />
            )}

            {activeTab === 'terminal' && (
              <TerminalViewer 
                repoPath={selectedRepo} 
                apiBase={API_BASE} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <GitHubCloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onRepoCloned={(path) => loadWorkspaces(path)}
        apiBase={API_BASE}
      />

      <UploadWorkspaceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onWorkspaceUploaded={(path) => loadWorkspaces(path)}
        apiBase={API_BASE}
      />

      <BenchmarkModal 
        isOpen={isBenchmarkOpen} 
        onClose={() => setIsBenchmarkOpen(false)} 
        apiBase={API_BASE} 
      />
    </div>
  );
}
