"use client";

import { X } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  isCollected?: boolean;
  onToggleCollect?: () => void;
}

export default function DetailModal({ isOpen, onClose, title, children, isCollected, onToggleCollect }: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-outline hover:text-on-surface">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-black text-on-surface mb-4 font-headline">{title}</h3>
        <div className="mb-6">
          {children}
        </div>
        {onToggleCollect !== undefined && (
          <button 
            onClick={onToggleCollect}
            className={`w-full py-3 rounded-lg font-bold transition-all ${isCollected ? 'bg-outline-variant text-on-surface' : 'bg-primary text-white'}`}
          >
            {isCollected ? '取消收录' : '收录到仓库'}
          </button>
        )}
      </div>
    </div>
  );
}
