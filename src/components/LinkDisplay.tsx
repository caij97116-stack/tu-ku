import { useState } from 'react';
import { Copy, Check, ExternalLink, Server, Globe } from 'lucide-react';

interface LinkDisplayProps {
  rawUrl: string;
  cdnUrl: string;
}

type LinkType = 'raw' | 'cdn';

export default function LinkDisplay({ rawUrl, cdnUrl }: LinkDisplayProps) {
  const [activeLink, setActiveLink] = useState<LinkType>('cdn');
  const [copied, setCopied] = useState(false);

  const currentUrl = activeLink === 'cdn' ? cdnUrl : rawUrl;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = currentUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-slide-up glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex bg-dark-600 rounded-lg p-0.5">
          <button
            onClick={() => setActiveLink('cdn')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs transition-all duration-200
              ${activeLink === 'cdn'
                ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <Server className="w-3 h-3" />
            jsDelivr CDN
          </button>
          <button
            onClick={() => setActiveLink('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs transition-all duration-200
              ${activeLink === 'raw'
                ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <Globe className="w-3 h-3" />
            Raw
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-dark-900 rounded-lg px-3 py-2.5 border border-gray-800 overflow-hidden">
          <p className="font-mono text-[11px] text-gray-400 truncate select-all">
            {currentUrl}
          </p>
        </div>
        <button
          onClick={copyToClipboard}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-mono text-xs font-medium
            transition-all duration-200
            ${copied
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20'
            }
            ${copied ? 'animate-copy-pulse' : ''}
          `}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              复制链接
            </>
          )}
        </button>
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-mono text-xs
                     text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-200
                     transition-all duration-200"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <p className="font-mono text-[10px] text-gray-600">
        {activeLink === 'cdn'
          ? 'jsDelivr 提供全球 CDN 加速，但可能有缓存延迟'
          : 'Raw 链接即时可用，但无 CDN 加速'
        }
      </p>
    </div>
  );
}