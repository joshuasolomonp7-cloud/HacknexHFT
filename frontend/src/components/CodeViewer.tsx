import React, { useState, useEffect } from 'react';
import { Code2, Edit3, Save, Copy, Check, Eye } from 'lucide-react';

interface CodeViewerProps {
  fileName: string | null;
  content: string | null;
  rawContent?: string | null;
  onSave?: (fileName: string, newContent: string) => Promise<void> | void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  fileName,
  content,
  rawContent,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // When file changes, reset edit state
    setIsEditing(false);
    setEditableCode(rawContent || (content ? content.replace(/^\s*\d+\s*\|\s*/gm, '') : ''));
  }, [fileName, rawContent, content]);

  const handleCopy = () => {
    const textToCopy = isEditing ? editableCode : (rawContent || content || '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!fileName || !onSave) return;
    setIsSaving(true);
    try {
      await onSave(fileName, editableCode);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2 font-semibold text-gray-300">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="truncate font-mono">{fileName || 'No file selected'}</span>
          {isEditing && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
              Editing
            </span>
          )}
        </div>

        {fileName && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#21262d] transition-colors"
              title="Copy Code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            {onSave && (
              <>
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setEditableCode(rawContent || (content ? content.replace(/^\s*\d+\s*\|\s*/gm, '') : ''));
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] text-gray-200 hover:text-white px-2.5 py-1 rounded border border-[#30363d] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#21262d] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded shadow transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Editor / Viewer Body */}
      <div className="flex-1 overflow-auto bg-[#0d1117] rounded-lg p-3 font-mono border border-[#30363d]/40">
        {!fileName ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs">
            Select a file from the repository to view or edit its source code.
          </div>
        ) : isEditing ? (
          <textarea
            value={editableCode}
            onChange={(e) => setEditableCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full bg-transparent text-gray-200 font-mono text-xs leading-relaxed focus:outline-none resize-none"
          />
        ) : (
          <pre className="text-gray-300 whitespace-pre leading-relaxed font-mono text-xs select-text">
            {content || 'Empty file.'}
          </pre>
        )}
      </div>
    </div>
  );
};
