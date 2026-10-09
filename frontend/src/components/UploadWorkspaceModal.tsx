import React, { useState, useRef } from 'react';
import { UploadCloud, FolderArchive, FileCode, X, Loader2, CheckCircle2, AlertCircle, Folder } from 'lucide-react';

interface UploadWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceUploaded: (repoPath: string, repoName: string) => void;
  apiBase: string;
}

export const UploadWorkspaceModal: React.FC<UploadWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onWorkspaceUploaded,
  apiBase
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleZipUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    if (workspaceName.trim()) {
      formData.append('workspace_name', workspaceName.trim());
    }

    try {
      const res = await fetch(`${apiBase}/api/repo/upload_zip`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload ZIP archive.');
      }

      setSuccessMsg(`Extracted '${file.name}' into workspace '${data.name}'!`);
      setTimeout(() => {
        onWorkspaceUploaded(data.path, data.name);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error occurred while uploading ZIP archive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    const relativePaths: string[] = [];

    Array.from(fileList).forEach((file) => {
      formData.append('files', file);
      // @ts-ignore - webkitRelativePath exists on folder uploads
      const rel = file.webkitRelativePath || file.name;
      relativePaths.push(rel);
    });

    formData.append('paths', JSON.stringify(relativePaths));
    if (workspaceName.trim()) {
      formData.append('workspace_name', workspaceName.trim());
    }

    try {
      const res = await fetch(`${apiBase}/api/repo/upload_files`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload files.');
      }

      setSuccessMsg(`Uploaded ${fileList.length} files into workspace '${data.name}'!`);
      setTimeout(() => {
        onWorkspaceUploaded(data.path, data.name);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error occurred during files upload.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 1 && files[0].name.endsWith('.zip')) {
        handleZipUpload(files[0]);
      } else {
        handleFilesUpload(files);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <UploadCloud className="w-4 h-4" />
            </div>
            <span>Drag & Drop / Upload Codebase</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-gray-300 font-medium">Workspace Name (Optional)</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. my_project_app"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>

          {/* Drag and drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragOver
                ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                : 'border-[#30363d] hover:border-gray-500 bg-[#0d1117]'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-full text-blue-400 shadow-inner">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Drag & Drop project files or ZIP archive here
                </p>
                <p className="text-gray-400 text-[11px]">
                  Supports .zip packages, multi-file codebases, or full folder trees
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 px-3 py-1.5 rounded-lg border border-[#30363d] transition-colors"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Select ZIP File</span>
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 px-3 py-1.5 rounded-lg border border-[#30363d] transition-colors"
                >
                  <Folder className="w-3.5 h-3.5 text-blue-400" />
                  <span>Select Folder</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleZipUpload(e.target.files[0]);
                  }
                }}
              />

              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                directory="true"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesUpload(e.target.files);
                  }
                }}
              />
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#30363d] bg-[#0d1117]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg border border-[#30363d] text-gray-300 hover:text-white hover:bg-[#21262d] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
