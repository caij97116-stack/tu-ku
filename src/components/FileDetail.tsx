import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Trash2, Image, File, Music, Video, Loader2 } from 'lucide-react';
import { formatFileSize, deleteRepoFile, type RepoFile } from '@/utils/github';
import type { GitHubConfig } from '@/stores/useStore';

interface FileDetailProps {
  file: RepoFile;
  config: GitHubConfig;
  onClose: () => void;
  onDelete: (filePath: string) => void;
}

function getTypeIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff'].includes(ext || '')) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(ext || '')) return 'audio';
  return 'file';
}

export default function FileDetail({ file, config, onClose, onDelete }: FileDetailProps) {
  const [copied, setCopied] = useState<'cdn' | 'raw' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'cdn' | 'raw'>('cdn');
  const type = getTypeIcon(file.name);
  const isImage = type === 'image';
  const isVideo = type === 'video';
  const isAudio = type === 'audio';

  const currentUrl = activeTab === 'cdn' ? file.cdnUrl : file.rawUrl;

  const copyLink = async (kind: 'cdn' | 'raw') => {
    const url = kind === 'cdn' ? file.cdnUrl : file.rawUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除「${file.name}」吗？此操作不可撤销。`)) return;
    setDeleting(true);
    try {
      await deleteRepoFile(config.owner, config.repo, config.branch, file.path, file.sha);
      onDelete(file.path);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="gradient-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="relative bg-dark-800 rounded-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Preview */}
          <div className="bg-dark-900/80 flex items-center justify-center min-h-[200px] rounded-t-xl">
            {isImage && (
              <img src={file.cdnUrl} alt={file.name} className="max-w-full max-h-[350px] object-contain" />
            )}
            {isVideo && (
              <video src={file.rawUrl} controls className="max-w-full max-h-[350px]" />
            )}
            {isAudio && (
              <div className="p-8 w-full">
                <audio src={file.rawUrl} controls className="w-full" />
              </div>
            )}
            {!isImage && !isVideo && !isAudio && (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
                <File className="w-12 h-12" />
                <span className="font-mono text-xs">二进制文件</span>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                {type === 'image' && <Image className="w-4 h-4" />}
                {type === 'video' && <Video className="w-4 h-4" />}
                {type === 'audio' && <Music className="w-4 h-4" />}
                {type === 'file' && <File className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-gray-300 truncate">{file.name}</p>
                <p className="font-mono text-[10px] text-gray-600">{formatFileSize(file.size)}</p>
              </div>
            </div>

            {/* Link tabs */}
            <div className="flex bg-dark-600 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('cdn')}
                className={`flex-1 py-1.5 rounded-md font-mono text-xs transition-all ${
                  activeTab === 'cdn' ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-gray-500'
                }`}
              >
                CDN 链接
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`flex-1 py-1.5 rounded-md font-mono text-xs transition-all ${
                  activeTab === 'raw' ? 'bg-neon-purple/10 text-neon-purple' : 'text-gray-500'
                }`}
              >
                Raw 链接
              </button>
            </div>

            {/* URL display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-dark-900 rounded-lg px-3 py-2.5 border border-gray-800 overflow-hidden">
                <p className="font-mono text-[11px] text-gray-400 truncate select-all">{currentUrl}</p>
              </div>
              <button
                onClick={() => copyLink('cdn')}
                className={`shrink-0 px-3 py-2.5 rounded-lg font-mono text-xs transition-all ${
                  copied === 'cdn'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20'
                }`}
              >
                {copied === 'cdn' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-2.5 rounded-lg text-gray-400 border border-gray-700 hover:border-gray-500 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-xs
                         bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20
                         disabled:opacity-50 transition-all duration-200"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {deleting ? '删除中...' : '删除文件'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}