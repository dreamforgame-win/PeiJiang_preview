"use client";

import { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  items: any[];
  title: string;
  placeholder?: string;
}

export default function SelectionModal({ isOpen, onClose, onSelect, items, title, placeholder }: SelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.faction && (item.faction || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.type && (item.type || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="text-xl font-black text-on-surface font-headline">{title}</h3>
          <button onClick={onClose} className="text-outline hover:text-on-surface p-1 hover:bg-surface-container-high rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 bg-surface-container-low">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder={placeholder || "搜索..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
              autoFocus
            />
            <Search className="absolute left-3 text-outline w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all flex justify-between items-center group"
              >
                <div>
                  <span className="font-bold">{item.name}</span>
                  {item.season && item.season !== 'S1' && (
                    <span className="ml-1 text-[8px] px-1 bg-surface-container-highest text-outline rounded font-bold align-middle">
                      {item.season}
                    </span>
                  )}
                  {item.faction && <span className="ml-2 text-xs opacity-60">[{item.faction}]</span>}
                  {item.type && <span className="ml-2 text-xs opacity-60">[{item.type}]</span>}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-outline italic">
              未找到匹配项
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
