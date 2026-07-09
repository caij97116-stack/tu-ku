import { Upload, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="pt-10 pb-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="relative">
          <Zap className="w-8 h-8 text-neon-cyan animate-neon-flicker" />
          <div className="absolute inset-0 blur-md bg-neon-cyan/20 rounded-full" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-wider text-neon-glow">
          UP<span className="text-neon-purple">GO</span>
        </h1>
      </div>
      <p className="font-mono text-xs text-gray-500 tracking-widest uppercase">
        文件直链生成器 · GitHub 图床
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="inline-block w-12 h-px bg-gradient-to-r from-transparent to-neon-cyan/30" />
        <span className="font-mono text-[10px] text-gray-600 tracking-[0.2em]">
          DRAG &amp; DROP
        </span>
        <span className="inline-block w-12 h-px bg-gradient-to-l from-transparent to-neon-purple/30" />
      </div>
    </header>
  );
}