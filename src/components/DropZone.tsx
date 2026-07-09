import { useCallback, useRef, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { ALLOWED_TYPES, MAX_FILE_SIZE, formatFileSize } from '@/utils/github';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function DropZone({ onFilesSelected, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`不支持的文件类型: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`文件过大 (${formatFileSize(file.size)}), 最大支持 ${formatFileSize(MAX_FILE_SIZE)}: ${file.name}`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) setSelectedFiles((prev) => [...prev, ...files]);
  }, [disabled, validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = validateFiles(e.target.files);
      if (files.length > 0) setSelectedFiles((prev) => [...prev, ...files]);
      e.target.value = '';
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-300 select-none
          ${isDragOver
            ? 'border-neon-cyan bg-neon-cyan/5 animate-glow-pulse'
            : 'border-gray-700 hover:border-gray-500 bg-dark-700/50'
          }
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
        `}
      >
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
            ${isDragOver ? 'bg-neon-cyan/10 text-neon-cyan' : 'bg-dark-500 text-gray-400'}
          `}>
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="font-mono text-sm text-gray-300 mb-1">
              {isDragOver ? '释放以上传文件' : '拖拽文件到此处 或 点击选择'}
            </p>
            <p className="font-mono text-[11px] text-gray-600">
              支持 PNG / JPG / WebP / GIF / SVG / MP3 / MP4 / WebM
            </p>
            <p className="font-mono text-[11px] text-gray-600">
              单文件最大 {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="animate-slide-up glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs text-gray-400">
              已选择 {selectedFiles.length} 个文件
            </p>
            <button
              onClick={handleUpload}
              disabled={disabled}
              className="font-mono text-xs px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 
                         text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-40 transition-all duration-200"
            >
              开始上传
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-600/50 border border-gray-800"
              >
                <File className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-300 truncate">{file.name}</p>
                  <p className="font-mono text-[10px] text-gray-600">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}