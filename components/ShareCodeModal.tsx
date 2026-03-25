"use client";

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string;
}

export default function ShareCodeModal({ isOpen, onClose, shareCode }: ShareCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <div>
            <h2 className="text-xl font-black text-on-surface font-headline">生成完成</h2>
            <p className="text-xs text-outline mt-1 font-bold uppercase tracking-wider">分享码已生成</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-6 h-6 text-outline" />
          </button>
        </div>

        <div className="p-6 space-y-4 bg-surface">
          <p className="text-sm font-bold text-on-surface-variant">
            您可以复制以下分享码发送给其他玩家，他们可以通过导入界面的解析功能导入该阵容。
          </p>
          <div className="relative">
            <textarea
              readOnly
              value={shareCode}
              className="w-full h-32 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-xs font-mono text-on-surface resize-none focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={handleCopy}
              className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-primary text-white hover:bg-primary/90 hover:shadow-md'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '复制成功' : '复制分享码'}
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-surface-container-highest text-on-surface rounded-md font-bold hover:bg-outline-variant/50 transition-all"
          >
            关闭界面
          </button>
        </div>
      </div>
    </div>
  );
}
