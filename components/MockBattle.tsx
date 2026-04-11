"use client";

import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, X, Check, Shield, Swords, RefreshCw } from 'lucide-react';

interface MockBattleProps {
  allGenerals: any[];
  allTactics: any[];
  allTeams: any[];
}

type SlotItem = { type: 'general' | 'tactic'; data: any };

export default function MockBattle({ allGenerals, allTactics, allTeams }: MockBattleProps) {
  const [manuallyAddedGenerals, setManuallyAddedGenerals] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mockBattleManuallyAddedGenerals');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  const [manuallyAddedTactics, setManuallyAddedTactics] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mockBattleManuallyAddedTactics');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  const [simulationItem, setSimulationItem] = useState<SlotItem | null>(null);
  
  useEffect(() => {
    localStorage.setItem('mockBattleManuallyAddedGenerals', JSON.stringify(manuallyAddedGenerals));
    localStorage.setItem('mockBattleManuallyAddedTactics', JSON.stringify(manuallyAddedTactics));
  }, [manuallyAddedGenerals, manuallyAddedTactics]);

  const [viewMode, setViewMode] = useState<'rounds' | 'recommendations'>('rounds');
  const [currentRound, setCurrentRound] = useState(0);
  // roundsData[roundIndex][groupIndex][slotIndex]
  const [roundsData, setRoundsData] = useState<(SlotItem | null)[][][]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mockBattleRoundsData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length === 6) {
          parsed.push(Array(3).fill(null).map(() => Array(3).fill(null)));
        }
        return parsed;
      }
    }
    return Array(7).fill(null).map(() => Array(3).fill(null).map(() => Array(3).fill(null)));
  });
  const [selectedGroups, setSelectedGroups] = useState<(number | null)[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mockBattleSelectedGroups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length === 6) {
          parsed.push(null);
        }
        return parsed;
      }
    }
    return Array(7).fill(null);
  });

  // Data Migration: Rename 甄姬 to 甄洛
  useEffect(() => {
    const migrateName = (name: string) => name === '甄姬' ? '甄洛' : name;
    
    if (manuallyAddedGenerals.some(g => g.name === '甄姬')) {
      setManuallyAddedGenerals(prev => prev.map(g => ({ ...g, name: migrateName(g.name) })));
    }
    
    let roundsChanged = false;
    const newRoundsData = roundsData.map(round => 
      round.map(group => 
        group.map(slot => {
          if (slot?.type === 'general' && slot.data.name === '甄姬') {
            roundsChanged = true;
            return { ...slot, data: { ...slot.data, name: '甄洛' } };
          }
          return slot;
        })
      )
    );
    if (roundsChanged) {
      setRoundsData(newRoundsData);
    }
  }, [manuallyAddedGenerals, roundsData]);

  // Derived warehouse state
  const warehouseGenerals = [
    ...manuallyAddedGenerals,
    ...selectedGroups.flatMap((groupIndex, roundIndex) => {
      if (groupIndex === null) return [];
      return roundsData[roundIndex][groupIndex]
        .filter(slot => slot?.type === 'general')
        .map(slot => slot!.data);
    })
  ];

  const warehouseTactics = [
    ...manuallyAddedTactics,
    ...selectedGroups.flatMap((groupIndex, roundIndex) => {
      if (groupIndex === null) return [];
      return roundsData[roundIndex][groupIndex]
        .filter(slot => slot?.type === 'tactic')
        .map(slot => slot!.data);
    })
  ];

  const saveToLocalStorage = (rounds: any, groups: any) => {
    localStorage.setItem('mockBattleRoundsData', JSON.stringify(rounds));
    localStorage.setItem('mockBattleSelectedGroups', JSON.stringify(groups));
  };

  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    setManuallyAddedGenerals([]);
    setManuallyAddedTactics([]);
    const initialRoundsData = Array(7).fill(null).map(() => Array(3).fill(null).map(() => Array(3).fill(null)));
    setRoundsData(initialRoundsData);
    const initialSelectedGroups = Array(7).fill(null);
    setSelectedGroups(initialSelectedGroups);
    setSimulationItem(null);
    setCurrentRound(0);
    setResetConfirm(false);
    
    localStorage.removeItem('mockBattleManuallyAddedGenerals');
    localStorage.removeItem('mockBattleManuallyAddedTactics');
    localStorage.removeItem('mockBattleRoundsData');
    localStorage.removeItem('mockBattleSelectedGroups');
  };

  const normalizedTeams = useMemo(() => {
    return allTeams.map(team => {
      if (team.generals) return team;
      return {
        ...team,
        generals: team.config?.map((c: any) => ({
          name: c["武将"],
          tactics: c["技能"]?.split('\n').map((s: string) => s.trim()).filter(Boolean) || []
        })) || []
      };
    });
  }, [allTeams]);

  const calculateMatchScore = (team: any, extraItem?: SlotItem | null) => {
    const teamGenerals = team.generals.map((g: any) => g.name);
    const teamTactics = team.generals.flatMap((g: any) => g.tactics.slice(0, 2));

    // Combine manually added items, all items selected in rounds, and the extra item
    const allSelectedGenerals = [
      ...manuallyAddedGenerals,
      ...selectedGroups.flatMap((groupIndex, roundIndex) => {
        if (groupIndex === null) return [];
        return roundsData[roundIndex][groupIndex]
          .filter(slot => slot?.type === 'general')
          .map(slot => slot!.data);
      }),
      ...(extraItem?.type === 'general' ? [extraItem.data] : [])
    ];
    const allSelectedTactics = [
      ...manuallyAddedTactics,
      ...selectedGroups.flatMap((groupIndex, roundIndex) => {
        if (groupIndex === null) return [];
        return roundsData[roundIndex][groupIndex]
          .filter(slot => slot?.type === 'tactic')
          .map(slot => slot!.data);
      }),
      ...(extraItem?.type === 'tactic' ? [extraItem.data] : [])
    ];

    const selectedGeneralNames = allSelectedGenerals.map(g => g.name);
    const selectedTacticNames = allSelectedTactics.map(t => t.name);

    let matchedGenerals = 0;
    teamGenerals.forEach((g: string) => {
      if (selectedGeneralNames.includes(g)) matchedGenerals++;
    });

    let matchedTactics = 0;
    teamTactics.forEach((t: string) => {
      if (selectedTacticNames.includes(t)) matchedTactics++;
    });
    
    const totalItems = teamGenerals.length + teamTactics.length;
    if (totalItems === 0) return 0;
    
    const score = Math.round(((matchedGenerals + matchedTactics) * 11 / (totalItems * 11)) * 100);
    return score;
  };

  const getBestMatchForSlot = (slot: SlotItem | null) => {
    if (!slot) return null;
    let bestTeam: any = null;
    let maxScore = 0;
    
    normalizedTeams.forEach(team => {
      let contains = false;
      if (slot.type === 'general') {
        contains = team.generals?.some((g: any) => g.name === slot.data.name);
      } else {
        contains = team.generals?.some((g: any) => g.tactics?.includes(slot.data.name));
      }
      
      if (contains) {
        const score = calculateMatchScore(team, slot);
        if (score > maxScore) {
          maxScore = score;
          bestTeam = team;
        }
      }
    });
    
    return { bestTeam, maxScore };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{
    dest: 'warehouse_general' | 'warehouse_tactic' | 'slot';
    roundIndex?: number;
    groupIndex?: number;
    slotIndex?: number;
  } | null>(null);

  const [modalTab, setModalTab] = useState<'general' | 'tactic'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedItems, setTempSelectedItems] = useState<any[]>([]);

  const handleOpenModal = (dest: 'warehouse_general' | 'warehouse_tactic' | 'slot', roundIndex?: number, groupIndex?: number, slotIndex?: number) => {
    setModalTarget({ dest, roundIndex, groupIndex, slotIndex });
    if (dest === 'warehouse_general') setModalTab('general');
    if (dest === 'warehouse_tactic') setModalTab('tactic');
    setIsModalOpen(true);
    setSearchQuery('');
    setTempSelectedItems([]);
  };

  const handleSelectItem = (item: any, type: 'general' | 'tactic') => {
    if (!modalTarget) return;

    if (modalTarget.dest === 'warehouse_general' || modalTarget.dest === 'warehouse_tactic') {
      if (tempSelectedItems.some(i => i.name === item.name)) {
        setTempSelectedItems(prev => prev.filter(i => i.name !== item.name));
      } else {
        setTempSelectedItems(prev => [...prev, item]);
      }
    } else if (modalTarget.dest === 'slot') {
      if (tempSelectedItems.some(i => i.data.name === item.name)) {
        setTempSelectedItems(prev => prev.filter(i => i.data.name !== item.name));
      } else {
        if (tempSelectedItems.length < 3) {
          setTempSelectedItems(prev => [...prev, { data: item, type }]);
        }
      }
    }
  };

  const handleConfirmModal = () => {
    if (modalTarget?.dest === 'warehouse_general') {
      const newGenerals = tempSelectedItems.filter(item => !manuallyAddedGenerals.some(g => g.name === item.name));
      setManuallyAddedGenerals(prev => [...prev, ...newGenerals]);
    } else if (modalTarget?.dest === 'warehouse_tactic') {
      const newTactics = tempSelectedItems.filter(item => !manuallyAddedTactics.some(t => t.name === item.name));
      setManuallyAddedTactics(prev => [...prev, ...newTactics]);
    } else if (modalTarget?.dest === 'slot') {
      const newRounds = [...roundsData];
      const { roundIndex, groupIndex, slotIndex } = modalTarget;
      
      let currentSlot = slotIndex!;
      for (const selected of tempSelectedItems) {
        if (currentSlot < 3) {
          newRounds[roundIndex!][groupIndex!][currentSlot] = selected;
          currentSlot++;
        }
      }
      setRoundsData(newRounds);
      saveToLocalStorage(newRounds, selectedGroups);
    }
    setIsModalOpen(false);
  };

  const handleSelectGroup = (roundIndex: number, groupIndex: number) => {
    const newSelected = [...selectedGroups];
    newSelected[roundIndex] = groupIndex;
    setSelectedGroups(newSelected);
    saveToLocalStorage(roundsData, newSelected);

    if (roundIndex < 6) {
      setCurrentRound(roundIndex + 1);
    }
  };

  const filteredGenerals = allGenerals.filter(g => {
    if (!searchQuery) return true;
    const queries = searchQuery.split(/[\s,，]+/).filter(Boolean);
    return queries.some(q => g.name.toLowerCase().includes(q.toLowerCase()));
  });

  const filteredTactics = allTactics.filter(t => {
    if (!searchQuery) return true;
    const queries = searchQuery.split(/[\s,，]+/).filter(Boolean);
    return queries.some(q => t.name.toLowerCase().includes(q.toLowerCase()));
  });

  return (
    <div className="flex h-full gap-6 p-2">
      {/* Left: Warehouse */}
      <div className="w-1/3 flex flex-col gap-6">
        {/* Generals */}
        <div className="flex-1 bg-surface-container-low rounded-2xl p-4 flex flex-col overflow-hidden border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              武将仓库
            </h3>
            <button 
              onClick={() => handleOpenModal('warehouse_general')}
              className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-primary"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
            {/* Selected from rounds */}
            {selectedGroups.flatMap((groupIndex, roundIndex) => {
              if (groupIndex === null) return [];
              return roundsData[roundIndex][groupIndex]
                .filter(slot => slot?.type === 'general')
                .map((slot, i) => (
                  <div 
                    key={`round-${roundIndex}-${i}`} 
                    onClick={() => setSimulationItem(slot!)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border border-primary/30 bg-surface-container-highest text-center p-1 relative group cursor-pointer transition-all ${
                      simulationItem?.data.name === slot!.data.name ? 'border-primary ring-1 ring-primary' : ''
                    }`}
                  >
                    {slot!.data.name}
                    <div className="absolute top-0.5 left-0.5 bg-primary text-white text-[8px] px-1 rounded">
                      R{roundIndex + 1}
                    </div>
                  </div>
                ));
            })}
            {/* Manually added */}
            {manuallyAddedGenerals.map((g, i) => (
              <div 
                key={`manual-${i}`} 
                onClick={() => setSimulationItem({ type: 'general', data: g })}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border border-outline-variant/30 text-center p-1 relative group cursor-pointer transition-all ${
                  simulationItem?.data.name === g.name ? 'border-primary ring-1 ring-primary' : 'bg-surface-container-highest'
                }`}
              >
                {g.name}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setManuallyAddedGenerals(prev => prev.filter((_, idx) => idx !== i));
                    if (simulationItem?.data.name === g.name) setSimulationItem(null);
                  }}
                  className="absolute top-0.5 right-0.5 bg-error/90 text-white rounded-full p-1 shadow-sm hover:bg-error transition-all hidden group-hover:block z-10"
                >
                  <X className="w-3 h-3 stroke-[3] text-black" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tactics */}
        <div className="flex-1 bg-surface-container-low rounded-2xl p-4 flex flex-col overflow-hidden border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Swords className="w-5 h-5 text-tertiary" />
              战法仓库
            </h3>
            <button 
              onClick={() => handleOpenModal('warehouse_tactic')}
              className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-tertiary"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
            {/* Selected from rounds */}
            {selectedGroups.flatMap((groupIndex, roundIndex) => {
              if (groupIndex === null) return [];
              return roundsData[roundIndex][groupIndex]
                .filter(slot => slot?.type === 'tactic')
                .map((slot, i) => (
                  <div 
                    key={`round-${roundIndex}-${i}`} 
                    onClick={() => setSimulationItem(slot!)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border border-tertiary/30 bg-surface-container-highest text-center p-1 relative group cursor-pointer transition-all ${
                      simulationItem?.data.name === slot!.data.name ? 'border-tertiary ring-1 ring-tertiary' : ''
                    }`}
                  >
                    {slot!.data.name}
                    <div className="absolute top-0.5 left-0.5 bg-tertiary text-white text-[8px] px-1 rounded">
                      R{roundIndex + 1}
                    </div>
                  </div>
                ));
            })}
            {/* Manually added */}
            {manuallyAddedTactics.map((t, i) => (
              <div 
                key={`manual-${i}`} 
                onClick={() => setSimulationItem({ type: 'tactic', data: t })}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border border-outline-variant/30 text-center p-1 relative group cursor-pointer transition-all ${
                  simulationItem?.data.name === t.name ? 'border-tertiary ring-1 ring-tertiary' : 'bg-surface-container-highest'
                }`}
              >
                {t.name}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setManuallyAddedTactics(prev => prev.filter((_, idx) => idx !== i));
                    if (simulationItem?.data.name === t.name) setSimulationItem(null);
                  }}
                  className="absolute top-0.5 right-0.5 bg-error/90 text-white rounded-full p-1 shadow-sm hover:bg-error transition-all hidden group-hover:block z-10"
                >
                  <X className="w-3 h-3 stroke-[3] text-black" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Selection Area */}
      <div className="w-2/3 bg-surface-container-low rounded-2xl p-6 flex flex-col border border-outline-variant/20 shadow-sm">
        {/* Tabs & Reset */}
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-2">
          <div className="flex bg-surface-container-highest rounded-xl p-1">
            <button
              onClick={() => setViewMode('rounds')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === 'rounds'
                  ? 'bg-surface shadow-sm text-primary'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              选择武将战法
            </button>
            <button
              onClick={() => setViewMode('recommendations')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === 'recommendations'
                  ? 'bg-surface shadow-sm text-primary'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              阵容推荐
            </button>
          </div>
          {resetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-error text-on-error rounded-lg font-bold text-xs hover:brightness-110 transition-all"
              >
                确定重置
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 bg-surface-container-highest text-outline rounded-lg font-bold text-xs hover:text-on-surface transition-all"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="flex items-center gap-1 px-3 py-2 text-error hover:bg-error/10 rounded-lg transition-colors font-bold text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              重置全部
            </button>
          )}
        </div>

        {/* Round Selection Tabs (only visible in rounds mode) */}
        {viewMode === 'rounds' && (
          <div className="flex gap-1 overflow-x-auto pb-4 scrollbar-hide">
            {Array(7).fill(0).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentRound(i)}
                className={`px-4 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all border-2 ${
                  currentRound === i
                    ? 'bg-primary border-primary text-white shadow-sm' 
                    : selectedGroups[i] !== null
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-surface-container-highest border-transparent text-black'
                }`}
              >
                第 {i + 1} 轮
              </button>
            ))}
          </div>
        )}

        {/* Groups / Recommendations */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
          {viewMode === 'rounds' ? (
            roundsData[currentRound].map((group, groupIndex) => {
              const isSelected = selectedGroups[currentRound] === groupIndex;
              
              return (
                <div 
                  key={groupIndex} 
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 relative ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/30'
                  } ${groupIndex === 5 ? 'bg-[#ffead0] border-[3px] border-[#ffbc00]' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-lg text-gray-700 shrink-0">
                    {groupIndex + 1}
                  </div>
                  
                  <div className="flex-1 flex gap-4">
                    {group.map((slot, slotIndex) => {
                      const matchInfo = getBestMatchForSlot(slot);
                      const isSlotSelected = slot && simulationItem?.data.name === slot.data.name && simulationItem?.type === slot.type;
                      return (
                        <div key={slotIndex} className="flex-1 flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (slot) {
                                setSimulationItem(slot);
                              } else {
                                handleOpenModal('slot', currentRound, groupIndex, slotIndex);
                              }
                            }}
                            className={`w-full aspect-[2/1] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors relative group overflow-hidden ${
                              slot 
                                ? isSlotSelected
                                  ? 'border-solid border-primary bg-primary/10'
                                  : 'border-solid border-primary/30 bg-surface-container-highest hover:border-primary/50'
                                : 'border-outline-variant/50 hover:border-primary/50 hover:bg-surface-container-highest'
                            }`}
                          >
                            {slot ? (
                              <>
                                {matchInfo && matchInfo.maxScore > 0 && (
                                  <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-green-700 font-bold whitespace-nowrap">
                                    匹配度: {matchInfo.maxScore}%
                                  </div>
                                )}
                                <div className="flex flex-col items-center gap-1 p-2 text-center mt-3">
                                  <span className="text-xs text-gray-500 font-bold">
                                    {slot.type === 'general' ? '武将' : '战法'}
                                  </span>
                                  <span className="font-bold text-sm text-gray-900 line-clamp-2">{slot.data.name}</span>
                                </div>
                                <div className="absolute top-1 right-1 flex gap-1 hidden group-hover:flex z-10">
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenModal('slot', currentRound, groupIndex, slotIndex);
                                    }}
                                    className="bg-surface-container-highest text-black rounded-full p-1 shadow-sm hover:bg-surface-container-highest/80 transition-all"
                                    title="切换"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </div>
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newRounds = [...roundsData];
                                      newRounds[currentRound][groupIndex][slotIndex] = null;
                                      setRoundsData(newRounds);
                                      saveToLocalStorage(newRounds, selectedGroups);
                                    }}
                                    className="bg-surface-container-highest text-black rounded-full p-1 shadow-sm hover:bg-surface-container-highest/80 transition-all"
                                    title="移除"
                                  >
                                    <X className="w-3 h-3 stroke-[3]" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Plus className="w-6 h-6 text-gray-400" />
                                <span className="text-sm font-bold text-gray-500">添加</span>
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleSelectGroup(currentRound, groupIndex)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all shrink-0 ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-white hover:shadow-md hover:brightness-110'
                    }`}
                  >
                    {isSelected ? '已选择' : '选择此组'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {normalizedTeams
                .map(team => ({ team, score: calculateMatchScore(team) }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(({ team, score }, idx) => (
                  <div key={idx} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{team.name}</h4>
                        {team.badge && (
                          <span className="inline-block px-2 py-0.5 bg-surface-container-high text-outline text-[10px] font-bold rounded-sm">
                            {team.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        匹配度: {score}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      {team.generals.map((gen: any, gIdx: number) => {
                        const hasGeneral = warehouseGenerals.some(g => g.name === gen.name);
                        return (
                          <div key={gIdx} className="text-xs flex items-center gap-2">
                            <span className={`font-bold ${hasGeneral ? 'text-green-600' : 'text-gray-700'}`}>{gen.name}</span>
                            <div className="flex flex-wrap gap-1">
                              {gen.tactics.map((tac: string, tIdx: number) => {
                                const hasTactic = warehouseTactics.some(t => t.name === tac);
                                return (
                                  <span key={tIdx} className={`px-1.5 py-0.5 rounded text-[10px] ${hasTactic ? 'bg-green-100 text-green-700' : 'bg-surface-container-highest text-gray-500'}`}>
                                    {tac}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Simulation Module */}
        {viewMode === 'rounds' && simulationItem && (
          <div className="mt-6 pt-6 border-t border-outline-variant/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                <Search className="w-5 h-5 text-primary" />
                关联阵容: {simulationItem.data.name}
              </h3>
              <button 
                onClick={() => setSimulationItem(null)}
                className="text-xs text-gray-500 hover:text-primary font-medium"
              >
                清除演算
              </button>
            </div>
            
            {(() => {
              const matchingTeams = normalizedTeams.filter(team => {
                if (simulationItem.type === 'general') {
                  return team.generals?.some((g: any) => g.name === simulationItem.data.name);
                } else {
                  return team.generals?.some((g: any) => g.tactics?.includes(simulationItem.data.name));
                }
              });

              if (matchingTeams.length === 0) {
                return (
                  <div className="text-center text-outline py-8 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                    无关联阵容
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matchingTeams.map((team, idx) => {
                    const score = calculateMatchScore(team, simulationItem);
                    // Only filter out if score is 0 AND it's not the simulation item itself
                    // But the user said "若只有自己，则不算", so if score is 0, it's not a match.
                    if (score === 0) return null;

                    const warehouseGeneralNames = [
                      ...manuallyAddedGenerals,
                      ...selectedGroups.flatMap((groupIndex, roundIndex) => {
                        if (groupIndex === null) return [];
                        return roundsData[roundIndex][groupIndex]
                          .filter(slot => slot?.type === 'general')
                          .map(slot => slot!.data);
                      }),
                      ...(simulationItem?.type === 'general' ? [simulationItem.data] : [])
                    ].map(g => g.name);

                    const warehouseTacticNames = [
                      ...manuallyAddedTactics,
                      ...selectedGroups.flatMap((groupIndex, roundIndex) => {
                        if (groupIndex === null) return [];
                        return roundsData[roundIndex][groupIndex]
                          .filter(slot => slot?.type === 'tactic')
                          .map(slot => slot!.data);
                      }),
                      ...(simulationItem?.type === 'tactic' ? [simulationItem.data] : [])
                    ].map(t => t.name);

                    return (
                      <div key={idx} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900">{team.name}</h4>
                            {team.badge && (
                              <span className="inline-block px-2 py-0.5 bg-surface-container-high text-outline text-[10px] font-bold rounded-sm">
                                {team.badge}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${score > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            匹配度: {score}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          {team.generals.map((gen: any, gIdx: number) => (
                            <div key={gIdx} className="text-xs flex items-center gap-2">
                              <span className={`font-bold whitespace-nowrap ${warehouseGeneralNames.includes(gen.name) ? 'text-green-600' : 'text-gray-700'}`}>
                                {gen.name}
                              </span>
                              <div className="flex flex-wrap gap-1 overflow-x-auto whitespace-nowrap max-w-[200px] scrollbar-hide">
                                {gen.tactics.map((tac: string, tIdx: number) => (
                                  <span 
                                    key={tIdx} 
                                    className={`px-1.5 py-0.5 rounded bg-surface-container-highest border border-outline-variant/20 ${warehouseTacticNames.includes(tac) ? 'text-green-600 font-bold' : 'text-gray-500'}`}
                                  >
                                    {tac}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="p-4 border-b border-outline-variant/20 flex gap-4 items-center bg-surface-container-low">
              <div className="flex bg-surface-container-highest rounded-lg p-1">
                <button
                  onClick={() => setModalTab('general')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${modalTab === 'general' ? 'bg-surface shadow text-primary' : 'text-outline hover:text-on-surface'}`}
                >
                  武将
                </button>
                <button
                  onClick={() => setModalTab('tactic')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${modalTab === 'tactic' ? 'bg-surface shadow text-primary' : 'text-outline hover:text-on-surface'}`}
                >
                  战法
                </button>
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="text"
                  placeholder={`搜索${modalTab === 'general' ? '武将' : '战法'}，支持多个同时搜索…`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-highest rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-highest rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {modalTab === 'general' ? (
                  filteredGenerals.map((g, i) => {
                    const isAlreadyInWarehouse = manuallyAddedGenerals.some(mg => mg.name === g.name);
                    const isAlreadyInSlots = roundsData.some(round => round.some(group => group.some(slot => slot?.data.name === g.name)));
                    const isSelected = tempSelectedItems.some(item => (item.data ? item.data.name : item.name) === g.name);
                    const isDisabled = isAlreadyInWarehouse || isAlreadyInSlots;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectItem(g, 'general')}
                        disabled={isDisabled}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-colors border relative ${
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : isDisabled
                              ? 'bg-surface-container-highest border-outline-variant/10 text-outline opacity-50 cursor-not-allowed'
                              : 'bg-surface-container-highest border-outline-variant/20 hover:bg-primary/5 hover:border-primary/50 text-on-surface'
                        }`}
                      >
                        {isAlreadyInSlots ? (
                          <span className="absolute top-1 right-1 text-[8px] bg-secondary text-white px-1 rounded font-bold">
                            已录入
                          </span>
                        ) : isAlreadyInWarehouse ? (
                          <span className="absolute top-1 right-1 text-[8px] bg-green-500 text-white px-1 rounded font-bold">
                            已入库
                          </span>
                        ) : null}
                        <span className="font-bold text-sm">{g.name}</span>
                        <span className="text-xs opacity-60 mt-1">{g.season}</span>
                      </button>
                    );
                  })
                ) : (
                  filteredTactics.map((t, i) => {
                    const isAlreadyInWarehouse = manuallyAddedTactics.some(mt => mt.name === t.name);
                    const isAlreadyInSlots = roundsData.some(round => round.some(group => group.some(slot => slot?.data.name === t.name)));
                    const isSelected = tempSelectedItems.some(item => (item.data ? item.data.name : item.name) === t.name);
                    const isDisabled = isAlreadyInWarehouse || isAlreadyInSlots;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectItem(t, 'tactic')}
                        disabled={isDisabled}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-colors border relative ${
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : isDisabled
                              ? 'bg-surface-container-highest border-outline-variant/10 text-outline opacity-50 cursor-not-allowed'
                              : 'bg-surface-container-highest border-outline-variant/20 hover:bg-primary/5 hover:border-primary/50 text-on-surface'
                        }`}
                      >
                        {isAlreadyInSlots ? (
                          <span className="absolute top-1 right-1 text-[8px] bg-secondary text-white px-1 rounded font-bold">
                            已录入
                          </span>
                        ) : isAlreadyInWarehouse ? (
                          <span className="absolute top-1 right-1 text-[8px] bg-green-500 text-white px-1 rounded font-bold">
                            已入库
                          </span>
                        ) : null}
                        <span className="font-bold text-sm">{t.name}</span>
                        <span className="text-xs opacity-60 mt-1">{t.type}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            
            {(modalTarget?.dest === 'warehouse_general' || modalTarget?.dest === 'warehouse_tactic' || modalTarget?.dest === 'slot') && (
              <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex flex-col gap-2">
                <div className="text-xs text-center text-on-surface-variant font-bold">
                  已选择 {tempSelectedItems.length} 个{modalTarget?.dest === 'slot' ? '项目' : (modalTab === 'general' ? '武将' : '战法')}
                </div>
                <button
                  onClick={handleConfirmModal}
                  disabled={tempSelectedItems.length === 0}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalTarget?.dest === 'slot' ? '确认选择' : '加入仓库'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
