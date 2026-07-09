import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Loader2, RefreshCw, Image, File, Music, Video } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { fetchRepoFiles, formatFileSize, type RepoFile } from '@/utils/github';
import FileDetail from '@/components/FileDetail';

function getTypeIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff'].includes(ext || '')) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(ext || '')) return 'audio';
  return 'file';
}

export default function FileBrowser() {
  const { config, isConfigured } = useStore();
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<RepoFile | null>(null);

  const loadFiles = useCallback(async () => {
    if (!isConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRepoFiles(config.owner, config.repo, config.branch, config.path);
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, config]);

  useEffect(() => {
    if (isConfigured) loadFiles();
  }, [isConfigured, loadFiles]);

  const handleDelete = useCallback((filePath: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== filePath));
    setSelectedFile(null);
  }, []);

  if (!isConfigured) {
    return (
      <div className="glass-card p-8 text-center">
        <FolderOpen className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="font-mono text-xs text-gray-600">请先配置 GitHub 仓库信息</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-xs text-gray-400">仓库文件</span>
          <span className="font-mono text-[10px] text-gray-700">({files.length})</span>
        </div>
        <button
          onClick={loadFiles}
          disabled={loading}
          className="p-1.5 rounded-lg text-gray-600 hover:text-neon-cyan hover:bg-neon-cyan/5 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && files.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
          <span className="font-mono text-xs text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-center">
          <p className="font-mono text-xs text-red-400">{error}</p>
          <button
            onClick={loadFiles}
            className="font-mono text-[10px] text-neon-cyan hover:underline mt-1"
          >
            重试
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="p-8 text-center">
          <FolderOpen className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="font-mono text-xs text-gray-600">仓库中暂无文件</p>
          <p className="font-mono text-[10px] text-gray-700 mt-1">上传文件后会自动出现在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 max-h-96 overflow-y-auto">
          {files.map((file) => {
            const type = getTypeIcon(file.name);
            const isImage = type === 'image';
            return (
              <button
                key={file.sha}
                onClick={() => setSelectedFile(file)}
                className="group relative aspect-square rounded-lg bg-dark-600 border border-gray-800 
                           hover:border-neon-cyan/40 overflow-hidden transition-all duration-200"
              >
                {isImage ? (
                  <img
                    src={file.cdnUrl}
                    alt={file.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                    {type === 'video' && <Video className="w-6 h-6 text-gray-500" />}
                    {type === 'audio' && <Music className="w-6 h-6 text-gray-500" />}
                    {type === 'file' && <File className="w-6 h-6 text-gray-500" />}
                    <span className="font-mono text-[9px] text-gray-600 text-center leading-tight line-clamp-2 break-all">
                      {file.name}
                    </span>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="font-mono text-[10px] text-white">{formatFileSize(file.size)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* File detail modal */}
      {selectedFile && (
        <FileDetail
          file={selectedFile}
          config={config}
          onClose={() => setSelectedFile(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}