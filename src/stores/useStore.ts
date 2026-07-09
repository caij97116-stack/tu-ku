import { create } from 'zustand';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface UploadRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rawUrl: string;
  cdnUrl: string;
  uploadedAt: string;
  thumbnailUrl?: string;
}

interface UploadingFile {
  fileName: string;
  progress: number;
}

interface AppState {
  // Config
  config: GitHubConfig;
  setConfig: (config: GitHubConfig) => void;
  isConfigured: boolean;

  // Backend status
  backendConfigured: boolean | null;
  setBackendConfigured: (status: boolean) => void;

  // Upload state
  isUploading: boolean;
  uploadingFiles: UploadingFile[];
  error: string | null;
  setUploading: (files: UploadingFile[] | ((prev: UploadingFile[]) => UploadingFile[])) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Current upload results
  currentRecords: UploadRecord[];
  setCurrentRecords: (records: UploadRecord[]) => void;
  clearCurrentRecords: () => void;

  // History
  history: UploadRecord[];
  addToHistory: (records: UploadRecord[]) => void;
  clearHistory: () => void;
}

const DEFAULT_CONFIG: GitHubConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  path: 'uploads/',
};

function loadConfig(): GitHubConfig {
  try {
    const stored = localStorage.getItem('upgo-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Remove legacy token field if present
      delete parsed.token;
      return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}

function loadHistory(): UploadRecord[] {
  try {
    const stored = localStorage.getItem('upgo-history');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveConfig(config: GitHubConfig) {
  localStorage.setItem('upgo-config', JSON.stringify(config));
}

function saveHistory(history: UploadRecord[]) {
  localStorage.setItem('upgo-history', JSON.stringify(history.slice(0, 50)));
}

export const useStore = create<AppState>((set, get) => ({
  config: loadConfig(),
  setConfig: (config) => {
    saveConfig(config);
    set({ config, isConfigured: !!(config.owner && config.repo) });
  },
  isConfigured: (() => {
    const c = loadConfig();
    return !!(c.owner && c.repo);
  })(),

  backendConfigured: null,
  setBackendConfigured: (status) => set({ backendConfigured: status }),

  isUploading: false,
  uploadingFiles: [],
  error: null,
  setUploading: (files) => {
    if (typeof files === 'function') {
      set((state) => {
        const newFiles = files(state.uploadingFiles);
        return { isUploading: newFiles.length > 0, uploadingFiles: newFiles };
      });
    } else {
      set({ isUploading: files.length > 0, uploadingFiles: files });
    }
  },
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  currentRecords: [],
  setCurrentRecords: (records) => set({ currentRecords: records }),
  clearCurrentRecords: () => set({ currentRecords: [] }),

  history: loadHistory(),
  addToHistory: (records) => {
    const state = get();
    const newHistory = [...records, ...state.history].slice(0, 50);
    saveHistory(newHistory);
    set({ history: newHistory });
  },
  clearHistory: () => {
    localStorage.removeItem('upgo-history');
    set({ history: [] });
  },
}));