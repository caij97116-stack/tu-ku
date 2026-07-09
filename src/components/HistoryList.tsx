import { useState } from 'react';
import { Copy, Check, ExternalLink, Trash2, Clock, Image, File, Music, Video } from 'lucide-react';
import { useStore, type UploadRecord } from '@/stores/useStore';
import { formatFileSize } from '@/utils/github';

function getTypeIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="w-3.5 h-3.5" />;
  if (fileType.startsWith('video/')) return <Video className="w-3.5 h-3.5" />;
  if (fileType.startsWith('audio/')) return <Music className="w-3.5 h-3.5" />;
  return <File className="w-3.5 h-3.5" />;
}

export default function HistoryList() {
  const { history, clearHistory } = useStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (history.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Clock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="font-mono text-xs text-gray-600">暂无上传记录</p>
        <p className="font-mono text-[10px] text-gray-700 mt-1">上传文件后会自动记录在此</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-xs text-gray-400">上传历史</span>
          <span className="font-mono text-[10px] text-gray-700">({history.length})</span>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1 font-mono text-[10px] text-gray-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          清空
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {history.map((record: UploadRecord) => (
          <div
            key={record.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/20 hover:bg-white/[0.01] transition-colors"
          >
            {/* Thumbnail or icon */}
            <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center shrink-0 overflow-hidden">
              {record.thumbnailUrl ? (
                <img src={record.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-600">{getTypeIcon(record.fileType)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-gray-300 truncate">{record.fileName}</p>
              <p className="font-mono text-[10px] text-gray-600">
                {formatFileSize(record.fileSize)} · {new Date(record.uploadedAt).toLocaleString('zh-CN')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => copyLink(record.cdnUrl, record.id)}
                className={`p-2 rounded-lg transition-all duration-200
                  ${copiedId === record.id
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-gray-600 hover:text-neon-cyan hover:bg-neon-cyan/5'
                  }`}
                title="复制 CDN 链接"
              >
                {copiedId === record.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={record.cdnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200"
                title="在新标签页打开"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}