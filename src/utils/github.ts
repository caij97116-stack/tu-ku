import type { GitHubConfig, UploadRecord } from '@/stores/useStore';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export async function checkBackendStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

export async function uploadFile(
  file: File,
  config: GitHubConfig,
  onProgress?: (progress: number) => void
): Promise<UploadRecord> {
  const { owner, repo, branch, path } = config;

  // Read file as base64 (without data: prefix)
  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 30));
      }
    };
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });

  if (onProgress) onProgress(40);

  // Send to Vercel backend
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: base64Content,
      fileName: file.name,
      fileType: file.type,
      owner,
      repo,
      branch,
      path,
    }),
  });

  if (onProgress) onProgress(80);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = (errData as { error?: string }).error || `上传失败 (HTTP ${response.status})`;
    throw new Error(msg);
  }

  if (onProgress) onProgress(100);

  const data = await response.json() as {
    rawUrl: string;
    cdnUrl: string;
    filePath: string;
    fileName: string;
    fileType: string;
  };

  // Generate thumbnail for images
  let thumbnailUrl: string | undefined;
  if (file.type.startsWith('image/')) {
    thumbnailUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  return {
    id: generateId(),
    fileName: data.fileName,
    fileType: data.fileType || 'unknown',
    fileSize: file.size,
    rawUrl: data.rawUrl,
    cdnUrl: data.cdnUrl,
    uploadedAt: new Date().toISOString(),
    thumbnailUrl,
  };
}

export interface RepoFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  rawUrl: string;
  cdnUrl: string;
}

export async function fetchRepoFiles(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<RepoFile[]> {
  const params = new URLSearchParams({ owner, repo, branch, path });
  const res = await fetch(`/api/files?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || '获取文件列表失败');
  }
  return res.json();
}

export async function deleteRepoFile(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  sha: string
): Promise<void> {
  const res = await fetch('/api/files', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, repo, branch, filePath, sha }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || '删除失败');
  }
}

export const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB