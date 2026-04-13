import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { wujiangData } from './lib/wujiang_data';
import { zhanfaData } from './lib/zhanfa_data';
import { teams } from './lib/data';

export async function migrateData(onProgress: (msg: string, progress: number) => void, types: ('generals' | 'tactics' | 'teams')[] = ['generals', 'tactics', 'teams']) {
  let total = 0;
  if (types.includes('generals')) total += wujiangData.length;
  if (types.includes('tactics')) total += zhanfaData.length;
  if (types.includes('teams')) total += teams.length;
  
  let current = 0;

  onProgress('开始迁移...', 0);

  // Helper to upsert
  const upsert = async (colName: string, fieldName: string, value: string, data: any) => {
    const col = collection(db, colName);
    const q = query(col, where(fieldName, '==', value));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(col, data);
    } else {
      await updateDoc(doc(db, colName, snapshot.docs[0].id), data);
    }
    current++;
    onProgress(`正在处理 ${colName}: ${value}`, (current / total) * 100);
  };

  // Migrate Generals
  if (types.includes('generals')) {
    for (const w of wujiangData) {
      await upsert('generals', 'name', w.武将名, {
        name: w.武将名,
        season: w.赛季,
        faction: w.阵营,
        arms: (w.兵种 || '').split(','),
        force: w.武力,
        command: w.统帅,
        intelligence: w.智力,
        speed: w.先攻,
        innate_skill: w.自带战法,
        fate: w.缘分详情合集 || ''
      });
    }
  }

  // Migrate Tactics
  if (types.includes('tactics')) {
    for (const z of zhanfaData) {
      await upsert('tactics', 'name', z.name, {
        name: z.name,
        type: z.type,
        probability: z.probability,
        description: z.description,
        season: z.season,
        traitType: (z as any).traitType || '',
        troopType: (z as any).troopType || ''
      });
    }
  }

  // Migrate Teams
  if (types.includes('teams')) {
    for (const t of teams) {
      const col = collection(db, 'teams');
      const q = query(col, where('name', '==', t.name));
      const snapshot = await getDocs(q);
      const teamData = {
        id: t.id,
        name: t.name,
        badge: t.badge,
        desc: t.desc,
        config: t.config,
        season: 'S2'
      };
      if (snapshot.empty) {
        await addDoc(col, teamData);
      } else {
        await updateDoc(doc(db, 'teams', snapshot.docs[0].id), teamData);
      }
      current++;
      onProgress(`正在处理 teams: ${t.name}`, (current / total) * 100);
    }
  }
  onProgress('迁移完成！', 100);
}

export async function cleanupDuplicates(onProgress: (msg: string, progress: number) => void) {
  const collections = ['generals', 'tactics', 'teams'];
  
  // First count total docs for progress calculation
  onProgress('正在计算数据总量...', 0);
  let totalDocs = 0;
  const colSnapshots: {name: string, docs: any[]}[] = [];
  
  for (const colName of collections) {
    const snapshot = await getDocs(collection(db, colName));
    totalDocs += snapshot.docs.length;
    colSnapshots.push({ name: colName, docs: snapshot.docs });
  }

  let current = 0;
  for (const colData of colSnapshots) {
    onProgress(`正在清理 ${colData.name}...`, (current / totalDocs) * 100);
    const seen = new Set();
    for (const docSnap of colData.docs) {
      const data = docSnap.data();
      const identifier = data.name;
      if (seen.has(identifier)) {
        await deleteDoc(doc(db, colData.name, docSnap.id));
      } else {
        seen.add(identifier);
      }
      current++;
      onProgress(`正在检查 ${colData.name}: ${identifier}`, (current / totalDocs) * 100);
    }
  }
  onProgress('清理完成！', 100);
}
