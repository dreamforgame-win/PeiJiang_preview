"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Check, Download, Swords, Shield, Zap, Book, Clock, BarChart2, Share2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: any[];
  onGenerateShareCode?: (selectedIds: string[]) => void;
}

export default function ExportModal({ isOpen, onClose, teams, onGenerateShareCode }: ExportModalProps) {
  const [progress, setProgress] = useState(0);
  const [touchPos, setTouchPos] = useState<{ x: number, y: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [longPressedTeam, setLongPressedTeam] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSelectedIds([]);
      }, 0);
    }
  }, [isOpen]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      (prev || []).includes(id) ? prev.filter(i => i !== id) : [...(prev || []), id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(teams.map(t => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleExport = () => {
    const selectedTeams = teams.filter(t => selectedIds.includes(t.id));
    const blob = new Blob([JSON.stringify(selectedTeams, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `teams_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleTouchStart = (e: React.MouseEvent | React.TouchEvent, team: any) => {
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
        setLongPressedTeam(team);
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
            <h2 className="text-2xl font-black text-on-surface font-headline">导出阵容</h2>
            <p className="text-xs text-outline mt-1 font-bold uppercase tracking-wider">选择要导出的阵容 (长按查看详情)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-6 h-6 text-outline" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-surface">
          <div className="flex gap-3 mb-4">
            <button 
              onClick={handleSelectAll}
              className="text-xs font-bold px-4 py-2 bg-surface-container-high text-on-surface rounded-md hover:bg-surface-container-highest transition-all"
            >
              全选
            </button>
            <button 
              onClick={handleDeselectAll}
              className="text-xs font-bold px-4 py-2 bg-surface-container-high text-on-surface rounded-md hover:bg-surface-container-highest transition-all"
            >
              取消全选
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((team) => (
              <div 
                key={team.id}
                onMouseDown={(e) => handleTouchStart(e, team)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={(e) => handleTouchStart(e, team)}
                onTouchEnd={handleTouchEnd}
                onClick={() => handleToggleSelect(team.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                  selectedIds.includes(team.id) 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-outline-variant/20 hover:border-primary/50 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{team.name}</p>
                  <p className="text-[10px] text-outline font-bold uppercase mt-0.5">{team.badge}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedIds.includes(team.id) 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-outline-variant/40 group-hover:border-primary/60'
                }`}>
                  {selectedIds.includes(team.id) && <Check className="w-4 h-4" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-between items-center">
          <p className="text-sm font-bold text-outline">已选择 {selectedIds.length} 个阵容</p>
          <div className="flex gap-3">
            {onGenerateShareCode && (
              <button 
                disabled={selectedIds.length === 0}
                onClick={() => onGenerateShareCode(selectedIds)}
                className={`px-6 py-3 rounded-md font-bold transition-all flex items-center gap-2 ${
                  selectedIds.length > 0 
                    ? 'bg-surface-container-highest text-on-surface hover:bg-outline-variant/50 transform hover:-translate-y-0.5' 
                    : 'bg-surface-container-highest text-outline cursor-not-allowed opacity-50'
                }`}
              >
                <Share2 className="w-4 h-4" />
                生成分享码
              </button>
            )}
            <button 
              disabled={selectedIds.length === 0}
              onClick={handleExport}
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
      </div>

      {/* Long Press Detail View */}
      {longPressedTeam && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setLongPressedTeam(null)}>
          <div className="bg-surface w-full max-w-4xl rounded-2xl shadow-2xl p-8 border border-outline-variant/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black text-on-surface font-headline">{longPressedTeam.name}</h3>
                  <span className="bg-primary text-white text-[10px] px-3 py-1 rounded-sm font-bold tracking-widest uppercase">
                    {longPressedTeam.badge}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant italic border-l-2 border-secondary pl-4 py-1">
                  {longPressedTeam.desc}
                </p>
              </div>
              <button onClick={() => setLongPressedTeam(null)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <X className="w-6 h-6 text-outline" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {longPressedTeam.config.map((general: any, idx: number) => (
                <div key={idx} className="bg-surface-container-low p-5 rounded-xl border-t-4 border-primary shadow-sm">
                  <h4 className="text-xl font-black text-on-surface mb-4">{general.武将}</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-primary">
                        <Swords className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">战法</span>
                      </div>
                      <div className="bg-surface-container-high/50 p-2 rounded-lg grid grid-cols-1 gap-1">
                        {(general.技能 || '').split('\n').map((s: string, i: number) => (
                          <div key={i} className="text-[10px] font-bold text-on-surface-variant py-1 px-2 bg-surface rounded truncate">
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-outline uppercase">兵种</span>
                        <p className="text-[10px] font-bold text-on-surface truncate">{general.兵种}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-outline uppercase">专精</span>
                        <p className="text-[10px] font-bold text-on-surface truncate">{general.专精}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-outline uppercase">兵书</span>
                        <p className="text-[10px] font-bold text-on-surface leading-tight">{general.兵书}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-outline-variant/10">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-outline uppercase">装备</span>
                        <p className="text-[10px] text-on-surface leading-tight">{general.装备}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-outline uppercase">坐骑</span>
                        <p className="text-[10px] text-on-surface leading-tight">{general.坐骑}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-outline uppercase">加点</span>
                        <p className="text-[10px] font-black text-primary">{general.加点}</p>
                      </div>
                    </div>
                    <div className="pt-1">
                      <span className="text-[9px] font-bold text-outline uppercase">装属: </span>
                      <span className="text-[9px] text-primary font-bold">{general.装属}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center gap-6">
              <div className="flex items-center gap-2 text-outline">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">更新: {longPressedTeam.date}</span>
              </div>
              <div className="flex items-center gap-2 text-outline">
                <BarChart2 className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">评级: {longPressedTeam.rating}</span>
              </div>
            </div>

            <button 
              onClick={() => setLongPressedTeam(null)}
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
