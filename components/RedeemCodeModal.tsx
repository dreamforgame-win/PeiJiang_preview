"use client";

import React, { useState } from 'react';
import { X, Ticket } from 'lucide-react';

interface RedeemCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
}

export default function RedeemCodeModal({ isOpen, onClose, onConfirm }: RedeemCodeModalProps) {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm p-6 relative border border-outline-variant/20">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-black text-on-surface font-headline">兑换码</h3>
          <p className="text-xs text-outline font-medium mt-1 uppercase tracking-widest">请输入您的兑换码或通行密码</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input 
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="输入密码..."
              className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-center font-mono tracking-widest"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm(code);
              }}
              autoFocus
            />
          </div>
          
          <button 
            onClick={() => onConfirm(code)}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform active:scale-95 transition-all"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
