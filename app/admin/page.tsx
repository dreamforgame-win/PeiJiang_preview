'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Upload, FileJson } from 'lucide-react';

export default function AdminPanel() {
  const [generals, setGenerals] = useState<any[]>([]);
  const [tactics, setTactics] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'generals' | 'tactics' | 'teams'>('generals');
  const [newItem, setNewItem] = useState<any>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [teamTypeFilter, setTeamTypeFilter] = useState<string>('全部');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const generalsSnap = await getDocs(collection(db, 'generals'));
    setGenerals(generalsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

    const tacticsSnap = await getDocs(collection(db, 'tactics'));
    setTactics(tacticsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

    const teamsSnap = await getDocs(collection(db, 'teams'));
    setTeams(teamsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  const addItem = async (collectionName: string) => {
    await addDoc(collection(db, collectionName), newItem);
    setNewItem({});
    fetchData();
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

  const runMigration = async (type?: 'generals' | 'tactics' | 'teams') => {
    setIsMigrating(true);
    setMigrationStatus('开始迁移...');
    setMigrationProgress(0);
    try {
      const { migrateData } = await import('../../migrate');
      const types: ('generals' | 'tactics' | 'teams')[] = type ? [type] : ['generals', 'tactics', 'teams'];
      await migrateData((msg, progress) => {
        setMigrationStatus(msg);
        setMigrationProgress(progress);
      }, types);
      fetchData();
      alert(`数据迁移完成！(${type || '全部'})`);
    } catch (error) {
      console.error('Migration failed:', error);
      alert('迁移失败，请检查控制台。');
    } finally {
      setIsMigrating(false);
      setMigrationStatus('');
      setMigrationProgress(0);
    }
  };

  const runCleanup = async () => {
    setIsMigrating(true);
    setMigrationStatus('正在清理重复项...');
    setMigrationProgress(0);
    try {
      const { cleanupDuplicates } = await import('../../migrate');
      await cleanupDuplicates((msg, progress) => {
        setMigrationStatus(msg);
        setMigrationProgress(progress);
      });
      fetchData();
      alert('重复项清理完成！');
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('清理失败，请检查控制台。');
    } finally {
      setIsMigrating(false);
      setMigrationStatus('');
      setMigrationProgress(0);
    }
  };

  const renderForm = () => {
    if (activeTab === 'generals') {
      return (
        <div className="flex gap-2 mb-4">
          <input placeholder="名称" className="border p-2 rounded" onChange={e => setNewItem({...newItem, name: e.target.value})} />
          <input placeholder="赛季" className="border p-2 rounded" onChange={e => setNewItem({...newItem, season: e.target.value})} />
          <button onClick={() => addItem('generals')} className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16} /> 添加</button>
        </div>
      );
    }
    if (activeTab === 'tactics') {
      return (
        <div className="flex flex-wrap gap-2 mb-4">
          <input placeholder="名称" className="border p-2 rounded" onChange={e => setNewItem({...newItem, name: e.target.value})} />
          <input placeholder="类型" className="border p-2 rounded" onChange={e => setNewItem({...newItem, type: e.target.value})} />
          <input placeholder="特性类型" className="border p-2 rounded" onChange={e => setNewItem({...newItem, traitType: e.target.value})} />
          <input placeholder="适用兵种" className="border p-2 rounded" onChange={e => setNewItem({...newItem, troopType: e.target.value})} />
          <button onClick={() => addItem('tactics')} className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16} /> 添加</button>
        </div>
      );
    }
    if (activeTab === 'teams') {
      return (
        <div className="flex flex-wrap gap-4 mb-4 items-end bg-surface-container-low p-4 rounded-xl border">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-outline uppercase">阵容名称</label>
            <input placeholder="名称" className="border p-2 rounded bg-white" onChange={e => setNewItem({...newItem, name: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-outline uppercase">标签 (Badge)</label>
            <input placeholder="如: 箕形阵" className="border p-2 rounded bg-white" onChange={e => setNewItem({...newItem, badge: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-outline uppercase">赛季</label>
            <input placeholder="如: S2" className="border p-2 rounded bg-white" onChange={e => setNewItem({...newItem, season: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-outline uppercase">阵容分类</label>
            <input placeholder="如: S2推荐阵容" className="border p-2 rounded bg-white" onChange={e => setNewItem({...newItem, teamType: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => addItem('teams')} className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 font-bold"><Plus size={16} /> 添加</button>
            <label className="bg-secondary text-white px-4 py-2 rounded flex items-center gap-2 font-bold cursor-pointer hover:opacity-90">
              <Upload size={16} /> 导入JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
            </label>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">演武模拟管理平台</h1>
      <div className="flex gap-4 mb-6 border-b pb-2">
        {(['generals', 'tactics', 'teams'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setExpandedId(null);
            }}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface-container-highest'}`}
          >
            {tab === 'generals' ? '武将管理' : tab === 'tactics' ? '战法管理' : '阵容管理'}
            <span className="bg-black/10 px-2 py-0.5 rounded-full text-xs">
              {tab === 'generals' ? generals.length : tab === 'tactics' ? tactics.length : teams.length}
            </span>
          </button>
        ))}
      </div>

      {renderForm()}

      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={() => runMigration()} 
            disabled={isMigrating}
            className={`px-4 py-2 rounded font-bold ${isMigrating ? 'bg-gray-400 cursor-not-allowed' : 'bg-secondary text-white hover:opacity-90'}`}
          >
            {isMigrating ? '正在处理中...' : '全量迁移'}
          </button>
          <button 
            onClick={() => runMigration('generals')} 
            disabled={isMigrating}
            className={`px-4 py-2 rounded font-bold ${isMigrating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:opacity-90'}`}
          >
            迁移武将
          </button>
          <button 
            onClick={() => runMigration('tactics')} 
            disabled={isMigrating}
            className={`px-4 py-2 rounded font-bold ${isMigrating ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-500 text-white hover:opacity-90'}`}
          >
            迁移战法
          </button>
          <button 
            onClick={() => runMigration('teams')} 
            disabled={isMigrating}
            className={`px-4 py-2 rounded font-bold ${isMigrating ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:opacity-90'}`}
          >
            迁移阵容
          </button>
          <button 
            onClick={runCleanup} 
            disabled={isMigrating}
            className={`px-4 py-2 rounded font-bold ${isMigrating ? 'bg-gray-400 cursor-not-allowed' : 'bg-tertiary text-white hover:opacity-90'}`}
          >
            清理重复数据
          </button>
        </div>
        
        {isMigrating && (
          <div className="w-full max-w-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-primary">{migrationStatus}</span>
              <span className="text-sm font-medium text-primary">{Math.round(migrationProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${migrationProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface p-4 rounded-xl shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold capitalize">{activeTab === 'generals' ? '武将' : activeTab === 'tactics' ? '战法' : '阵容'} 列表</h2>
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
          {(activeTab === 'generals' ? generals : activeTab === 'tactics' ? tactics : filteredTeams).map(item => (
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
