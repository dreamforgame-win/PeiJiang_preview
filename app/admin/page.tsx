'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Upload } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [generals, setGenerals] = useState<any[]>([]);
  const [tactics, setTactics] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [buffs, setBuffs] = useState<any[]>([]);
  const [specialEffects, setSpecialEffects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'generals' | 'tactics' | 'teams' | 'buffs' | 'special_effects'>('generals');
  const [newItem, setNewItem] = useState<any>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [teamTypeFilter, setTeamTypeFilter] = useState<string>('全部');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('admin_authorized');
    if (authStatus === 'true') {
      setIsAuthorized(true);
      fetchData();
    } else {
      window.location.href = '/';
    }
  }, []);

  const fetchData = async () => {
    const generalsSnap = await getDocs(collection(db, 'generals'));
    setGenerals(generalsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

    const tacticsSnap = await getDocs(collection(db, 'tactics'));
    setTactics(tacticsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

    const teamsSnap = await getDocs(collection(db, 'teams'));
    setTeams(teamsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

    const buffsSnap = await getDocs(collection(db, 'buffs'));
    setBuffs(buffsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

    const effectsSnap = await getDocs(collection(db, 'special_effects'));
    setSpecialEffects(effectsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  const addItem = async (collectionName: string) => {
    try {
      const data = { ...newItem };
      // For teams, ensure config is initialized if not present
      if (collectionName === 'teams' && !data.config) {
        data.config = [
          { 武将: '大营', 技能: '', 兵种: '', 专精: '', 兵书: '', 装备: '', 加点: '', 装属: '' },
          { 武将: '中军', 技能: '', 兵种: '', 专精: '', 兵书: '', 装备: '', 加点: '', 装属: '' },
          { 武将: '前锋', 技能: '', 兵种: '', 专精: '', 兵书: '', 装备: '', 加点: '', 装属: '' }
        ];
      }
      await addDoc(collection(db, collectionName), data);
      setNewItem({});
      setIsAddModalOpen(false);
      fetchData();
      alert('添加成功！');
    } catch (error) {
      console.error('Add failed:', error);
      alert('添加失败');
    }
  };

  const deleteItem = async (collectionName: string, id: string) => {
    if (!confirm('确定要删除吗？')) return;
    await deleteDoc(doc(db, collectionName, id));
    fetchData();
  };

  const updateItem = async (collectionName: string, id: string) => {
    const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
    const dataToUpdate = { ...editData };
    delete dataToUpdate.id; // Don't save the ID inside the document
    await updateDoc(firestoreDoc(db, collectionName, id), dataToUpdate);
    setEditingId(null);
    setEditData({});
    fetchData();
    alert('修改成功！');
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        const items = Array.isArray(content) ? content : [content];
        
        setIsMigrating(true);
        setMigrationStatus('正在导入阵容...');
        let count = 0;

        for (const item of items) {
          // Map the specific JSON format to our DB format
          const teamData = {
            name: item.名称 || item.name,
            desc: item.评价 || item.desc || '',
            badge: item.阵型 || item.badge || '',
            season: item.season || 'S2',
            teamType: item.teamType || '未分类',
            config: (item.配置 || item.config || []).map((c: any) => ({
              武将: c.武将,
              技能: c.技能,
              兵种: c.兵种,
              专精: c.专精,
              兵书: c.兵书,
              装备: c.装备,
              加点: c.加点,
              装属: c.装属 || ''
            })),
            updatedAt: new Date()
          };

          await addDoc(collection(db, 'teams'), teamData);
          count++;
          setMigrationProgress((count / items.length) * 100);
        }

        alert(`成功导入 ${count} 个阵容！`);
        fetchData();
      } catch (error) {
        console.error('Import failed:', error);
        alert('导入失败，请检查文件格式。');
      } finally {
        setIsMigrating(false);
        setMigrationStatus('');
        setMigrationProgress(0);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const teamTypes = useMemo(() => {
    const types = new Set(teams.map(t => t.teamType || '未分类'));
    return ['全部', ...Array.from(types)];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    if (teamTypeFilter === '全部') return teams;
    return teams.filter(t => (t.teamType || '未分类') === teamTypeFilter);
  }, [teams, teamTypeFilter]);

  const renderForm = () => {
    return (
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <button 
          onClick={() => {
            setNewItem(activeTab === 'generals' ? {
              name: '',
              season: 'S1',
              faction: '魏',
              arms: [],
              force: '',
              command: '',
              intelligence: '',
              speed: '',
              tactic_name: '',
              tactic_type: '',
              tactic_probability: '',
              tactic_trait: '',
              tactic_description: '',
              fate: ''
            } : activeTab === 'tactics' ? {
              name: '',
              type: '指挥',
              season: 'S1',
              probability: '',
              description: '',
              traitType: '',
              troopType: ''
            } : activeTab === 'buffs' ? {
              name: '',
              type: '增益',
              effect: ''
            } : activeTab === 'special_effects' ? {
              name: '',
              type: '坐骑/特效',
              effect: ''
            } : {
              name: '',
              badge: '',
              season: 'S2',
              teamType: '推荐阵容',
              desc: '',
              config: [
                { 武将: '大营', 技能: '', 兵种: '', 专精: '', 兵书: '', 装备: '', 加点: '', 装属: '' },
                { 武将: '中军', 技能: '', 兵种: '', 专精: '', 兵书: '', 装备: '', 加点: '', 装属: '' },
                { 武将: '前锋', 技能: '', 兵种: '', 专精: '', 兵书: '', 装备: '', 加点: '', 装属: '' }
              ]
            });
            setIsAddModalOpen(true);
          }}
          className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:opacity-90 transition-all"
        >
          <Plus size={20} /> 新增{activeTab === 'generals' ? '武将' : activeTab === 'tactics' ? '战法' : activeTab === 'teams' ? '阵容' : '效果'}
        </button>

        {activeTab === 'teams' && (
          <label className="bg-secondary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:opacity-90 transition-all cursor-pointer">
            <Upload size={20} /> 导入阵容 JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          </label>
        )}

        {isMigrating && (
          <div className="min-w-[200px] flex-1 max-w-xs">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold text-primary uppercase">{migrationStatus}</span>
              <span className="text-[10px] font-bold text-primary">{Math.round(migrationProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${migrationProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                <h3 className="text-xl font-bold">新增{activeTab === 'generals' ? '武将' : activeTab === 'tactics' ? '战法' : '阵容'}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
              </div>
              
              <div className="p-6 space-y-6">
                {activeTab === 'generals' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">武将名称</label>
                      <input className="w-full border p-2 rounded" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">赛季</label>
                      <input className="w-full border p-2 rounded" value={newItem.season || ''} onChange={e => setNewItem({...newItem, season: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">阵营</label>
                      <select className="w-full border p-2 rounded" value={newItem.faction || '魏'} onChange={e => setNewItem({...newItem, faction: e.target.value})}>
                        {['魏', '蜀', '吴', '群', '晋'].map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">兵种 (逗号分隔)</label>
                      <input className="w-full border p-2 rounded" value={Array.isArray(newItem.arms) ? newItem.arms.join(',') : newItem.arms || ''} onChange={e => setNewItem({...newItem, arms: e.target.value.split(',')})} />
                    </div>
                    {['force', 'intelligence', 'command', 'speed'].map(stat => (
                      <div key={stat} className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">{stat === 'force' ? '武力' : stat === 'intelligence' ? '智力' : stat === 'command' ? '统帅' : '先攻'}</label>
                        <input className="w-full border p-2 rounded" value={newItem[stat] || ''} onChange={e => setNewItem({...newItem, [stat]: e.target.value})} />
                      </div>
                    ))}
                    <div className="col-span-full border-t pt-4 mt-2">
                      <h4 className="font-bold mb-3 text-primary">自带战法信息</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">战法名称</label>
                          <input className="w-full border p-2 rounded" value={newItem.tactic_name || ''} onChange={e => setNewItem({...newItem, tactic_name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">战法类型</label>
                          <input className="w-full border p-2 rounded" value={newItem.tactic_type || ''} onChange={e => setNewItem({...newItem, tactic_type: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">发动概率</label>
                          <input className="w-full border p-2 rounded" value={newItem.tactic_probability || ''} onChange={e => setNewItem({...newItem, tactic_probability: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">战法特性</label>
                          <input className="w-full border p-2 rounded" value={newItem.tactic_trait || ''} onChange={e => setNewItem({...newItem, tactic_trait: e.target.value})} />
                        </div>
                        <div className="col-span-full space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">战法说明</label>
                          <textarea className="w-full border p-2 rounded h-24" value={newItem.tactic_description || ''} onChange={e => setNewItem({...newItem, tactic_description: e.target.value})} />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-full space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">缘分 (格式: 名称|描述|武将1/武将2)</label>
                      <textarea className="w-full border p-2 rounded h-20" value={newItem.fate || ''} onChange={e => setNewItem({...newItem, fate: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'tactics' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">战法名称</label>
                      <input className="w-full border p-2 rounded" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">类型</label>
                      <select className="w-full border p-2 rounded" value={newItem.type || '指挥'} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                        {['指挥', '主动', '被动', '追击', '阵法', '兵种'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">赛季</label>
                      <input className="w-full border p-2 rounded" value={newItem.season || ''} onChange={e => setNewItem({...newItem, season: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">发动概率</label>
                      <input className="w-full border p-2 rounded" value={newItem.probability || ''} onChange={e => setNewItem({...newItem, probability: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">特性类型</label>
                      <input className="w-full border p-2 rounded" value={newItem.traitType || ''} onChange={e => setNewItem({...newItem, traitType: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">适用兵种</label>
                      <input className="w-full border p-2 rounded" value={newItem.troopType || ''} onChange={e => setNewItem({...newItem, troopType: e.target.value})} />
                    </div>
                    <div className="col-span-full space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">战法说明</label>
                      <textarea className="w-full border p-2 rounded h-32" value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'buffs' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">名称</label>
                      <input className="w-full border p-2 rounded" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">状态</label>
                      <select className="w-full border p-2 rounded" value={newItem.type || '增益'} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                        {['增益', '减益'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-full space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">效果描述</label>
                      <textarea className="w-full border p-2 rounded h-32" value={newItem.effect || ''} onChange={e => setNewItem({...newItem, effect: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'special_effects' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">名称</label>
                      <input className="w-full border p-2 rounded" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">类型</label>
                      <input className="w-full border p-2 rounded" value={newItem.type || ''} onChange={e => setNewItem({...newItem, type: e.target.value})} />
                    </div>
                    <div className="col-span-full space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">效果描述</label>
                      <textarea className="w-full border p-2 rounded h-32" value={newItem.effect || ''} onChange={e => setNewItem({...newItem, effect: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'teams' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">阵容名称</label>
                        <input className="w-full border p-2 rounded" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">标签 (Badge)</label>
                        <input className="w-full border p-2 rounded" value={newItem.badge || ''} onChange={e => setNewItem({...newItem, badge: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">赛季</label>
                        <input className="w-full border p-2 rounded" value={newItem.season || ''} onChange={e => setNewItem({...newItem, season: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">阵容分类</label>
                        <input className="w-full border p-2 rounded" value={newItem.teamType || ''} onChange={e => setNewItem({...newItem, teamType: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">阵容评价</label>
                      <textarea className="w-full border p-2 rounded h-20" value={newItem.desc || ''} onChange={e => setNewItem({...newItem, desc: e.target.value})} />
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-bold text-primary border-b pb-2">武将配置</h4>
                      {newItem.config?.map((c: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl border space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">位置</label>
                              <input className="w-full border p-1.5 rounded bg-white text-sm" value={c.武将 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].武将 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">兵种</label>
                              <input className="w-full border p-1.5 rounded bg-white text-sm" value={c.兵种 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].兵种 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">专精</label>
                              <input className="w-full border p-1.5 rounded bg-white text-sm" value={c.专精 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].专精 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">加点</label>
                              <input className="w-full border p-1.5 rounded bg-white text-sm" value={c.加点 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].加点 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">技能 (换行分隔)</label>
                              <textarea className="w-full border p-1.5 rounded bg-white text-sm h-16" value={c.技能 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].技能 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">兵书 (换行分隔)</label>
                              <textarea className="w-full border p-1.5 rounded bg-white text-sm h-16" value={c.兵书 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].兵书 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">装备</label>
                              <input className="w-full border p-1.5 rounded bg-white text-sm" value={c.装备 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].装备 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">装属</label>
                              <input className="w-full border p-1.5 rounded bg-white text-sm" value={c.装属 || ''} onChange={e => {
                                const newConfig = [...newItem.config];
                                newConfig[i].装属 = e.target.value;
                                setNewItem({...newItem, config: newConfig});
                              }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200">取消</button>
                <button onClick={() => addItem(activeTab)} className="px-8 py-2 rounded-lg font-bold bg-primary text-white hover:opacity-90">完成添加</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-outline font-bold">正在验证权限...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">演武模拟管理平台</h1>
      <div className="flex gap-4 mb-6 border-b pb-2">
        {(['generals', 'tactics', 'teams', 'buffs', 'special_effects'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setExpandedId(null);
            }}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface-container-highest'}`}
          >
            {tab === 'generals' ? '武将管理' : tab === 'tactics' ? '战法管理' : tab === 'teams' ? '阵容管理' : tab === 'buffs' ? '效果管理' : '特效管理'}
            <span className="bg-black/10 px-2 py-0.5 rounded-full text-xs">
              {tab === 'generals' ? generals.length : tab === 'tactics' ? tactics.length : tab === 'teams' ? teams.length : tab === 'buffs' ? buffs.length : specialEffects.length}
            </span>
          </button>
        ))}
      </div>

      {renderForm()}

      <div className="bg-surface p-4 rounded-xl shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold capitalize">{activeTab === 'generals' ? '武将' : activeTab === 'tactics' ? '战法' : activeTab === 'teams' ? '阵容' : '效果'} 列表</h2>
          {activeTab === 'teams' && (
            <div className="flex items-center gap-4">
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-2xl scrollbar-hide">
                {teamTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setTeamTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${teamTypeFilter === type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {(activeTab === 'generals' ? generals : activeTab === 'tactics' ? tactics : activeTab === 'buffs' ? buffs : activeTab === 'special_effects' ? specialEffects : filteredTeams).map(item => (
            <div key={item.id} className="border rounded-lg overflow-hidden bg-white">
              <div 
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {item.season || item.type || `ID: ${item.id}`}
                  </span>
                  {activeTab === 'teams' && item.season && (
                    <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                      {item.season}
                    </span>
                  )}
                  {item.traitType && (
                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                      {item.traitType}
                    </span>
                  )}
                  {item.troopType && (
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded">
                      {item.troopType}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingId === item.id) {
                        setEditingId(null);
                        setEditData({});
                      } else {
                        setEditingId(item.id);
                        setEditData(item);
                      }
                    }} 
                    className="text-primary p-1 hover:bg-primary/10 rounded"
                  >
                    {editingId === item.id ? <X size={16} /> : <Save size={16} className="opacity-50" />}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(activeTab, item.id);
                    }} 
                    className="text-error p-1 hover:bg-error/10 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {editingId === item.id ? (
                <div className="p-4 border-t bg-blue-50/30 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(item).filter(k => k !== 'id' && k !== 'updatedAt').map(key => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-outline uppercase">{key}</label>
                        {typeof item[key] === 'object' ? (
                          <textarea 
                            className="border p-2 rounded bg-white text-xs font-mono"
                            value={JSON.stringify(editData[key], null, 2)}
                            onChange={e => {
                              try {
                                const val = JSON.parse(e.target.value);
                                setEditData({...editData, [key]: val});
                              } catch (err) {
                                // Allow typing invalid JSON temporarily
                                setEditData({...editData, [key]: e.target.value});
                              }
                            }}
                            rows={5}
                          />
                        ) : (
                          <input 
                            className="border p-2 rounded bg-white"
                            value={editData[key] || ''}
                            onChange={e => setEditData({...editData, [key]: e.target.value})}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingId(null);
                        setEditData({});
                      }}
                      className="px-4 py-2 rounded text-sm font-bold bg-gray-200"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => updateItem(activeTab, item.id)}
                      className="px-4 py-2 rounded text-sm font-bold bg-primary text-white flex items-center gap-2"
                    >
                      <Save size={16} /> 保存修改
                    </button>
                  </div>
                </div>
              ) : expandedId === item.id && (
                <div className="p-4 border-t bg-gray-50 text-sm">
                  <pre className="whitespace-pre-wrap font-sans overflow-x-auto">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
