"use client";

import { useState, useMemo } from 'react';
import { Search, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import RichText from './RichText';

interface Buff {
  id: string;
  name: string;
  type: string;
  effect: string;
}

interface SpecialEffect {
  id: string;
  name: string;
  type: string;
  effect: string;
}

interface EffectGalleryProps {
  buffs: Buff[];
  specialEffects: SpecialEffect[];
  allEffects?: any[];
  onEffectClick?: (effect: any) => void;
}

export default function EffectGallery({ buffs, specialEffects, allEffects = [], onEffectClick }: EffectGalleryProps) {
  const [activeSubTab, setActiveSubTab] = useState<'buff' | 'special'>('buff');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBuffs = useMemo(() => {
    return buffs.filter(buff => 
      buff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buff.effect.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [buffs, searchQuery]);

  const filteredSpecialEffects = useMemo(() => {
    return specialEffects.filter(effect => 
      effect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      effect.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      effect.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [specialEffects, searchQuery]);

  const positiveBuffs = useMemo(() => filteredBuffs.filter(b => b.type === '增益'), [filteredBuffs]);
  const negativeBuffs = useMemo(() => filteredBuffs.filter(b => b.type === '减益'), [filteredBuffs]);

  const mountEffects = useMemo(() => filteredSpecialEffects.filter(e => e.type.includes('坐骑')), [filteredSpecialEffects]);
  const equipmentEffects = useMemo(() => filteredSpecialEffects.filter(e => e.type.includes('装备')), [filteredSpecialEffects]);

  return (
    <div className="flex flex-col h-full bg-surface-container-low">
      {/* Header */}
      <div className="bg-surface p-4 md:p-6 border-b border-outline-variant/10 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight uppercase font-headline flex items-center gap-3">
              <Zap className="text-primary w-8 h-8" />
              效果图鉴
            </h2>
            <p className="text-xs text-outline font-bold uppercase tracking-widest mt-1">查看各类状态与效果说明</p>
          </div>

          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="搜索名称、类型或描述..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface-container-highest border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-2 mt-6">
          <button 
            onClick={() => setActiveSubTab('buff')}
            className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
              activeSubTab === 'buff' 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-surface-container-highest text-outline hover:text-primary hover:bg-surface-container-lowest'
            }`}
          >
            BUFF 效果
          </button>
          <button 
            onClick={() => setActiveSubTab('special')}
            className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
              activeSubTab === 'special' 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-surface-container-highest text-outline hover:text-primary hover:bg-surface-container-lowest'
            }`}
          >
            特技特效
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeSubTab === 'buff' ? (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Positive Buffs */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-green-600 w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900">增益状态 (Positive)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positiveBuffs.map(buff => (
                  <div key={buff.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-primary text-base group-hover:scale-105 transition-transform origin-left">{buff.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase">增益</span>
                    </div>
                    <RichText 
                      text={buff.effect} 
                      effects={allEffects} 
                      onEffectClick={onEffectClick || (() => {})}
                      className="text-xs text-on-surface-variant leading-relaxed font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Negative Buffs */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="text-red-600 w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900">减益状态 (Negative)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {negativeBuffs.map(buff => (
                  <div key={buff.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-red-600 text-base group-hover:scale-105 transition-transform origin-left">{buff.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase">减益</span>
                    </div>
                    <RichText 
                      text={buff.effect} 
                      effects={allEffects} 
                      onEffectClick={onEffectClick || (() => {})}
                      className="text-xs text-on-surface-variant leading-relaxed font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {filteredBuffs.length === 0 && (
              <div className="text-center py-20">
                <Zap className="w-16 h-16 text-outline/20 mx-auto mb-4" />
                <p className="text-outline font-bold uppercase tracking-widest">未找到匹配的效果</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Mount Effects */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="text-amber-600 w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900">坐骑特效/特技 (Mount)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mountEffects.map(effect => (
                  <div key={effect.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-amber-700 text-base group-hover:scale-105 transition-transform origin-left">{effect.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">{effect.type.split('/')[1]}</span>
                    </div>
                    <RichText 
                      text={effect.effect} 
                      effects={allEffects} 
                      onEffectClick={onEffectClick || (() => {})}
                      className="text-xs text-on-surface-variant leading-relaxed font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment Effects */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-blue-600 w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900">装备特效/特技 (Equipment)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipmentEffects.map(effect => (
                  <div key={effect.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-blue-700 text-base group-hover:scale-105 transition-transform origin-left">{effect.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">{effect.type.split('/')[1]}</span>
                    </div>
                    <RichText 
                      text={effect.effect} 
                      effects={allEffects} 
                      onEffectClick={onEffectClick || (() => {})}
                      className="text-xs text-on-surface-variant leading-relaxed font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {filteredSpecialEffects.length === 0 && (
              <div className="text-center py-20">
                <Zap className="w-16 h-16 text-outline/20 mx-auto mb-4" />
                <p className="text-outline font-bold uppercase tracking-widest">未找到匹配的特效</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
