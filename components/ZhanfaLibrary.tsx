"use client";

import { useState } from 'react';
import { zhanfaData } from '@/lib/zhanfa_data';
import { Search, Filter, Target, Zap, Heart, Download, Upload, Plus } from 'lucide-react';
import DetailModal from './DetailModal';

const typeColors: { [key: string]: string } = {
  '主动': 'bg-red-100 text-red-800',
  '被动': 'bg-yellow-100 text-yellow-800',
  '指挥': 'bg-blue-100 text-blue-800',
  '追击': 'bg-green-100 text-green-800',
};

interface ZhanfaLibraryProps {
  collectedTactics: string[];
  toggleCollectTactic: (name: string) => void;
  onExport: () => void;
  onImport: () => void;
  onQuickEntry?: () => void;
  allTactics?: any[];
}

export default function ZhanfaLibrary({ 
  collectedTactics, 
  toggleCollectTactic, 
  onExport, 
  onImport,
  onQuickEntry,
  allTactics = zhanfaData
}: ZhanfaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [seasonFilter, setSeasonFilter] = useState<string>('全部');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTactic, setSelectedTactic] = useState<typeof zhanfaData[0] | null>(null);

  const types = ['全部', ...Array.from(new Set(allTactics.map(z => z.type)))];
  const seasons = ['全部', ...Array.from(new Set(allTactics.map(z => z.season).filter(Boolean)))].sort((a, b) => {
    if (a === '全部') return -1;
    if (b === '全部') return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const filteredZhanfa = allTactics.filter(z => 
    (z.name.toLowerCase().includes(searchQuery.toLowerCase()) || z.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (typeFilter === '全部' || z.type === typeFilter) &&
    (seasonFilter === '全部' || z.season === seasonFilter)
  ).sort((a, b) => {
    const aCollected = collectedTactics.includes(a.name);
    const bCollected = collectedTactics.includes(b.name);
    if (aCollected && !bCollected) return -1;
    if (!aCollected && bCollected) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Sticky Header */}
      <div className="p-6 md:p-10 pb-4 border-b border-outline-variant/10 bg-surface z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-extrabold text-on-surface font-headline">战法图鉴</h2>
              <div className="flex gap-2">
                <button 
                  onClick={onExport}
                  className="p-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-all flex items-center gap-2 text-xs font-bold"
                  title="导出战法"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
                <button 
                  onClick={onImport}
                  className="p-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-all flex items-center gap-2 text-xs font-bold"
                  title="导入战法"
                >
                  <Upload className="w-4 h-4" />
                  导入
                </button>
                <button 
                  onClick={onQuickEntry}
                  className="p-2 bg-primary text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2 text-xs font-bold"
                  title="快捷录入"
                >
                  <Plus className="w-4 h-4" />
                  录入
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="搜索战法..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container-high border-none rounded-lg px-4 py-2 w-64 text-sm focus:ring-2 focus:ring-secondary transition-all outline-none"
                />
                <Search className="absolute right-3 text-outline w-4 h-4" />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg font-bold text-on-surface hover:bg-surface-container-highest transition-all"
              >
                <Filter className="w-4 h-4" />
                筛选
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-surface-container-lowest p-4 rounded-lg mb-2 flex gap-6">
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-2">战法类型</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-surface p-2 rounded-md text-sm">
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-2">赛季</label>
                <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} className="bg-surface p-2 rounded-md text-sm">
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredZhanfa.map((zhanfa, idx) => {
            const isCollected = collectedTactics.includes(zhanfa.name);
            return (
              <div key={idx} className="bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-secondary p-6 transition-all hover:shadow-lg relative cursor-pointer" onClick={() => setSelectedTactic(zhanfa)}>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleCollectTactic(zhanfa.name); }}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isCollected ? 'bg-secondary text-white' : 'bg-surface-container-high text-outline hover:bg-secondary hover:text-white'}`}
                >
                  <Heart className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-xl font-black text-on-surface font-headline">
                    {zhanfa.name}
                    {zhanfa.season && zhanfa.season !== 'S1' && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-outline rounded font-bold align-middle">
                        {zhanfa.season}
                      </span>
                    )}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeColors[zhanfa.type] || 'bg-gray-100'}`}>
                    {zhanfa.type}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-outline text-xs">
                    <Target className="w-4 h-4" />
                    <span>目标: {zhanfa.target}</span>
                    <Zap className="w-4 h-4 ml-4" />
                    <span>发动概率: {zhanfa.probability * 100}%</span>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-lg">
                    {zhanfa.description}
                  </p>
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
          isCollected={collectedTactics.includes(selectedTactic.name)}
          onToggleCollect={() => toggleCollectTactic(selectedTactic.name)}
        >
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">类型: {selectedTactic.type}</p>
            <p className="text-sm text-on-surface-variant">目标: {selectedTactic.target}</p>
            <p className="text-sm text-on-surface-variant">发动概率: {selectedTactic.probability * 100}%</p>
            <div className="bg-surface-container-low p-4 rounded-lg">
              <p className="text-xs text-on-surface-variant">{selectedTactic.description}</p>
            </div>
          </div>
        </DetailModal>
      )}
      </div>
    </div>
  );
}
