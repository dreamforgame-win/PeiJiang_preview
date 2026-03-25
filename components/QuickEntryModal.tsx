'use client';

import React, { useState } from 'react';
import { X, Plus, Shield, Zap, Book, Sword, Target, Info } from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'general' | 'tactic';
  onAdd: (data: any) => Promise<void> | void;
}

export default function QuickEntryModal({ isOpen, onClose, type, onAdd }: QuickEntryModalProps) {
  const [generalData, setGeneralData] = useState({
    name: '',
    faction: '魏',
    arms: ['步兵'],
    season: 'S1',
    base_stats: { 武力: 0, 智力: 0, 统率: 0, 先攻: 0 },
    innate_skill: { name: '', description: '', trigger: '主动', probability: '100%' }
  });

  const [tacticData, setTacticData] = useState({
    name: '',
    type: '指挥',
    target: '我军单体',
    season: 'S1',
    description: ''
  });

  if (!isOpen) return null;

  const handleAdd = async () => {
    try {
      if (type === 'general') {
        if (!generalData.name || !generalData.innate_skill.name) {
          alert('请填写完整信息');
          return;
        }
        await onAdd(generalData);
      } else {
        if (!tacticData.name || !tacticData.description) {
          alert('请填写完整信息');
          return;
        }
        await onAdd(tacticData);
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-on-surface font-headline">
                快捷录入{type === 'general' ? '武将' : '战法'}
              </h3>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Quick Entry</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline hover:text-on-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {type === 'general' ? (
            <div className="space-y-6">
              {/* General Card Preview Style Input */}
              <div className="bg-surface-container-high rounded-xl p-6 border border-outline-variant/20 shadow-inner">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-primary/20">
                    <span className="text-2xl font-black text-primary">{generalData.faction}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input 
                      type="text"
                      placeholder="输入武将名称"
                      value={generalData.name}
                      onChange={(e) => setGeneralData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-2 text-lg font-black focus:ring-2 focus:ring-primary outline-none"
                    />
                    <div className="flex gap-2">
                      {['魏', '蜀', '吴', '群'].map(f => (
                        <button
                          key={f}
                          onClick={() => setGeneralData(prev => ({ ...prev, faction: f }))}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${generalData.faction === f ? 'bg-primary text-white' : 'bg-surface-container-highest text-outline hover:text-on-surface'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-outline uppercase">赛季</span>
                      <select 
                        value={generalData.season}
                        onChange={(e) => setGeneralData(prev => ({ ...prev, season: e.target.value }))}
                        className="bg-surface-container-highest border-none rounded-lg px-3 py-1 text-xs font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 15 }, (_, i) => `S${i + 1}`).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-outline">
                      <Shield className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">兵种</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['步兵', '骑兵', '弓兵', '枪兵', '器械'].map(a => (
                        <button
                          key={a}
                          onClick={() => {
                            setGeneralData(prev => ({
                              ...prev,
                              arms: prev.arms.includes(a) 
                                ? prev.arms.filter(i => i !== a) 
                                : [...prev.arms, a]
                            }));
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${generalData.arms.includes(a) ? 'bg-secondary text-white' : 'bg-surface-container-highest text-outline'}`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                    <div className="flex items-center gap-2 text-outline">
                      <Sword className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">基础属性</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(['武力', '智力', '统率', '先攻'] as const).map(stat => (
                        <div key={stat} className="space-y-1">
                          <label className="text-[10px] font-bold text-outline uppercase px-1">{stat}</label>
                          <input 
                            type="number"
                            value={generalData.base_stats[stat]}
                            onChange={(e) => setGeneralData(prev => ({
                              ...prev,
                              base_stats: {
                                ...prev.base_stats,
                                [stat]: Number(e.target.value)
                              }
                            }))}
                            className="w-full bg-surface-container-highest border-none rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Zap className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">自带战法</span>
                    </div>
                    <input 
                      type="text"
                      placeholder="战法名称"
                      value={generalData.innate_skill.name}
                      onChange={(e) => setGeneralData(prev => ({ ...prev, innate_skill: { ...prev.innate_skill, name: e.target.value } }))}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-outline uppercase px-1">战法类型</label>
                        <select 
                          value={generalData.innate_skill.trigger}
                          onChange={(e) => setGeneralData(prev => ({ ...prev, innate_skill: { ...prev.innate_skill, trigger: e.target.value } }))}
                          className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                        >
                          {['指挥', '主动', '被动', '追击'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-outline uppercase px-1">发动概率</label>
                        <input 
                          type="text"
                          placeholder="例如: 45%"
                          value={generalData.innate_skill.probability}
                          onChange={(e) => setGeneralData(prev => ({ ...prev, innate_skill: { ...prev.innate_skill, probability: e.target.value } }))}
                          className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                    <textarea 
                      placeholder="战法描述"
                      value={generalData.innate_skill.description}
                      onChange={(e) => setGeneralData(prev => ({ ...prev, innate_skill: { ...prev.innate_skill, description: e.target.value } }))}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-2 text-xs min-h-[80px] focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tactic Card Preview Style Input */}
              <div className="bg-surface-container-high rounded-xl p-6 border border-outline-variant/20 shadow-inner">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center border-2 border-secondary/20">
                    <span className="text-xl font-black text-secondary">{tacticData.type[0]}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input 
                      type="text"
                      placeholder="输入战法名称"
                      value={tacticData.name}
                      onChange={(e) => setTacticData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-2 text-lg font-black focus:ring-2 focus:ring-secondary outline-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['指挥', '主动', '被动', '追击'].map(t => (
                        <button
                          key={t}
                          onClick={() => setTacticData(prev => ({ ...prev, type: t }))}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${tacticData.type === t ? 'bg-secondary text-white' : 'bg-surface-container-highest text-outline'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-outline uppercase">赛季</span>
                      <select 
                        value={tacticData.season}
                        onChange={(e) => setTacticData(prev => ({ ...prev, season: e.target.value }))}
                        className="bg-surface-container-highest border-none rounded-lg px-3 py-1 text-xs font-bold focus:ring-2 focus:ring-secondary outline-none appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 15 }, (_, i) => `S${i + 1}`).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-outline">
                      <Target className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">目标</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['我军单体', '我军群体', '敌军单体', '敌军群体', '自身'].map(t => (
                        <button
                          key={t}
                          onClick={() => setTacticData(prev => ({ ...prev, target: t }))}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${tacticData.target === t ? 'bg-primary/80 text-white' : 'bg-surface-container-highest text-outline'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                    <div className="flex items-center gap-2 text-secondary">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">战法描述</span>
                    </div>
                    <textarea 
                      placeholder="输入战法效果描述..."
                      value={tacticData.description}
                      onChange={(e) => setTacticData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-2 text-xs min-h-[120px] focus:ring-2 focus:ring-secondary outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/20"
          >
            取消
          </button>
          <button 
            onClick={handleAdd}
            className="flex-[2] py-3 px-4 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            完成录入
          </button>
        </div>
      </div>
    </div>
  );
}
