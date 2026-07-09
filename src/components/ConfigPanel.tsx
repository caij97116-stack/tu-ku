import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, User, FolderGit2, GitBranch, Folder, Server } from 'lucide-react';
import { useStore, type GitHubConfig } from '@/stores/useStore';

export default function ConfigPanel() {
  const { config, setConfig, backendConfigured } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<GitHubConfig>(config);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (field: keyof GitHubConfig, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-xs text-gray-400">GitHub 配置</span>
          {!config.owner && !config.repo && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              未配置
            </span>
          )}
          {backendConfigured !== null && (
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
              backendConfigured
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <Server className="w-3 h-3 inline mr-1" />
              {backendConfigured ? '后端已连接' : '后端未连接'}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
      </button>

      {isOpen && (
        <div className="animate-fade-in px-4 pb-4 space-y-3 border-t border-gray-800/50 pt-3">
          {/* Vercel backend info */}
          <div className="bg-dark-900/50 rounded-lg p-3 border border-neon-cyan/10">
            <p className="font-mono text-[10px] text-neon-cyan/70 leading-relaxed">
              Token 已迁移至 Vercel 后端，更安全。请在 Vercel 项目设置中添加环境变量 <code className="text-neon-cyan bg-neon-cyan/5 px-1 rounded">GITHUB_TOKEN</code>。
            </p>
          </div>

          {/* Owner */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-gray-500">
              <User className="w-3 h-3" /> GitHub 用户名
            </label>
            <input
              type="text"
              value={form.owner}
              onChange={(e) => updateField('owner', e.target.value)}
              placeholder="your-username"
              className="w-full font-mono text-xs bg-dark-900 border border-gray-700 rounded-lg px-3 py-2.5
                         text-gray-300 placeholder-gray-700 focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
          </div>

          {/* Repo */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-gray-500">
              <FolderGit2 className="w-3 h-3" /> 仓库名
            </label>
            <input
              type="text"
              value={form.repo}
              onChange={(e) => updateField('repo', e.target.value)}
              placeholder="my-repo"
              className="w-full font-mono text-xs bg-dark-900 border border-gray-700 rounded-lg px-3 py-2.5
                         text-gray-300 placeholder-gray-700 focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Branch */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[11px] text-gray-500">
                <GitBranch className="w-3 h-3" /> 分支
              </label>
              <input
                type="text"
                value={form.branch}
                onChange={(e) => updateField('branch', e.target.value)}
                placeholder="main"
                className="w-full font-mono text-xs bg-dark-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-gray-300 placeholder-gray-700 focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
            </div>

            {/* Path */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[11px] text-gray-500">
                <Folder className="w-3 h-3" /> 存储路径
              </label>
              <input
                type="text"
                value={form.path}
                onChange={(e) => updateField('path', e.target.value)}
                placeholder="uploads/"
                className="w-full font-mono text-xs bg-dark-900 border border-gray-700 rounded-lg px-3 py-2.5
                           text-gray-300 placeholder-gray-700 focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className={`w-full font-mono text-xs py-2.5 rounded-lg font-medium transition-all duration-200
              ${saved
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20'
              }`}
          >
            {saved ? '已保存' : '保存配置'}
          </button>
        </div>
      )}
    </div>
  );
}