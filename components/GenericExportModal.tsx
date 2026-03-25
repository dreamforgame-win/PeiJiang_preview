"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Check, Download } from 'lucide-react';

interface GenericExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; name: string; subtitle?: string; isCollected?: boolean }[];
  onExport: (selectedIds: string[]) => void;
  renderPreview?: (item: any) => React.ReactNode;
}

export default function GenericExportModal({ 
  isOpen, 
  onClose, 
  title, 
  items, 
  onExport,
  renderPreview 
}: GenericExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'collected'>('all');
  const [longPressedItem, setLongPressedItem] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [touchPos, setTouchPos] = useState<{ x: number, y: number } | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const displayItems = filterMode === 'all' ? items : items.filter(item => item.isCollected);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSelectedIds([]);
        setFilterMode('all');
      }, 0);
    }
  }, [isOpen]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(displayItems.map(t => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleTouchStart = (e: React.MouseEvent | React.TouchEvent, item: any) => {
    if (!renderPreview) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setTouchPos({ x: clientX, y: clientY });
    setProgress(0);
    startTimeRef.current = null;

    const duration = 600;

    const updateProgress = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        progressTimerRef.current = requestAnimationFrame(updateProgress);
      } else {
        setLongPressedItem(item);
        setTouchPos(null);
        setProgress(0);
      }
    };

    progressTimerRef.current = requestAnimationFrame(updateProgress);
  };

  const handleTouchEnd = () => {
    if (progressTimerRef.current) {
      cancelAnimationFrame(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setTouchPos(null);
    setProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Progress Indicator */}
      {touchPos && (
        <div 
          className="fixed pointer-events-none z-[200]"
          style={{ left: touchPos.x - 25, top: touchPos.y - 25 }}
        >
          <svg className="w-[50px] h-[50px] -rotate-90 drop-shadow-lg">
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="rgba(0,0,0,0.3)"
              className="text-white/20"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - progress / 100)}
              className="text-primary transition-all duration-75"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-outline-variant/20">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">{title}</h2>
            <p className="text-xs text-outline mt-1 font-bold uppercase tracking-wider">
              选择要导出的项目 {renderPreview && "(长按查看详情)"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-6 h-6 text-outline" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-surface">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 p-1 bg-surface-container-high rounded-lg">
              <button 
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'all' ? 'bg-primary text-white shadow-sm' : 'text-on-surface hover:bg-surface-container-highest'}`}
              >
                全部 ({items.length})
              </button>
              <button 
                onClick={() => setFilterMode('collected')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'collected' ? 'bg-primary text-white shadow-sm' : 'text-on-surface hover:bg-surface-container-highest'}`}
              >
                已收录 ({items.filter(i => i.isCollected).length})
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSelectAll}
                className="text-xs font-bold px-4 py-2 bg-surface-container-high text-on-surface rounded-md hover:bg-surface-container-highest transition-all border border-outline-variant/10"
              >
                全选
              </button>
              <button 
                onClick={handleDeselectAll}
                className="text-xs font-bold px-4 py-2 bg-surface-container-high text-on-surface rounded-md hover:bg-surface-container-highest transition-all border border-outline-variant/10"
              >
                取消全选
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayItems.map((item) => (
              <div 
                key={item.id}
                onMouseDown={(e) => handleTouchStart(e, item)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={(e) => handleTouchStart(e, item)}
                onTouchEnd={handleTouchEnd}
                onClick={() => handleToggleSelect(item.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                  selectedIds.includes(item.id) 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-outline-variant/20 hover:border-primary/50 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{item.name}</p>
                  {item.subtitle && <p className="text-[10px] text-outline font-bold uppercase mt-0.5">{item.subtitle}</p>}
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedIds.includes(item.id) 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-outline-variant/40 group-hover:border-primary/60'
                }`}>
                  {selectedIds.includes(item.id) && <Check className="w-4 h-4" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-between items-center">
          <p className="text-sm font-bold text-outline">已选择 {selectedIds.length} 个项目</p>
          <button 
            disabled={selectedIds.length === 0}
            onClick={() => onExport(selectedIds)}
            className={`px-8 py-3 rounded-md font-bold shadow-lg transition-all flex items-center gap-2 ${
              selectedIds.length > 0 
                ? 'bg-primary text-white hover:shadow-xl transform hover:-translate-y-0.5' 
                : 'bg-surface-container-highest text-outline cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            立即导出
          </button>
        </div>
      </div>

      {/* Long Press Detail View */}
      {longPressedItem && renderPreview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setLongPressedItem(null)}>
          <div className="bg-surface w-full max-w-4xl rounded-2xl shadow-2xl p-8 border border-outline-variant/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-3xl font-black text-on-surface font-headline">{longPressedItem.name}</h3>
              <button onClick={() => setLongPressedItem(null)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <X className="w-6 h-6 text-outline" />
              </button>
            </div>
            
            {renderPreview(longPressedItem)}

            <button 
              onClick={() => setLongPressedItem(null)}
              className="mt-8 w-full py-3 bg-primary text-white font-bold rounded-md hover:shadow-lg transition-all"
            >
              关闭预览
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
