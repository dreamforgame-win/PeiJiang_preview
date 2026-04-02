"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Bell, Settings, Users, Medal, BookOpen, Library, 
  Compass, Plus, List, Quote, Share2, Heart, Swords, 
  Shield, Zap, Book, Clock, BarChart2, Edit, ChevronRight, ChevronDown, Download,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { teams } from '@/lib/data';
import GeneralGallery from '@/components/GeneralGallery';
import ZhanfaLibrary from '@/components/ZhanfaLibrary';
import Warehouse from '@/components/Warehouse';
import { usePersistentCollection, usePersistentState } from '@/lib/hooks';
import DetailModal from '@/components/DetailModal';
import TeamEditorModal from '@/components/TeamEditorModal';
import ExportModal from '@/components/ExportModal';
import ImportModal from '@/components/ImportModal';
import { wujiangData } from '@/lib/wujiang_data';
import { zhanfaData } from '@/lib/zhanfa_data';

import GenericExportModal from '@/components/GenericExportModal';
import GenericImportModal from '@/components/GenericImportModal';
import QuickEntryModal from '@/components/QuickEntryModal';
import ShareCodeModal from '@/components/ShareCodeModal';
import MockBattle from '@/components/MockBattle';
import { generateShareCode } from '@/lib/shareCode';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [allTeams, setAllTeams] = usePersistentState('allTeams', teams);
  const [activeTeamId, setActiveTeamId] = useState(allTeams[0]?.id || teams[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'teams' | 'generals' | 'zhanfa' | 'collection' | 'mockBattle'>('teams');
  const [teamSubTab, setTeamSubTab] = useState<'all' | 'recommended' | 'custom'>('all');
  const [isTeamsExpanded, setIsTeamsExpanded] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGeneralExportOpen, setIsGeneralExportOpen] = useState(false);
  const [isGeneralImportOpen, setIsGeneralImportOpen] = useState(false);
  const [isTacticExportOpen, setIsTacticExportOpen] = useState(false);
  const [isTacticImportOpen, setIsTacticImportOpen] = useState(false);
  const [isWarehouseExportOpen, setIsWarehouseExportOpen] = useState(false);
  const [isWarehouseImportOpen, setIsWarehouseImportOpen] = useState(false);
  const [isShareCodeModalOpen, setIsShareCodeModalOpen] = useState(false);
  const [currentShareCode, setCurrentShareCode] = useState('');

  const [selectedGeneral, setSelectedGeneral] = useState<typeof wujiangData[0] | null>(null);
  const [selectedTactic, setSelectedTactic] = useState<typeof zhanfaData[0] | null>(null);
  
  const [isTeamEditorOpen, setIsTeamEditorOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  
  const [collectedGenerals, toggleCollectGeneral, setCollectedGenerals] = usePersistentCollection('collectedGenerals', []);
  const [collectedTactics, toggleCollectTactic, setCollectedTactics] = usePersistentCollection('collectedTactics', []);
  const [customGenerals, setCustomGenerals] = usePersistentState<any[]>('customGenerals', []);
  const [customTactics, setCustomTactics] = usePersistentState<any[]>('customTactics', []);

  const [isGeneralQuickEntryOpen, setIsGeneralQuickEntryOpen] = useState(false);
  const [isTacticQuickEntryOpen, setIsTacticQuickEntryOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [favoritedTeams, toggleFavoriteTeam] = usePersistentCollection('favoritedTeams', []);

  const allGenerals = [
    ...customGenerals.filter(cg => !wujiangData.some(wg => wg.name === cg.name)),
    ...wujiangData
  ];
  const allTactics = [
    ...customTactics.filter(ct => !zhanfaData.some(zt => zt.name === ct.name)),
    ...zhanfaData
  ];

  const handleQuickEntry = async (type: 'general' | 'tactic', data: any) => {
    try {
      const response = await fetch('/api/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      if (type === 'general') {
        setCustomGenerals(prev => [...prev, data]);
        toggleCollectGeneral(data.name);
        showToast('武将录入成功！');
      } else {
        setCustomTactics(prev => [...prev, data]);
        toggleCollectTactic(data.name);
        showToast('战法录入成功！');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      showToast('录入失败，请重试', 'error');
      throw error;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Data Migration: Rename 甄姬 to 甄洛
  useEffect(() => {
    if (mounted) {
      const migrateName = (name: string) => name === '甄姬' ? '甄洛' : name;
      
      // 1. Migrate collectedGenerals
      const hasOldGeneral = collectedGenerals.includes('甄姬');
      if (hasOldGeneral) {
        setCollectedGenerals(prev => prev.map(migrateName));
      }
      
      // 2. Migrate allTeams
      const needsTeamMigration = allTeams.some(team => 
        team.desc.includes('甄姬') || 
        team.config.some((c: any) => c.武将 === '甄姬')
      );
      if (needsTeamMigration) {
        setAllTeams(prev => prev.map(team => ({
          ...team,
          desc: team.desc.replace(/甄姬/g, '甄洛'),
          config: team.config.map((c: any) => ({
            ...c,
            武将: migrateName(c.武将)
          }))
        })));
      }
      
      // 3. Migrate customGenerals
      const hasOldCustomGeneral = customGenerals.some(g => g.name === '甄姬');
      if (hasOldCustomGeneral) {
        setCustomGenerals(prev => prev.map(g => ({
          ...g,
          name: migrateName(g.name)
        })));
      }
    }
  }, [mounted, collectedGenerals, allTeams, customGenerals, setCollectedGenerals, setAllTeams, setCustomGenerals]);

  const handleGeneralClick = (name: string) => {
    const general = wujiangData.find(w => w.name === name);
    if (general) setSelectedGeneral(general);
  };

  const handleTacticClick = (name: string) => {
    const tactic = zhanfaData.find(z => z.name === name);
    if (tactic) setSelectedTactic(tactic);
  };

  const calculateMatchPercentage = (team: any) => {
    let score = 0;
    let generalMatches = 0;
    let tacticMatches = 0;

    team.config.forEach((general: any) => {
      const isGeneralCollected = collectedGenerals.includes(general.武将);
      if (isGeneralCollected) {
        score += 11;
        generalMatches++;
        
        const tactics = general.技能.split('\n');
        let matchesForThisGeneral = 0;
        tactics.forEach((tacticName: string) => {
          const tactic = zhanfaData.find(z => tacticName.includes(z.name));
          if (tactic && collectedTactics.includes(tactic.name)) {
            matchesForThisGeneral++;
          }
        });
        
        score += Math.min(matchesForThisGeneral, 2) * 11;
        tacticMatches += Math.min(matchesForThisGeneral, 2);
      }
    });

    if (generalMatches === 3 && tacticMatches === 6) return 100;
    return Math.min(score, 100);
  };

  const filteredTeams = useMemo(() => {
    const teamsWithMatch = allTeams.map(team => ({
      ...team,
      matchPercentage: mounted ? calculateMatchPercentage(team) : 0,
      isFavorited: favoritedTeams.includes(team.id)
    }));

    const filtered = teamsWithMatch.filter((team: any) => {
      // Filter by sub-tab
      if (teamSubTab === 'recommended' && team.isCustom) return false;
      if (teamSubTab === 'custom' && !team.isCustom) return false;

      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return team.name.toLowerCase().includes(query) ||
             team.config.some((general: any) => 
               general.武将.toLowerCase().includes(query) ||
               general.技能.toLowerCase().includes(query)
             );
    });

    if (mounted) {
      filtered.sort((a, b) => {
        if (a.isFavorited && !b.isFavorited) return -1;
        if (!a.isFavorited && b.isFavorited) return 1;
        return b.matchPercentage - a.matchPercentage;
      });
    }
    return filtered;
  }, [allTeams, mounted, favoritedTeams, teamSubTab, searchQuery, collectedGenerals, collectedTactics]);

  useEffect(() => {
    if (mounted && filteredTeams.length > 0) {
      // Always ensure something is selected, and if the current one is gone, pick the first
      const exists = filteredTeams.some(t => t.id === activeTeamId);
      if (!exists) {
        setActiveTeamId(filteredTeams[0].id);
      }
    }
  }, [filteredTeams, activeTeamId, mounted]);

  const prevFilters = useRef({ searchQuery, teamSubTab, activeTab });
  useEffect(() => {
    if (mounted && filteredTeams.length > 0) {
      const filtersChanged = 
        prevFilters.current.searchQuery !== searchQuery || 
        prevFilters.current.teamSubTab !== teamSubTab || 
        prevFilters.current.activeTab !== activeTab;
      
      if (filtersChanged) {
        setActiveTeamId(filteredTeams[0].id);
        prevFilters.current = { searchQuery, teamSubTab, activeTab };
      }
    }
  }, [searchQuery, teamSubTab, activeTab, mounted, filteredTeams]);

  const activeTeam = filteredTeams.find(t => t.id === activeTeamId) || filteredTeams[0];

  const handleSaveTeam = (newTeam: any) => {
    const teamToSave = { ...newTeam, isCustom: true };
    setAllTeams((prev: any[]) => {
      const index = prev.findIndex(t => t.id === teamToSave.id);
      if (index >= 0) {
        const newList = [...prev];
        newList[index] = teamToSave;
        return newList;
      }
      return [...prev, teamToSave];
    });
    setActiveTeamId(teamToSave.id);
  };

  const handleImportTeams = (importedTeams: any[]) => {
    let success = 0;
    let duplicate = 0;
    let failed = 0;

    setAllTeams((prev: any[]) => {
      const newList = [...prev];
      importedTeams.forEach(team => {
        try {
          // Check for duplicates by name or id
          const isDuplicate = prev.some(t => t.name === team.name || t.id === team.id);
          if (isDuplicate) {
            duplicate++;
          } else {
            // Ensure unique ID for imported teams if they don't have one or it's a collision
            const newTeam = { 
              ...team, 
              id: team.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              isCustom: true 
            };
            newList.push(newTeam);
            success++;
          }
        } catch (e) {
          failed++;
        }
      });
      return newList;
    });

    return { success, duplicate, failed };
  };

  const handleExportData = (type: 'generals' | 'tactics' | 'warehouse', selectedIds: string[]) => {
    let data: any;
    let filename: string;
    
    const getFullGeneral = (name: string) => {
      const g = allGenerals.find(w => w.name === name);
      if (!g) return null;
      return { ...g, isCollected: collectedGenerals.includes(name) };
    };

    const getFullTactic = (name: string) => {
      const t = allTactics.find(z => z.name === name);
      if (!t) return null;
      return { ...t, isCollected: collectedTactics.includes(name) };
    };

    if (type === 'generals') {
      data = selectedIds.map(id => getFullGeneral(id)).filter(Boolean);
      filename = `generals_export_${new Date().toISOString().slice(0, 10)}.json`;
    } else if (type === 'tactics') {
      data = selectedIds.map(id => getFullTactic(id)).filter(Boolean);
      filename = `tactics_export_${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      // Warehouse
      const generals = selectedIds
        .filter(id => id.startsWith('g:'))
        .map(id => getFullGeneral(id.replace('g:', '')))
        .filter(Boolean);
      const tactics = selectedIds
        .filter(id => id.startsWith('t:'))
        .map(id => getFullTactic(id.replace('t:', '')))
        .filter(Boolean);
      data = { generals, tactics };
      filename = `warehouse_export_${new Date().toISOString().slice(0, 10)}.json`;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    
    if (type === 'generals') setIsGeneralExportOpen(false);
    else if (type === 'tactics') setIsTacticExportOpen(false);
    else setIsWarehouseExportOpen(false);
  };

  const handleImportData = (type: 'generals' | 'tactics' | 'warehouse', data: any) => {
    let success = 0;
    let duplicate = 0;
    let failed = 0;

    const processGeneral = (item: any, currentCollected: string[], currentCustom: any[]) => {
      const name = typeof item === 'string' ? item : item.name;
      if (!name) return false;

      // If it's an object and has isCollected property, respect it, otherwise assume true
      const shouldCollect = typeof item === 'object' && item.hasOwnProperty('isCollected') ? item.isCollected : true;

      if (currentCollected.includes(name)) {
        duplicate++;
        return false;
      }

      const isBuiltIn = wujiangData.some(w => w.name === name);
      if (isBuiltIn) {
        if (shouldCollect) currentCollected.push(name);
        success++;
        return true;
      } else if (typeof item === 'object') {
        // Custom general
        currentCustom.push(item);
        if (shouldCollect) currentCollected.push(name);
        success++;
        return true;
      } else {
        failed++;
        return false;
      }
    };

    const processTactic = (item: any, currentCollected: string[], currentCustom: any[]) => {
      const name = typeof item === 'string' ? item : item.name;
      if (!name) return false;

      // If it's an object and has isCollected property, respect it, otherwise assume true
      const shouldCollect = typeof item === 'object' && item.hasOwnProperty('isCollected') ? item.isCollected : true;

      if (currentCollected.includes(name)) {
        duplicate++;
        return false;
      }

      const isBuiltIn = zhanfaData.some(z => z.name === name);
      if (isBuiltIn) {
        if (shouldCollect) currentCollected.push(name);
        success++;
        return true;
      } else if (typeof item === 'object') {
        // Custom tactic
        currentCustom.push(item);
        if (shouldCollect) currentCollected.push(name);
        success++;
        return true;
      } else {
        failed++;
        return false;
      }
    };

    if (type === 'generals') {
      if (!Array.isArray(data)) return { success: 0, duplicate: 0, failed: 1 };
      const newCollected = [...collectedGenerals];
      const newCustom = [...customGenerals];
      data.forEach((item: any) => processGeneral(item, newCollected, newCustom));
      setCollectedGenerals(newCollected);
      setCustomGenerals(newCustom);
    } else if (type === 'tactics') {
      if (!Array.isArray(data)) return { success: 0, duplicate: 0, failed: 1 };
      const newCollected = [...collectedTactics];
      const newCustom = [...customTactics];
      data.forEach((item: any) => processTactic(item, newCollected, newCustom));
      setCollectedTactics(newCollected);
      setCustomTactics(newCustom);
    } else {
      // Warehouse
      const newCollectedG = [...collectedGenerals];
      const newCustomG = [...customGenerals];
      const newCollectedT = [...collectedTactics];
      const newCustomT = [...customTactics];

      if (data.generals && Array.isArray(data.generals)) {
        data.generals.forEach((item: any) => processGeneral(item, newCollectedG, newCustomG));
      }
      if (data.tactics && Array.isArray(data.tactics)) {
        data.tactics.forEach((item: any) => processTactic(item, newCollectedT, newCustomT));
      }
      setCollectedGenerals(newCollectedG);
      setCustomGenerals(newCustomG);
      setCollectedTactics(newCollectedT);
      setCustomTactics(newCustomT);
    }

    return { success, duplicate, failed };
  };

  const handleGenerateShareCode = (selectedIds: string[]) => {
    const selectedTeams = allTeams.filter((t: any) => selectedIds.includes(t.id));
    const code = generateShareCode(selectedTeams);
    setCurrentShareCode(code);
    setIsShareCodeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 h-16 bg-white/80 backdrop-blur-md z-50 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-primary tracking-tight font-headline">
            ⚔️ 三谋配将助手
          </span>
        </div>
        <div className="flex items-center gap-6">
          {activeTab === 'teams' && (
            <div className="hidden md:flex relative items-center">
              <input 
                type="text" 
                placeholder="搜索名称或武将..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-container-high border-none rounded-lg px-4 py-2 w-64 text-sm focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-all outline-none"
              />
              <Search className="absolute right-3 text-outline w-4 h-4" />
            </div>
          )}
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="pt-16 flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 flex-col p-4 space-y-2 bg-surface-container-low z-40 border-r border-outline-variant/10">
          <nav className="flex-1 space-y-1 overflow-y-auto">
            <div className="space-y-1">
              <button 
                onClick={() => {
                  setActiveTab('teams');
                  setIsTeamsExpanded(!isTeamsExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 font-bold rounded-lg transition-all ${activeTab === 'teams' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-wider font-bold">配将推荐</span>
                </div>
                {isTeamsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              
              {isTeamsExpanded && (
                <div className="pl-6 space-y-1 mt-1">
                  <button 
                    onClick={() => { setActiveTab('teams'); setTeamSubTab('all'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'teams' && teamSubTab === 'all' ? 'text-primary bg-primary/5' : 'text-outline hover:text-primary hover:bg-surface-container-highest'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'teams' && teamSubTab === 'all' ? 'bg-primary' : 'bg-outline/40'}`} />
                    全部阵容
                  </button>
                  <button 
                    onClick={() => { setActiveTab('teams'); setTeamSubTab('recommended'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'teams' && teamSubTab === 'recommended' ? 'text-primary bg-primary/5' : 'text-outline hover:text-primary hover:bg-surface-container-highest'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'teams' && teamSubTab === 'recommended' ? 'bg-primary' : 'bg-outline/40'}`} />
                    推荐阵容
                  </button>
                  <button 
                    onClick={() => { setActiveTab('teams'); setTeamSubTab('custom'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'teams' && teamSubTab === 'custom' ? 'text-primary bg-primary/5' : 'text-outline hover:text-primary hover:bg-surface-container-highest'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'teams' && teamSubTab === 'custom' ? 'bg-primary' : 'bg-outline/40'}`} />
                    自建阵容
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveTab('generals')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === 'generals' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}
            >
              <Medal className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-bold">武将图鉴</span>
            </button>
            <button 
              onClick={() => setActiveTab('zhanfa')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === 'zhanfa' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-bold">战法图鉴</span>
            </button>
            <button 
              onClick={() => setActiveTab('collection')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === 'collection' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}
            >
              <Library className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-bold">我的仓库</span>
            </button>
            <button 
              onClick={() => setActiveTab('mockBattle')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === 'mockBattle' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}
            >
              <Swords className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-bold">演武模拟</span>
            </button>
          </nav>
          
          <div className="pt-4 space-y-2 border-t border-outline-variant/10">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-md font-bold text-sm hover:bg-outline-variant/50 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 rotate-180" />
              导入阵容
            </button>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="w-full bg-surface-container-highest text-on-surface py-2.5 rounded-md font-bold text-sm hover:bg-outline-variant/50 transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              导出阵容
            </button>
            <button 
              onClick={() => {
                setEditingTeam(null);
                setIsTeamEditorOpen(true);
              }}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-md font-bold shadow-lg hover:shadow-xl transform active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建阵容
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="md:ml-64 flex-1 flex flex-col bg-surface-container-low h-[calc(100vh-4rem)]">
          {activeTab === 'teams' ? (
            <div className="flex flex-1 overflow-hidden">
              {/* Middle Column: Team List */}
              <section className="w-full md:w-80 bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto flex-shrink-0">
                <div className="p-4 border-b border-outline-variant/10 bg-surface sticky top-0 z-10">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <List className="text-primary w-5 h-5" />
                    推荐阵容列表
                  </h3>
                </div>
                <div className="p-2 space-y-2">
                  {filteredTeams.map((team) => (
                    <div 
                      key={team.id}
                      onClick={() => setActiveTeamId(team.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all group ${
                        activeTeamId === team.id 
                          ? 'bg-surface-container-lowest shadow-sm border-l-4 border-primary' 
                          : 'hover:bg-surface-container-highest border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-lg font-bold font-headline transition-colors ${
                            activeTeamId === team.id ? 'text-on-surface font-extrabold' : 'text-on-surface group-hover:text-primary'
                          }`}>
                            {team.name}
                          </span>
                          {mounted && team.matchPercentage > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold bg-green-100 text-green-700 shrink-0">
                              匹配：{team.matchPercentage}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {team.isFavorited && (
                            <Heart className="w-3.5 h-3.5 text-primary fill-current" />
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold ${
                            activeTeamId === team.id 
                              ? 'bg-secondary-container text-on-secondary-container' 
                              : 'bg-surface-container-high text-outline'
                          }`}>
                            {team.badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-outline mt-1 line-clamp-1">{team.desc.split('\n')[0]}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Right Column: Team Details */}
              <section className="flex-1 overflow-y-auto p-6 md:p-10 bg-surface">
                {activeTeam ? (
                  <div className="max-w-6xl mx-auto pb-20 md:pb-0">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight font-headline">
                            {activeTeam.name}
                          </h1>
                          <span className="bg-primary text-white text-xs px-4 py-1.5 rounded-sm font-bold tracking-widest uppercase">
                            {activeTeam.badge}
                          </span>
                        </div>
                        <div className="relative pl-6 border-l-2 border-secondary py-2 h-16">
                          <p className="text-on-surface-variant font-medium leading-relaxed italic line-clamp-2">
                            {activeTeam.desc}
                          </p>
                          <Quote className="absolute -left-3 top-0 text-secondary bg-surface w-5 h-5 rounded-full" />
                        </div>
                      </div>
                      
                      <div className="flex gap-4 items-start shrink-0">
                        <button 
                          onClick={() => {
                            setEditingTeam(activeTeam);
                            setIsTeamEditorOpen(true);
                          }}
                          className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-md font-bold flex items-center gap-2 hover:bg-outline-variant/50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </button>
                        <button 
                          onClick={() => handleGenerateShareCode([activeTeam.id])}
                          className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-md font-bold flex items-center gap-2 hover:bg-outline-variant/50 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          分享
                        </button>
                        <button 
                          onClick={() => toggleFavoriteTeam(activeTeam.id)}
                          className={`px-8 py-3 rounded-md font-bold shadow-lg flex items-center gap-2 transform hover:-translate-y-1 transition-all ${
                            activeTeam.isFavorited 
                              ? 'bg-surface-container-highest text-primary border border-primary/20' 
                              : 'bg-gradient-to-r from-primary to-primary-container text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${activeTeam.isFavorited ? 'fill-current' : ''}`} />
                          {activeTeam.isFavorited ? '已收藏' : '收藏此阵容'}
                        </button>
                      </div>
                    </div>

                    {/* Generals Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {activeTeam.config.map((general: any, idx: number) => {
                        const generalData = allGenerals.find(w => w.name === general.武将);
                        return (
                        <div key={idx} className="bg-surface-container-lowest rounded-xl shadow-sm border-t-4 border-primary overflow-hidden transition-all hover:shadow-xl">
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h4 
                                className={`text-2xl font-black font-headline cursor-pointer hover:text-primary transition-colors ${(mounted && collectedGenerals.includes(general.武将)) ? 'text-green-600' : 'text-on-surface'}`}
                                onClick={() => generalData && setSelectedGeneral(generalData)}
                              >
                                {general.武将}
                                {generalData?.season && generalData.season !== 'S1' && (
                                  <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-surface-container-highest text-outline rounded font-bold align-middle">
                                    {generalData.season}
                                  </span>
                                )}
                              </h4>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-primary">
                                    <Swords className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">战法配置</span>
                                  </div>
                                  <div className="bg-surface-container-low p-3 rounded-lg">
                                    <div className="grid grid-cols-2 gap-2">
                                      {general.技能.split('\n').map((skillName: string, i: number) => {
                                        const tactic = zhanfaData.find(z => skillName.includes(z.name));
                                        const isCollected = mounted && tactic && collectedTactics.includes(tactic.name);
                                        return (
                                          <button
                                            key={i}
                                            onClick={() => tactic && setSelectedTactic(tactic)}
                                            className={`bg-surface-container-high hover:bg-primary hover:text-white ${isCollected ? 'text-green-600 font-bold' : 'text-on-surface-variant'} text-xs font-bold py-2 px-3 rounded-lg transition-all text-center truncate flex items-center justify-center gap-1`}
                                          >
                                            <span>{skillName}</span>
                                            {tactic?.season && tactic.season !== 'S1' && (
                                              <span className="text-[8px] px-1 bg-surface-container-highest text-outline rounded">
                                                {tactic.season}
                                              </span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-outline">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">兵种</span>
                                  </div>
                                  <p className="text-on-surface font-bold text-xs">{general.兵种}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-outline">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">专精</span>
                                  </div>
                                  <p className="text-on-surface font-bold text-xs">{general.专精}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-outline">
                                    <Book className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">兵书</span>
                                  </div>
                                  <p className="text-on-surface font-bold text-xs whitespace-pre-line">{general.兵书}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-outline-variant/20">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-outline uppercase block">装备</span>
                                  <p className="text-on-surface text-xs leading-tight font-medium">{general.装备}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-outline uppercase block">坐骑</span>
                                  <p className="text-on-surface text-xs leading-tight font-medium">{general.坐骑}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-outline uppercase block">加点</span>
                                  <span className="bg-secondary-container/30 text-on-secondary-container px-2 py-0.5 rounded-full inline-block font-black text-[10px]">
                                    {general.加点}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-2">
                                <span className="text-[10px] font-bold text-outline uppercase">装属: </span>
                                <span className="text-[10px] text-primary font-bold">{general.装属}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between py-6 border-t border-outline-variant/20 gap-4">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-tertiary">
                          <Clock className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">最后更新: {activeTeam.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-tertiary">
                          <BarChart2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">强度评级: {activeTeam.rating}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-outline font-bold uppercase">数据来源: 核心战术研究院</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-outline/40 space-y-4">
                    <Users className="w-24 h-24 opacity-20" />
                    <p className="text-xl font-black uppercase tracking-widest">未选择或无匹配阵容</p>
                  </div>
                )}
              </section>
            </div>
          ) : activeTab === 'generals' ? (
            <GeneralGallery 
              collectedGenerals={collectedGenerals} 
              toggleCollectGeneral={toggleCollectGeneral} 
              onExport={() => setIsGeneralExportOpen(true)}
              onImport={() => setIsGeneralImportOpen(true)}
              onQuickEntry={() => setIsGeneralQuickEntryOpen(true)}
              allGenerals={allGenerals}
            />
          ) : activeTab === 'zhanfa' ? (
            <ZhanfaLibrary 
              collectedTactics={collectedTactics} 
              toggleCollectTactic={toggleCollectTactic} 
              onExport={() => setIsTacticExportOpen(true)}
              onImport={() => setIsTacticImportOpen(true)}
              onQuickEntry={() => setIsTacticQuickEntryOpen(true)}
              allTactics={allTactics}
            />
          ) : activeTab === 'collection' ? (
            <Warehouse 
              collectedGenerals={collectedGenerals} 
              collectedTactics={collectedTactics} 
              toggleCollectGeneral={toggleCollectGeneral} 
              toggleCollectTactic={toggleCollectTactic} 
              onGeneralClick={handleGeneralClick}
              onTacticClick={handleTacticClick}
              onExport={() => setIsWarehouseExportOpen(true)}
              onImport={() => setIsWarehouseImportOpen(true)}
              allGenerals={allGenerals}
              allTactics={allTactics}
            />
          ) : activeTab === 'mockBattle' ? (
            <MockBattle allGenerals={allGenerals} allTactics={allTactics} allTeams={allTeams} />
          ) : null}
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
              isCollected={collectedGenerals.includes(selectedGeneral.name)}
              onToggleCollect={() => toggleCollectGeneral(selectedGeneral.name)}
            >
              <div className="space-y-4">
                <div className="flex gap-4">
                  <p className="text-sm text-on-surface-variant">阵营: {selectedGeneral.faction}</p>
                  <p className="text-sm text-on-surface-variant">兵种: {selectedGeneral.arms.join(', ')}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-primary">{selectedGeneral.innate_skill.name}</p>
                    <div className="flex gap-2">
                      {selectedGeneral.innate_skill.trigger && (
                        <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase">{selectedGeneral.innate_skill.trigger}</span>
                      )}
                      {selectedGeneral.innate_skill.probability && (
                        <span className="text-[10px] px-2 py-0.5 bg-secondary/10 text-secondary rounded font-bold uppercase">{selectedGeneral.innate_skill.probability}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{selectedGeneral.innate_skill.description}</p>
                </div>
              </div>
            </DetailModal>
          )}
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
          <TeamEditorModal 
            key={isTeamEditorOpen ? (editingTeam?.id || 'new') : 'closed'}
            isOpen={isTeamEditorOpen}
            onClose={() => setIsTeamEditorOpen(false)}
            onSave={handleSaveTeam}
            initialData={editingTeam}
            allGenerals={allGenerals}
            allTactics={allTactics}
          />

          <ExportModal 
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            teams={allTeams}
            onGenerateShareCode={handleGenerateShareCode}
          />

          <ImportModal 
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImportTeams}
          />

          <ShareCodeModal
            isOpen={isShareCodeModalOpen}
            onClose={() => setIsShareCodeModalOpen(false)}
            shareCode={currentShareCode}
          />

          {/* General Codex Modals */}
          <GenericExportModal 
            isOpen={isGeneralExportOpen}
            onClose={() => setIsGeneralExportOpen(false)}
            title="导出武将"
            items={allGenerals.map(w => ({ 
              id: w.name, 
              name: w.name, 
              subtitle: w.faction,
              isCollected: collectedGenerals.includes(w.name)
            }))}
            onExport={(ids) => handleExportData('generals', ids)}
            renderPreview={(item) => {
              const general = allGenerals.find(w => w.name === item.id);
              if (!general) return null;
              return (
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">阵营: {general.faction}</p>
                  <p className="text-sm text-on-surface-variant">兵种: {general.arms.join(', ')}</p>
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <p className="font-bold text-primary mb-2">{general.innate_skill.name}</p>
                    <p className="text-xs text-on-surface-variant">{general.innate_skill.description}</p>
                  </div>
                </div>
              );
            }}
          />
          <GenericImportModal 
            isOpen={isGeneralImportOpen}
            onClose={() => setIsGeneralImportOpen(false)}
            title="导入武将"
            onImport={(data) => handleImportData('generals', data)}
            validateData={(data) => {
              if (!Array.isArray(data)) throw new Error("文件格式错误，应为武将数组");
              return data;
            }}
          />

          {/* Tactic Codex Modals */}
          <GenericExportModal 
            isOpen={isTacticExportOpen}
            onClose={() => setIsTacticExportOpen(false)}
            title="导出战法"
            items={allTactics.map(z => ({ 
              id: z.name, 
              name: z.name, 
              subtitle: z.type,
              isCollected: collectedTactics.includes(z.name)
            }))}
            onExport={(ids) => handleExportData('tactics', ids)}
            renderPreview={(item) => {
              const tactic = allTactics.find(z => z.name === item.id);
              if (!tactic) return null;
              return (
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">类型: {tactic.type}</p>
                  <p className="text-sm text-on-surface-variant">目标: {tactic.target}</p>
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <p className="text-xs text-on-surface-variant">{tactic.description}</p>
                  </div>
                </div>
              );
            }}
          />
          <GenericImportModal 
            isOpen={isTacticImportOpen}
            onClose={() => setIsTacticImportOpen(false)}
            title="导入战法"
            onImport={(data) => handleImportData('tactics', data)}
            validateData={(data) => {
              if (!Array.isArray(data)) throw new Error("文件格式错误，应为战法数组");
              return data;
            }}
          />

          {/* Warehouse Modals */}
          <GenericExportModal 
            isOpen={isWarehouseExportOpen}
            onClose={() => setIsWarehouseExportOpen(false)}
            title="导出仓库"
            items={[
              ...allGenerals.map(w => ({ 
                id: `g:${w.name}`, 
                name: w.name, 
                subtitle: `武将 - ${w.faction}`,
                isCollected: collectedGenerals.includes(w.name)
              })),
              ...allTactics.map(z => ({ 
                id: `t:${z.name}`, 
                name: z.name, 
                subtitle: `战法 - ${z.type}`,
                isCollected: collectedTactics.includes(z.name)
              }))
            ]}
            onExport={(ids) => handleExportData('warehouse', ids)}
          />

          <QuickEntryModal 
            isOpen={isGeneralQuickEntryOpen}
            onClose={() => setIsGeneralQuickEntryOpen(false)}
            type="general"
            onAdd={(data) => handleQuickEntry('general', data)}
          />

          <QuickEntryModal 
            isOpen={isTacticQuickEntryOpen}
            onClose={() => setIsTacticQuickEntryOpen(false)}
            type="tactic"
            onAdd={(data) => handleQuickEntry('tactic', data)}
          />
          <GenericImportModal 
            isOpen={isWarehouseImportOpen}
            onClose={() => setIsWarehouseImportOpen(false)}
            title="导入仓库"
            onImport={(data) => handleImportData('warehouse', data)}
            validateData={(data) => {
              if (typeof data !== 'object' || (!data.generals && !data.tactics)) {
                throw new Error("文件格式错误，应包含 generals 或 tactics 字段");
              }
              return data;
            }}
          />

          <ShareCodeModal
            isOpen={isShareCodeModalOpen}
            onClose={() => setIsShareCodeModalOpen(false)}
            shareCode={currentShareCode}
          />

          {toast && (
            <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-bold text-white z-50 flex items-center gap-2 transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {toast.message}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
