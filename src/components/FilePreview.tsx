import { File, Image, Music, Video } from 'lucide-react';
import { formatFileSize } from '@/utils/github';

interface FilePreviewProps {
  fileName: string;
  fileType: string;
  fileSize: number;
  rawUrl?: string;
  thumbnailUrl?: string;
}

function getTypeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

export default function FilePreview({ fileName, fileType, fileSize, rawUrl, thumbnailUrl }: FilePreviewProps) {
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');

  return (
    <div className="animate-slide-up glass-card overflow-hidden">
      {/* Preview area */}
      <div className="relative bg-dark-900/80 flex items-center justify-center min-h-[200px]">
        {isImage && (rawUrl || thumbnailUrl) && (
          <img
            src={rawUrl || thumbnailUrl}
            alt={fileName}
            className="max-w-full max-h-[300px] object-contain"
          />
        )}
        {isVideo && rawUrl && (
          <video
            src={rawUrl}
            controls
            className="max-w-full max-h-[300px]"
          />
        )}
        {isAudio && rawUrl && (
          <div className="p-8 w-full">
            <audio src={rawUrl} controls className="w-full" />
          </div>
        )}
        {!isImage && !isVideo && !isAudio && (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-600">
            <File className="w-12 h-12" />
            <span className="font-mono text-xs">二进制文件</span>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="px-4 py-3 flex items-center gap-3 border-t border-gray-800">
        <span className="text-gray-500">{getTypeIcon(fileType)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-gray-300 truncate">{fileName}</p>
          <p className="font-mono text-[10px] text-gray-600">{formatFileSize(fileSize)} · {fileType}</p>
        </div>
      </div>
    </div>
  );
}