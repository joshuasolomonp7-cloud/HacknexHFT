import React from 'react';
import { 
  Bug, 
  Dna, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Activity,
  ArrowRight
} from 'lucide-react';

export interface BugItem {
  id: string;
  dna_fingerprint: string;
  title: string;
  description: string;
  file_path: string;
  line_number?: number;
  symbol_name?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: number;
  dependencies: string[];
  state: string;
  root_cause?: string;
  repair_attempts: number;
}

interface BugCardProps {
  bug: BugItem;
  isActive?: boolean;
  onSelect?: () => void;
}

export const BugCard: React.FC<BugCardProps> = ({ bug, isActive, onSelect }) => {
  const getSeverityBadge = () => {
    switch (bug.severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStateBadge = () => {
    switch (bug.state) {
      case 'VERIFIED':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3 h-3" />
        };
      case 'PATCHING':
      case 'TESTING':
      case 'ANALYZING':
        return {
          bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: <Activity className="w-3 h-3 animate-pulse" />
        };
      case 'BLOCKED':
      case 'REPAIR_FAILED':
        return {
          bg: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <AlertTriangle className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <Clock className="w-3 h-3" />
        };
    }
  };

  const stateInfo = getStateBadge();

  return (
    <div 
      onClick={onSelect}
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isActive 
          ? 'bg-[#1c2128] border-purple-500 shadow-md shadow-purple-500/10' 
          : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
            <Bug className="w-3 h-3" />
            {bug.id}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getSeverityBadge()}`}>
            {bug.severity}
          </span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-medium ${stateInfo.bg}`}>
          {stateInfo.icon}
          <span>{bug.state}</span>
        </div>
      </div>

      <h4 className="text-xs font-semibold text-gray-200 line-clamp-1 mb-1">
        {bug.title}
      </h4>
      <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 leading-relaxed">
        {bug.description}
      </p>

      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono border-t border-[#30363d]/60 pt-2">
        <span className="flex items-center gap-1 text-gray-400">
          <Dna className="w-3 h-3 text-purple-400" />
          <span>DNA: {bug.dna_fingerprint}</span>
        </span>
        <span className="text-gray-400">
          {bug.file_path}{bug.line_number ? `:${bug.line_number}` : ''}
        </span>
      </div>

      {bug.dependencies && bug.dependencies.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/20">
          <Layers className="w-3 h-3" />
          <span>Prerequisite: {bug.dependencies.join(', ')}</span>
        </div>
      )}
    </div>
  );
};
