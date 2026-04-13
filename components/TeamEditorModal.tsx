"use client";

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Search, User, Book, Shield, Zap, Swords, Clock, BarChart2 } from 'lucide-react';
import SelectionModal from './SelectionModal';

interface TeamConfig {
  武将: string;
  技能: string;
  兵种: string;
  专精: string;
  兵书: string;
  装属: string;
  装备: string;
  坐骑: string;
  加点: string;
}

interface Team {
  id: string;
  name: string;
  badge: string;
  type: string;
  desc: string;
  rating: string;
  date: string;
  config: TeamConfig[];
}

interface TeamEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Team) => void;
  initialData?: Team | null;
  allGenerals?: any[];
  allTactics?: any[];
}

const emptyHero: TeamConfig = {
  武将: "",
  技能: "",
  兵种: "",
  专精: "",
  兵书: "",
  装属: "",
  装备: "",
  坐骑: "",
  加点: ""
};

export default function TeamEditorModal({ isOpen, onClose, onSave, initialData, allGenerals = [], allTactics = [] }: TeamEditorModalProps) {
  const [team, setTeam] = useState<Team>(() => {
    if (initialData) return { ...initialData };
    return {
      id: `custom-${Date.now()}`,
      name: "",
      badge: "箕形阵",
      type: "自定义阵容",
      desc: "",
      rating: "T0 (主宰)",
      date: new Date().toLocaleDateString(),
      config: [ { ...emptyHero }, { ...emptyHero }, { ...emptyHero } ]
    };
  });

  const [selectionModal, setSelectionModal] = useState<{
    isOpen: boolean;
    type: 'hero' | 'tactic';
    heroIndex: number;
    tacticIndex?: number;
  }>({
    isOpen: false,
    type: 'hero',
    heroIndex: 0
  });

  if (!isOpen) return null;

  const handleHeroChange = (index: number, field: keyof TeamConfig, value: string) => {
    const newConfig = [...team.config];
    newConfig[index] = { ...newConfig[index], [field]: value };
    setTeam({ ...team, config: newConfig });
  };

  const handleSave = () => {
    if (!team.name) {
      alert("请输入阵容名称");
      return;
    }
    onSave(team);
    onClose();
  };

  const openHeroSelection = (index: number) => {
    setSelectionModal({ isOpen: true, type: 'hero', heroIndex: index });
  };

  const openTacticSelection = (heroIndex: number, tacticIndex: number) => {
    setSelectionModal({ isOpen: true, type: 'tactic', heroIndex, tacticIndex });
  };

  const handleSelect = (item: any) => {
    if (selectionModal.type === 'hero') {
      handleHeroChange(selectionModal.heroIndex, '武将', item.name);
    } else if (selectionModal.type === 'tactic') {
      const hero = team.config[selectionModal.heroIndex];
      const tactics = (hero.技能 || '').split('\n').filter(s => s.trim() !== "");
      
      if (selectionModal.tacticIndex !== undefined) {
        tactics[selectionModal.tacticIndex] = item.name;
      } else {
        tactics.push(item.name);
      }
      
      handleHeroChange(selectionModal.heroIndex, '技能', tactics.join('\n'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-6xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface sticky top-0 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">
              {initialData ? '编辑阵容' : '新建阵容'}
            </h2>
            <p className="text-xs text-outline font-bold uppercase tracking-widest mt-1">自定义战术配置</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSave}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
            >
              <Save className="w-4 h-4" />
              保存阵容
            </button>
            <button onClick={onClose} className="text-outline hover:text-on-surface p-2 hover:bg-surface-container-high rounded-full transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
          {/* Basic Info */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">阵容名称</label>
                <input 
                  type="text" 
                  value={team.name}
                  onChange={(e) => setTeam({ ...team, name: e.target.value })}
                  placeholder="例如：T0.3草原马"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">阵容描述</label>
                <textarea 
                  value={team.desc}
                  onChange={(e) => setTeam({ ...team, desc: e.target.value })}
                  placeholder="输入阵容特点、克制关系等..."
                  rows={2}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all outline-none resize-none"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">阵法 (Badge)</label>
                <input 
                  type="text" 
                  value={team.badge}
                  onChange={(e) => setTeam({ ...team, badge: e.target.value })}
                  placeholder="例如：箕形阵"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">强度评级</label>
                <select 
                  value={team.rating}
                  onChange={(e) => setTeam({ ...team, rating: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary transition-all outline-none"
                >
                  <option>T0 (主宰)</option>
                  <option>T0.3 (卓越)</option>
                  <option>T0.5 (顶尖)</option>
                  <option>T0.8 (优秀)</option>
                  <option>T1 (中坚)</option>
                  <option>T1.2 (稳健)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Hero Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {team.config.map((hero, idx) => (
              <div key={idx} className="bg-surface-container-low rounded-2xl border-t-4 border-primary overflow-hidden shadow-sm">
                <div className="p-6 space-y-6">
                  {/* Hero Selection */}
                  <div className="flex justify-between items-center">
                    <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">武将 {idx + 1}</label>
                      <button 
                        onClick={() => openHeroSelection(idx)}
                        className="w-full text-left bg-surface-container-high px-4 py-3 rounded-xl font-black text-xl hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span>{hero.武将 || '选择武将'}</span>
                          {hero.武将 && (() => {
                            const gen = allGenerals.find(g => g.name === hero.武将);
                            return gen?.season && gen.season !== 'S1' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-outline rounded font-bold">
                                {gen.season}
                              </span>
                            );
                          })()}
                        </div>
                        <Search className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                      </button>
                    </div>
                  </div>

                  {/* Tactics */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Swords className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">战法配置</span>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {(hero.技能 || '').split('\n').filter(s => s.trim() !== "").map((skill, sIdx) => (
                          <div key={sIdx} className="flex gap-2">
                            <button 
                              onClick={() => openTacticSelection(idx, sIdx)}
                              className="flex-1 bg-surface-container-high px-3 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-primary hover:text-white transition-all text-left truncate flex items-center gap-1"
                            >
                              <span>{skill}</span>
                              {(() => {
                            const tac = allTactics.find(t => (skill || '').includes(t.name));
                                return tac?.season && tac.season !== 'S1' && (
                                  <span className="text-[8px] px-1 bg-surface-container-highest text-outline rounded">
                                    {tac.season}
                                  </span>
                                );
                              })()}
                            </button>
                            <button 
                              onClick={() => {
                                const tactics = (hero.技能 || '').split('\n').filter(s => s.trim() !== "");
                                tactics.splice(sIdx, 1);
                                handleHeroChange(idx, '技能', tactics.join('\n'));
                              }}
                              className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => openTacticSelection(idx, (hero.技能 || '').split('\n').filter(s => s.trim() !== "").length)}
                          className="w-full border-2 border-dashed border-outline-variant/30 py-2 rounded-lg text-[10px] font-bold text-outline hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-3 h-3" />
                          添加战法
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3" /> 兵种
                      </label>
                      <input 
                        type="text" 
                        value={hero.兵种}
                        onChange={(e) => handleHeroChange(idx, '兵种', e.target.value)}
                        placeholder="重盾兵"
                        className="w-full bg-surface-container-high border-none rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3" /> 专精
                      </label>
                      <input 
                        type="text" 
                        value={hero.专精}
                        onChange={(e) => handleHeroChange(idx, '专精', e.target.value)}
                        placeholder="岿然不动"
                        className="w-full bg-surface-container-high border-none rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                        <Book className="w-3 h-3" /> 兵书
                      </label>
                      <textarea 
                        value={hero.兵书}
                        onChange={(e) => handleHeroChange(idx, '兵书', e.target.value)}
                        placeholder="兵书..."
                        rows={1}
                        className="w-full bg-surface-container-high border-none rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-outline-variant/20">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">装备</label>
                      <input 
                        type="text" 
                        value={hero.装备}
                        onChange={(e) => handleHeroChange(idx, '装备', e.target.value)}
                        className="w-full bg-surface-container-high border-none rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">坐骑</label>
                      <input 
                        type="text" 
                        value={hero.坐骑}
                        onChange={(e) => handleHeroChange(idx, '坐骑', e.target.value)}
                        className="w-full bg-surface-container-high border-none rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">加点</label>
                      <input 
                        type="text" 
                        value={hero.加点}
                        onChange={(e) => handleHeroChange(idx, '加点', e.target.value)}
                        className="w-full bg-surface-container-high border-none rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">装属</label>
                    <input 
                      type="text" 
                      value={hero.装属}
                      onChange={(e) => handleHeroChange(idx, '装属', e.target.value)}
                      className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SelectionModal 
        isOpen={selectionModal.isOpen}
        onClose={() => setSelectionModal({ ...selectionModal, isOpen: false })}
        onSelect={handleSelect}
        items={selectionModal.type === 'hero' ? allGenerals : allTactics}
        title={selectionModal.type === 'hero' ? '选择武将' : '选择战法'}
        placeholder={selectionModal.type === 'hero' ? '搜索武将姓名或阵营...' : '搜索战法名称或类型...'}
      />
    </div>
  );
}
