"use client";

import { useState } from 'react';
import { Plus, Search, X, Check, Shield, Swords } from 'lucide-react';

interface MockBattleProps {
  allGenerals: any[];
  allTactics: any[];
}

type SlotItem = { type: 'general' | 'tactic'; data: any };

export default function MockBattle({ allGenerals, allTactics }: MockBattleProps) {
  const [warehouseGenerals, setWarehouseGenerals] = useState<any[]>([]);
  const [warehouseTactics, setWarehouseTactics] = useState<any[]>([]);
  
  const [currentRound, setCurrentRound] = useState(0);
  // roundsData[roundIndex][groupIndex][slotIndex]
  const [roundsData, setRoundsData] = useState<(SlotItem | null)[][][]>(
    Array(6).fill(null).map(() => Array(3).fill(null).map(() => Array(3).fill(null)))
  );
  const [selectedGroups, setSelectedGroups] = useState<(number | null)[]>(Array(6).fill(null));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{
    dest: 'warehouse_general' | 'warehouse_tactic' | 'slot';
    roundIndex?: number;
    groupIndex?: number;
    slotIndex?: number;
  } | null>(null);

  const [modalTab, setModalTab] = useState<'general' | 'tactic'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenModal = (dest: 'warehouse_general' | 'warehouse_tactic' | 'slot', roundIndex?: number, groupIndex?: number, slotIndex?: number) => {
    setModalTarget({ dest, roundIndex, groupIndex, slotIndex });
    if (dest === 'warehouse_general') setModalTab('general');
    if (dest === 'warehouse_tactic') setModalTab('tactic');
    setIsModalOpen(true);
    setSearchQuery('');
  };

  const handleSelectItem = (item: any, type: 'general' | 'tactic') => {
    if (!modalTarget) return;

    if (modalTarget.dest === 'warehouse_general') {
      setWarehouseGenerals(prev => [...prev, item]);
    } else if (modalTarget.dest === 'warehouse_tactic') {
      setWarehouseTactics(prev => [...prev, item]);
    } else if (modalTarget.dest === 'slot') {
      const newRounds = [...roundsData];
      newRounds[modalTarget.roundIndex!][modalTarget.groupIndex!][modalTarget.slotIndex!] = { type, data: item };
      setRoundsData(newRounds);
    }
    setIsModalOpen(false);
  };

  const handleSelectGroup = (roundIndex: number, groupIndex: number) => {
    const group = roundsData[roundIndex][groupIndex];
    const newGenerals = [...warehouseGenerals];
    const newTactics = [...warehouseTactics];

    group.forEach(slot => {
      if (slot) {
        if (slot.type === 'general') newGenerals.push(slot.data);
        if (slot.type === 'tactic') newTactics.push(slot.data);
      }
    });

    setWarehouseGenerals(newGenerals);
    setWarehouseTactics(newTactics);

    const newSelected = [...selectedGroups];
    newSelected[roundIndex] = groupIndex;
    setSelectedGroups(newSelected);

    if (roundIndex < 5) {
      setCurrentRound(roundIndex + 1);
    }
  };

  const filteredGenerals = allGenerals.filter(g => g.name.includes(searchQuery));
  const filteredTactics = allTactics.filter(t => t.name.includes(searchQuery));

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
            {warehouseGenerals.map((g, i) => (
              <div key={i} className="aspect-square bg-surface-container-highest rounded-lg flex items-center justify-center text-sm font-bold border border-outline-variant/30 text-center p-1 relative group">
                {g.name}
                <button 
                  onClick={() => setWarehouseGenerals(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-error text-on-error rounded-full p-0.5 hidden group-hover:block z-10"
                >
                  <X className="w-3 h-3" />
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
            {warehouseTactics.map((t, i) => (
              <div key={i} className="aspect-square bg-surface-container-highest rounded-lg flex items-center justify-center text-sm font-bold border border-outline-variant/30 text-center p-1 relative group">
                {t.name}
                <button 
                  onClick={() => setWarehouseTactics(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-error text-on-error rounded-full p-0.5 hidden group-hover:block z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Selection Area */}
      <div className="w-2/3 bg-surface-container-low rounded-2xl p-6 flex flex-col border border-outline-variant/20 shadow-sm">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {Array(6).fill(0).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentRound(i)}
              className={`px-6 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                currentRound === i 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : selectedGroups[i] !== null
                    ? 'bg-surface-container-highest text-primary/70 border border-primary/20'
                    : 'bg-surface-container-highest text-outline hover:text-on-surface hover:bg-surface-container-highest/80'
              }`}
            >
              第 {i + 1} 轮
              {selectedGroups[i] !== null && <Check className="w-4 h-4 inline-block ml-2" />}
            </button>
          ))}
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
          {roundsData[currentRound].map((group, groupIndex) => {
            const isRoundCompleted = selectedGroups[currentRound] !== null;
            const isSelected = selectedGroups[currentRound] === groupIndex;
            const isDisabled = isRoundCompleted && !isSelected;

            return (
              <div 
                key={groupIndex} 
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : isDisabled 
                      ? 'border-outline-variant/20 opacity-50 grayscale' 
                      : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/30'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-lg text-outline shrink-0">
                  {groupIndex + 1}
                </div>
                
                <div className="flex-1 flex gap-4">
                  {group.map((slot, slotIndex) => (
                    <button
                      key={slotIndex}
                      disabled={isRoundCompleted}
                      onClick={() => handleOpenModal('slot', currentRound, groupIndex, slotIndex)}
                      className={`flex-1 aspect-[2/1] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors relative group ${
                        slot 
                          ? 'border-solid border-primary/30 bg-surface-container-highest' 
                          : 'border-outline-variant/50 hover:border-primary/50 hover:bg-surface-container-highest'
                      }`}
                    >
                      {slot ? (
                        <>
                          <div className="flex flex-col items-center gap-1 p-2 text-center">
                            <span className="text-xs text-outline font-medium">
                              {slot.type === 'general' ? '武将' : '战法'}
                            </span>
                            <span className="font-bold text-sm line-clamp-2">{slot.data.name}</span>
                          </div>
                          {!isRoundCompleted && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                const newRounds = [...roundsData];
                                newRounds[currentRound][groupIndex][slotIndex] = null;
                                setRoundsData(newRounds);
                              }}
                              className="absolute -top-2 -right-2 bg-error text-on-error rounded-full p-0.5 hidden group-hover:block z-10"
                            >
                              <X className="w-3 h-3" />
                            </div>
                          )}
                        </>
                      ) : (
                        <Plus className="w-6 h-6 text-outline-variant" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  disabled={isRoundCompleted}
                  onClick={() => handleSelectGroup(currentRound, groupIndex)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : isDisabled
                        ? 'bg-surface-container-highest text-outline-variant cursor-not-allowed'
                        : 'bg-secondary text-on-secondary hover:shadow-md hover:brightness-110'
                  }`}
                >
                  {isSelected ? '已选择' : '选择此组'}
                </button>
              </div>
            );
          })}
        </div>
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
                  placeholder={`搜索${modalTab === 'general' ? '武将' : '战法'}...`}
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
                  filteredGenerals.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectItem(g, 'general')}
                      className="aspect-square bg-surface-container-highest rounded-lg flex flex-col items-center justify-center p-2 hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/20"
                    >
                      <span className="font-bold text-sm">{g.name}</span>
                      <span className="text-xs opacity-60 mt-1">{g.season}</span>
                    </button>
                  ))
                ) : (
                  filteredTactics.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectItem(t, 'tactic')}
                      className="aspect-square bg-surface-container-highest rounded-lg flex flex-col items-center justify-center p-2 hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/20"
                    >
                      <span className="font-bold text-sm">{t.name}</span>
                      <span className="text-xs opacity-60 mt-1">{t.type}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
