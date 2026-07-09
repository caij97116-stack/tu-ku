import { useState, useCallback, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import DropZone from '@/components/DropZone';
import FilePreview from '@/components/FilePreview';
import LinkDisplay from '@/components/LinkDisplay';
import ConfigPanel from '@/components/ConfigPanel';
import HistoryList from '@/components/HistoryList';
import FileBrowser from '@/components/FileBrowser';
import { useStore } from '@/stores/useStore';
import { uploadFile, checkBackendStatus } from '@/utils/github';

export default function Home() {
  const {
    config,
    isConfigured,
    isUploading,
    uploadingFiles,
    error,
    backendConfigured,
    setUploading,
    setError,
    clearError,
    setBackendConfigured,
    currentRecords,
    setCurrentRecords,
    addToHistory,
  } = useStore();

  const [browserKey, setBrowserKey] = useState(0);

  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus().then(setBackendConfigured);
  }, [setBackendConfigured]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (!isConfigured) {
      setError('请先在下方配置 GitHub 仓库信息（用户名和仓库名）');
      return;
    }

    clearError();
    setCurrentRecords([]);

    const uploading = files.map((f) => ({ fileName: f.name, progress: 0 }));
    setUploading(uploading);

    const results = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const record = await uploadFile(files[i], config, (progress) => {
          setUploading((prev) =>
            prev.map((uf, idx) => (idx === i ? { ...uf, progress } : uf))
          );
        });
        results.push(record);
        setUploading((prev) =>
          prev.map((uf, idx) => (idx === i ? { ...uf, progress: 100 } : uf))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : '上传失败';
        setError(`${files[i].name}: ${msg}`);
        setUploading((prev) =>
          prev.map((uf, idx) => (idx === i ? { ...uf, progress: -1 } : uf))
        );
      }
    }

    setUploading([]);

    if (results.length > 0) {
      setCurrentRecords(results);
      addToHistory(results);
      setBrowserKey((k) => k + 1); // refresh file browser
    }
  }, [isConfigured, config, setUploading, setError, clearError, setCurrentRecords, addToHistory]);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <Header />

        {/* Backend status warning */}
        {backendConfigured === false && (
          <div className="animate-slide-up mb-6 glass-card p-4 border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-xs text-yellow-400">
                  Vercel 后端未检测到 GITHUB_TOKEN 环境变量
                </p>
                <p className="font-mono text-[10px] text-yellow-500/70 mt-1">
                  请在 Vercel 项目 Settings → Environment Variables 中添加 GITHUB_TOKEN
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload area */}
        <section className="mb-6">
          <DropZone onFilesSelected={handleFilesSelected} disabled={isUploading} />
        </section>

        {/* Error */}
        {error && (
          <div className="animate-slide-up mb-6 glass-card p-4 border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-xs text-red-400">{error}</p>
                <button
                  onClick={clearError}
                  className="font-mono text-[10px] text-red-500/70 hover:text-red-400 mt-1 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploadingFiles.length > 0 && (
          <div className="mb-6 glass-card p-4 space-y-3 animate-slide-up">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
              <span className="font-mono text-xs text-gray-400">正在上传...</span>
            </div>
            {uploadingFiles.map((file, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] text-gray-400 truncate mr-4">{file.fileName}</p>
                  <span className={`font-mono text-[10px] shrink-0 ${
                    file.progress === -1 ? 'text-red-400' :
                    file.progress === 100 ? 'text-green-400' : 'text-neon-cyan'
                  }`}>
                    {file.progress === -1 ? '失败' : `${file.progress}%`}
                  </span>
                </div>
                <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      file.progress === -1 ? 'bg-red-500' :
                      file.progress === 100 ? 'bg-green-500' :
                      'bg-gradient-to-r from-neon-cyan to-neon-purple'
                    }`}
                    style={{ width: `${file.progress === -1 ? 100 : file.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {currentRecords.length > 0 && (
          <section className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-neon-cyan animate-neon-flicker">UPLOAD SUCCESS</span>
              <span className="font-mono text-[10px] text-gray-600">{currentRecords.length} 个文件</span>
            </div>
            {currentRecords.map((record) => (
              <div key={record.id} className="space-y-3">
                <FilePreview
                  fileName={record.fileName}
                  fileType={record.fileType}
                  fileSize={record.fileSize}
                  rawUrl={record.rawUrl}
                  thumbnailUrl={record.thumbnailUrl}
                />
                <LinkDisplay rawUrl={record.rawUrl} cdnUrl={record.cdnUrl} />
              </div>
            ))}
          </section>
        )}

        {/* File Browser - 仓库文件画廊 */}
        <section className="mb-6">
          <FileBrowser key={browserKey} />
        </section>

        {/* Config */}
        <section className="mb-6">
          <ConfigPanel />
        </section>

        {/* History */}
        <section className="mb-6">
          <HistoryList />
        </section>

        {/* Footer */}
        <footer className="text-center pt-8">
          <p className="font-mono text-[10px] text-gray-700">
            UpGo · 基于 GitHub API + Vercel 的文件直链生成器
          </p>
          <p className="font-mono text-[10px] text-gray-800 mt-1">
            Token 存储在 Vercel 后端，前端不会暴露敏感信息
          </p>
        </footer>
      </div>
    </div>
  );
}