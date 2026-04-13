"use client";

import { useState } from 'react';
import { Search, Filter, Target, Zap, Heart, Download, Upload, Plus } from 'lucide-react';
import DetailModal from './DetailModal';
import RichText from './RichText';

const typeColors: { [key: string]: string } = {
  '主动': 'bg-red-100 text-red-800',
  '被动': 'bg-yellow-100 text-yellow-800',
  '指挥': 'bg-blue-100 text-blue-800',
  '追击': 'bg-green-100 text-green-800',
};

interface ZhanfaLibraryProps {
  collectedTactics: string[];
  toggleCollectTactic: (name: string) => void;
  onQuickEntry?: () => void;
  allTactics?: any[];
  allEffects?: any[];
  onEffectClick?: (effect: any) => void;
}

export default function ZhanfaLibrary({ 
  collectedTactics, 
  toggleCollectTactic, 
  onQuickEntry,
  allTactics = [],
  allEffects = [],
  onEffectClick
}: ZhanfaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [seasonFilter, setSeasonFilter] = useState<string>('全部');
  const [selectedTactic, setSelectedTactic] = useState<any | null>(null);

  const types = ['全部', ...Array.from(new Set(allTactics.map(z => z.type).filter(Boolean)))];
  const seasons = ['全部', ...Array.from(new Set(allTactics.map(z => z.season).filter(Boolean)))].sort((a, b) => {
    if (a === '全部') return -1;
    if (b === '全部') return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const filteredZhanfa = allTactics.filter(z => 
    ((z.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (z.description || '').toLowerCase().includes((searchQuery || '').toLowerCase())) &&
    (typeFilter === '全部' || z.type === typeFilter) &&
    (seasonFilter === '全部' || z.season === seasonFilter)
  ).sort((a, b) => {
    const aCollected = (collectedTactics || []).includes(a.name);
    const bCollected = (collectedTactics || []).includes(b.name);
    if (aCollected && !bCollected) return -1;
    if (!aCollected && bCollected) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Sticky Header */}
      <div className="p-6 md:p-10 pb-4 border-b border-outline-variant/10 bg-surface z-10">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-extrabold text-on-surface font-headline">战法图鉴</h2>
                <button 
                  onClick={onQuickEntry}
                  className="p-2 bg-primary text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2 text-xs font-bold"
                  title="快捷录入"
                >
                  <Plus className="w-4 h-4" />
                  录入
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    placeholder="搜索战法..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-4 py-2 w-full md:w-48 text-sm focus:ring-2 focus:ring-secondary transition-all outline-none"
                  />
                  <Search className="absolute right-3 text-outline w-4 h-4" />
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={typeFilter} 
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-surface-container-high text-on-surface text-xs font-bold py-2 px-3 rounded-lg border-none focus:ring-2 focus:ring-secondary outline-none cursor-pointer"
                  >
                    {types.map(t => <option key={t} value={t}>{t === '全部' ? '全部类型' : t}</option>)}
                  </select>
                  
                  <select 
                    value={seasonFilter} 
                    onChange={(e) => setSeasonFilter(e.target.value)}
                    className="bg-surface-container-high text-on-surface text-xs font-bold py-2 px-3 rounded-lg border-none focus:ring-2 focus:ring-secondary outline-none cursor-pointer"
                  >
                    {seasons.map(s => <option key={s} value={s}>{s === '全部' ? '全部赛季' : s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredZhanfa.map((zhanfa, idx) => {
            const isCollected = (collectedTactics || []).includes(zhanfa.name);
            const uniqueKey = zhanfa.id || `${zhanfa.name}-${zhanfa.season || ''}-${idx}`;
            return (
              <div key={uniqueKey} className="bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-secondary p-6 transition-all hover:shadow-lg relative cursor-pointer" onClick={() => setSelectedTactic(zhanfa)}>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleCollectTactic(zhanfa.name); }}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isCollected ? 'bg-secondary text-white' : 'bg-surface-container-high text-outline hover:bg-secondary hover:text-white'}`}
                >
                  <Heart className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-xl font-black text-on-surface font-headline">
                    {zhanfa.tactic_name || zhanfa.name}
                    {zhanfa.season && zhanfa.season !== 'S1' && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-outline rounded font-bold align-middle">
                        {zhanfa.season}
                      </span>
                    )}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeColors[zhanfa.tactic_type || zhanfa.type] || 'bg-gray-100'}`}>
                    {zhanfa.tactic_type || zhanfa.type}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-outline text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-secondary" />
                      <span>发动概率: {zhanfa.tactic_probability || (typeof zhanfa.probability === 'number' ? (zhanfa.probability * 100).toFixed(0) + '%' : zhanfa.probability || '100%')}</span>
                    </div>
                    {(zhanfa.traitType || zhanfa.tactic_trait) && (
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span>特性类型: {zhanfa.traitType || zhanfa.tactic_trait}</span>
                      </div>
                    )}
                    {(zhanfa.troopType || zhanfa.arms) && (
                      <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-tertiary" />
                        <span>适用兵种: {zhanfa.troopType || (Array.isArray(zhanfa.arms) ? zhanfa.arms.join(',') : zhanfa.arms)}</span>
                      </div>
                    )}
                  </div>
                  
                  <RichText 
                    text={zhanfa.tactic_description || zhanfa.description} 
                    effects={allEffects} 
                    onEffectClick={onEffectClick || (() => {})}
                    className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-lg line-clamp-3 min-h-[4.5em]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedTactic && (
        <DetailModal 
          isOpen={!!selectedTactic} 
          onClose={() => setSelectedTactic(null)} 
          title={
            <div className="flex items-center gap-2">
              <span>{selectedTactic.name}</span>
              {selectedTactic.season && selectedTactic.season !== 'S1' && (
                <span className="text-xs px-2 py-0.5 bg-surface-container-highest text-outline rounded font-bold">
                  {selectedTactic.season}
                </span>
              )}
            </div>
          }
          isCollected={(collectedTactics || []).includes(selectedTactic.name)}
          onToggleCollect={() => toggleCollectTactic(selectedTactic.name)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase mb-1">战法类型</p>
                <p className="text-sm font-bold text-on-surface">{selectedTactic.tactic_type || selectedTactic.type}</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase mb-1">发动概率</p>
                <p className="text-sm font-bold text-on-surface">{selectedTactic.tactic_probability || (typeof selectedTactic.probability === 'number' ? (selectedTactic.probability * 100).toFixed(0) + '%' : selectedTactic.probability || '100%')}</p>
              </div>
              {(selectedTactic.traitType || selectedTactic.tactic_trait) && (
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">特性类型</p>
                  <p className="text-sm font-bold text-on-surface">{selectedTactic.traitType || selectedTactic.tactic_trait}</p>
                </div>
              )}
              {(selectedTactic.troopType || selectedTactic.arms) && (
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] font-bold text-outline uppercase mb-1">适用兵种</p>
                  <p className="text-sm font-bold text-on-surface">{selectedTactic.troopType || (Array.isArray(selectedTactic.arms) ? selectedTactic.arms.join(',') : selectedTactic.arms)}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-outline uppercase px-1">战法详情</p>
              <div className="bg-surface-container-highest/30 p-5 rounded-2xl border border-outline-variant/20 shadow-inner">
                <RichText 
                  text={selectedTactic.tactic_description || selectedTactic.description} 
                  effects={allEffects} 
                  onEffectClick={onEffectClick || (() => {})}
                  className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap"
                />
              </div>
            </div>
          </div>
        </DetailModal>
      )}
      </div>
    </div>
  );
}
