"use client";

import { useState } from 'react';
import { Shield, Swords, Heart, Search, Filter, Download, Upload, Plus } from 'lucide-react';
import { wujiangData } from '@/lib/wujiang_data';
import DetailModal from './DetailModal';

const factionColors: { [key: string]: string } = {
  '魏': 'bg-blue-100 text-blue-800',
  '蜀': 'bg-green-100 text-green-800',
  '吴': 'bg-orange-100 text-orange-800',
  '群': 'bg-purple-100 text-purple-800',
};

interface GeneralGalleryProps {
  collectedGenerals: string[];
  toggleCollectGeneral: (name: string) => void;
  onQuickEntry?: () => void;
  allGenerals?: any[];
}

export default function GeneralGallery({ 
  collectedGenerals, 
  toggleCollectGeneral, 
  onQuickEntry,
  allGenerals = []
}: GeneralGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [factionFilter, setFactionFilter] = useState<string>('全部');
  const [armFilter, setArmFilter] = useState<string>('全部');
  const [seasonFilter, setSeasonFilter] = useState<string>('全部');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGeneral, setSelectedGeneral] = useState<any | null>(null);

  const factions = ['全部', ...Array.from(new Set(allGenerals.map(w => w.faction)))];
  const arms = ['全部', ...Array.from(new Set(allGenerals.flatMap(w => w.arms)))];
  const seasons = ['全部', ...Array.from(new Set(allGenerals.map(w => w.season).filter(Boolean)))].sort((a, b) => {
    if (a === '全部') return -1;
    if (b === '全部') return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const filteredGenerals = allGenerals.filter(w => {
    const matchesSearch = (w.name || '').includes(searchQuery) || (w.innate_skill?.name || '').includes(searchQuery);
    const matchesFaction = factionFilter === '全部' || w.faction === factionFilter;
    const matchesArm = armFilter === '全部' || (w.arms || []).includes(armFilter);
    const matchesSeason = seasonFilter === '全部' || w.season === seasonFilter;
    return matchesSearch && matchesFaction && matchesArm && matchesSeason;
  }).sort((a, b) => {
    const aCollected = (collectedGenerals || []).includes(a.name);
    const bCollected = (collectedGenerals || []).includes(b.name);
    if (aCollected && !bCollected) return -1;
    if (!aCollected && bCollected) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      <div className="p-6 md:p-10 pb-4 border-b border-outline-variant/10 bg-surface z-10">
        <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold text-on-surface font-headline">武将图鉴</h2>
            <div className="flex gap-2">
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
                placeholder="搜索武将..." 
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
              <label className="block text-xs font-bold text-outline uppercase mb-2">阵营</label>
              <select value={factionFilter} onChange={(e) => setFactionFilter(e.target.value)} className="bg-surface p-2 rounded-md text-sm">
                {factions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-2">兵种</label>
              <select value={armFilter} onChange={(e) => setArmFilter(e.target.value)} className="bg-surface p-2 rounded-md text-sm">
                {arms.map(a => <option key={a} value={a}>{a}</option>)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGenerals.map((general, idx) => {
            const isCollected = (collectedGenerals || []).includes(general.name);
            return (
              <div key={idx} className="bg-surface-container-lowest rounded-xl shadow-sm border-t-4 border-primary p-6 transition-all hover:shadow-lg relative cursor-pointer" onClick={() => setSelectedGeneral(general)}>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleCollectGeneral(general.name); }}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isCollected ? 'bg-primary text-white' : 'bg-surface-container-high text-outline hover:bg-primary hover:text-white'}`}
                >
                  <Heart className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-xl font-black text-on-surface font-headline">
                    {general.name}
                    {general.season && general.season !== 'S1' && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-outline rounded font-bold align-middle">
                        {general.season}
                      </span>
                    )}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${factionColors[general.faction] || 'bg-gray-100'}`}>
                    {general.faction}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-outline">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">兵种: {general.arms.join(', ')}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {general.base_stats && Object.entries(general.base_stats).map(([stat, value]) => (
                      <div key={stat} className="flex justify-between bg-surface-container-low p-2 rounded">
                        <span className="text-outline">{stat}</span>
                        <span className="font-bold text-on-surface">{value as any}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Swords className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">自带技能: {general.innate_skill?.name}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {general.innate_skill?.description}
                    </p>
                    <div className="flex gap-2 mt-2 text-[10px] text-outline font-bold">
                      {general.innate_skill?.trigger && <span>类型: {general.innate_skill.trigger}</span>}
                      {general.innate_skill?.probability !== undefined && <span>概率: {general.innate_skill.probability * 100}%</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedGeneral && (
        <DetailModal 
          isOpen={!!selectedGeneral} 
          onClose={() => setSelectedGeneral(null)} 
          title={
            <div className="flex items-center gap-2">
              <span>{selectedGeneral.name}</span>
              {selectedGeneral.season && selectedGeneral.season !== 'S1' && (
                <span className="text-xs px-2 py-0.5 bg-surface-container-highest text-outline rounded font-bold">
                  {selectedGeneral.season}
                </span>
              )}
            </div>
          }
          isCollected={(collectedGenerals || []).includes(selectedGeneral.name)}
          onToggleCollect={() => toggleCollectGeneral(selectedGeneral.name)}
        >
          <div className="space-y-4">
            <div className="flex gap-4">
              <p className="text-sm text-on-surface-variant">阵营: {selectedGeneral.faction}</p>
              <p className="text-sm text-on-surface-variant">兵种: {selectedGeneral.arms.join(', ')}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-surface-container-low p-2 rounded">
                <p className="text-outline mb-1">武力</p>
                <p className="font-bold text-on-surface">{selectedGeneral.force}</p>
              </div>
              <div className="bg-surface-container-low p-2 rounded">
                <p className="text-outline mb-1">智力</p>
                <p className="font-bold text-on-surface">{selectedGeneral.intelligence}</p>
              </div>
              <div className="bg-surface-container-low p-2 rounded">
                <p className="text-outline mb-1">统率</p>
                <p className="font-bold text-on-surface">{selectedGeneral.command}</p>
              </div>
              <div className="bg-surface-container-low p-2 rounded">
                <p className="text-outline mb-1">先攻</p>
                <p className="font-bold text-on-surface">{selectedGeneral.speed}</p>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-lg">
              <p className="font-bold text-primary mb-2">{selectedGeneral.innate_skill?.name}</p>
              <p className="text-xs text-on-surface-variant mb-2">{selectedGeneral.innate_skill?.description}</p>
              <div className="flex gap-2 text-[10px] text-outline font-bold">
                {selectedGeneral.innate_skill?.trigger && <span>类型: {selectedGeneral.innate_skill.trigger}</span>}
                {selectedGeneral.innate_skill?.probability !== undefined && <span>概率: {selectedGeneral.innate_skill.probability * 100}%</span>}
              </div>
            </div>

            {selectedGeneral.fates && selectedGeneral.fates.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-on-surface">缘分</p>
                {selectedGeneral.fates.map((fate: any, idx: number) => (
                  <div key={idx} className="bg-surface-container-low p-3 rounded-lg">
                    <p className="font-bold text-secondary mb-1">{fate.name}</p>
                    <p className="text-xs text-on-surface-variant mb-2">{fate.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {fate.generals.map((g: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            const gen = allGenerals.find(w => w.name === g);
                            if (gen) setSelectedGeneral(gen);
                          }}
                          className="text-[10px] px-2 py-1 bg-surface-container-high hover:bg-primary/10 text-on-surface rounded transition-colors"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DetailModal>
      )}
      </div>
    </div>
  );
}
