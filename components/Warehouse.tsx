"use client";

import { useState } from 'react';
import { wujiangData } from '@/lib/wujiang_data';
import { zhanfaData } from '@/lib/zhanfa_data';
import { Search, Download, Upload } from 'lucide-react';

interface WarehouseProps {
  collectedGenerals: string[];
  collectedTactics: string[];
  toggleCollectGeneral: (name: string) => void;
  toggleCollectTactic: (name: string) => void;
  onGeneralClick: (name: string) => void;
  onTacticClick: (name: string) => void;
  onExport: () => void;
  onImport: () => void;
  onQuickImport?: () => void;
  allGenerals?: any[];
  allTactics?: any[];
}

export default function Warehouse({ 
  collectedGenerals, 
  collectedTactics, 
  toggleCollectGeneral, 
  toggleCollectTactic, 
  onGeneralClick, 
  onTacticClick,
  onExport,
  onImport,
  onQuickImport,
  allGenerals = wujiangData,
  allTactics = zhanfaData
}: WarehouseProps) {
  const [activeTab, setActiveTab] = useState<'generals' | 'tactics'>('generals');
  const [searchQuery, setSearchQuery] = useState('');

  const generals = allGenerals.filter(w => 
    (collectedGenerals || []).includes(w.name) && 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const tactics = allTactics.filter(z => 
    (collectedTactics || []).includes(z.name) && 
    (z.name.toLowerCase().includes(searchQuery.toLowerCase()) || z.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Sticky Header */}
      <div className="p-6 md:p-10 pb-4 border-b border-outline-variant/10 bg-surface z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold text-on-surface font-headline">我的仓库</h2>
            <div className="flex gap-2">
              <button 
                onClick={onQuickImport}
                className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 text-xs font-bold"
                title="快捷录入"
              >
                <Upload className="w-4 h-4" />
                快捷录入
              </button>
              <button 
                onClick={onExport}
                className="p-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-all flex items-center gap-2 text-xs font-bold"
                title="导出仓库"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
              <button 
                onClick={onImport}
                className="p-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-all flex items-center gap-2 text-xs font-bold"
                title="导入仓库"
              >
                <Upload className="w-4 h-4" />
                导入
              </button>
            </div>
          </div>
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder={activeTab === 'generals' ? "搜索已收录武将..." : "搜索已收录战法..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-high border-none rounded-lg px-4 py-2 w-64 text-sm focus:ring-2 focus:ring-secondary transition-all outline-none"
            />
            <Search className="absolute right-3 text-outline w-4 h-4" />
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('generals')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'generals' ? 'bg-primary text-white shadow-md' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
          >
            武将 ({collectedGenerals.length})
          </button>
          <button 
            onClick={() => setActiveTab('tactics')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'tactics' ? 'bg-primary text-white shadow-md' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
          >
            战法 ({collectedTactics.length})
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-4">
        {activeTab === 'generals' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generals.length > 0 ? (
            generals.map(general => (
              <div 
                key={general.name} 
                className="bg-surface-container-lowest p-4 rounded-lg border-l-4 border-primary shadow-sm cursor-pointer hover:shadow-md transition-all flex justify-between items-center" 
                onClick={() => onGeneralClick(general.name)}
              >
                <p className="font-bold text-lg">{general.name}</p>
                {general.season && general.season !== 'S1' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-outline rounded font-bold">
                    {general.season}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-outline">
              <p>未找到匹配的已收录武将</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tactics.length > 0 ? (
            tactics.map(tactic => (
              <div 
                key={tactic.name} 
                className="bg-surface-container-lowest p-4 rounded-lg border-l-4 border-secondary shadow-sm cursor-pointer hover:shadow-md transition-all flex justify-between items-center" 
                onClick={() => onTacticClick(tactic.name)}
              >
                <p className="font-bold text-lg">{tactic.name}</p>
                {tactic.season && tactic.season !== 'S1' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-outline rounded font-bold">
                    {tactic.season}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-outline">
              <p>未找到匹配的已收录战法</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
