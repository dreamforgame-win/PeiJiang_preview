"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, Info, ThumbsUp, ThumbsDown } from 'lucide-react';

interface WarehouseQuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGenerals: any[];
  allTactics: any[];
  collectedGenerals: string[];
  collectedTactics: string[];
  onImport: (generals: string[], tactics: string[]) => void;
}

type FuzzyMatch = {
  original: string; // The text in the input
  matched: string;  // The actual database name
  type: 'general' | 'tactic';
  approved: boolean | null; // null: pending, true: accepted, false: rejected
};

type LineStatus = {
  text: string;
  status: 'matched' | 'fuzzy' | 'unmatched';
};

export default function WarehouseQuickImportModal({
  isOpen,
  onClose,
  allGenerals,
  allTactics,
  collectedGenerals,
  collectedTactics,
  onImport
}: WarehouseQuickImportModalProps) {
  const [inputText, setInputText] = useState('');
  const [lineStatuses, setLineStatuses] = useState<LineStatus[]>([]);
  const [parsedGenerals, setParsedGenerals] = useState<string[]>([]);
  const [parsedTactics, setParsedTactics] = useState<string[]>([]);
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatch[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    success: number;
    duplicate: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setInputText('');
      setLineStatuses([]);
      setParsedGenerals([]);
      setParsedTactics([]);
      setFuzzyMatches([]);
      setImportResult(null);
      setIsImporting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!inputText.trim()) {
      setLineStatuses([]);
      setParsedGenerals([]);
      setParsedTactics([]);
      setFuzzyMatches([]);
      return;
    }

    const allInputLines = inputText.split('\n');
    const foundGenerals: string[] = [];
    const foundTactics: string[] = [];
    const localFuzzy: FuzzyMatch[] = [];
    const localStatuses: LineStatus[] = [];

    // Names in DB
    const genNames = allGenerals.map(g => g.name);
    const tacNames = allTactics.map(t => t.name);

    allInputLines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) {
        localStatuses.push({ text: rawLine, status: 'unmatched' });
        return;
      }

      let isExact = false;
      let hasFuzzy = false;

      // 1. Exact match
      const exactG = genNames.find(name => line.includes(name));
      const exactT = tacNames.find(name => line.includes(name));

      if (exactG || exactT) {
        if (exactG) foundGenerals.push(exactG);
        if (exactT) foundTactics.push(exactT);
        isExact = true;
      } else {
        // 2. Fuzzy match
        const tryFuzzy = (targetNames: string[], type: 'general' | 'tactic') => {
          targetNames.forEach(dbName => {
            if (dbName.length === line.length && dbName !== line) {
              let overlap = 0;
              for (let i = 0; i < dbName.length; i++) {
                if (line.includes(dbName[i])) overlap++;
              }
              if (overlap >= dbName.length / 2) {
                if (!localFuzzy.some(f => f.original === line && f.matched === dbName)) {
                  localFuzzy.push({ original: line, matched: dbName, type, approved: null });
                  hasFuzzy = true;
                }
              }
            }
          });
        };

        tryFuzzy(genNames, 'general');
        tryFuzzy(tacNames, 'tactic');
      }

      localStatuses.push({
        text: rawLine,
        status: isExact ? 'matched' : hasFuzzy ? 'fuzzy' : 'unmatched'
      });
    });

    setLineStatuses(localStatuses);
    setParsedGenerals(Array.from(new Set(foundGenerals)));
    setParsedTactics(Array.from(new Set(foundTactics)));
    setFuzzyMatches(localFuzzy);
  }, [inputText, allGenerals, allTactics]);

  const toggleFuzzy = (index: number, approved: boolean) => {
    setFuzzyMatches(prev => {
      const updated = prev.map((f, i) => i === index ? { ...f, approved } : f);
      
      // Update line status if approved
      if (approved) {
        const fuzzyItem = updated[index];
        setLineStatuses(curr => curr.map(ls => 
          ls.text === fuzzyItem.original ? { ...ls, status: 'matched' } : ls
        ));
      }
      
      return updated;
    });
  };

  const finalGenerals = useMemo(() => {
    const approvedFuzzyG = fuzzyMatches.filter(f => f.type === 'general' && f.approved === true).map(f => f.matched);
    return Array.from(new Set([...parsedGenerals, ...approvedFuzzyG]));
  }, [parsedGenerals, fuzzyMatches]);

  const finalTactics = useMemo(() => {
    const approvedFuzzyT = fuzzyMatches.filter(f => f.type === 'tactic' && f.approved === true).map(f => f.matched);
    return Array.from(new Set([...parsedTactics, ...approvedFuzzyT]));
  }, [parsedTactics, fuzzyMatches]);

  const handleImport = () => {
    setIsImporting(true);
    
    let successCount = 0;
    let duplicateCount = 0;
    
    const newGeneralsToCollect: string[] = [];
    const newTacticsToCollect: string[] = [];

    finalGenerals.forEach(g => {
      if ((collectedGenerals || []).includes(g)) {
        duplicateCount++;
      } else {
        newGeneralsToCollect.push(g);
        successCount++;
      }
    });

    finalTactics.forEach(t => {
      if ((collectedTactics || []).includes(t)) {
        duplicateCount++;
      } else {
        newTacticsToCollect.push(t);
        successCount++;
      }
    });

    const total = finalGenerals.length + finalTactics.length;
    
    onImport(newGeneralsToCollect, newTacticsToCollect);
    
    setImportResult({
      total,
      success: successCount,
      duplicate: duplicateCount,
      failed: 0
    });
    
    setIsImporting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-on-surface">仓库快捷录入</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!importResult ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-on-surface">粘贴文本并核对状态</label>
                  <span className="text-[10px] text-on-surface-variant flex gap-2">
                    <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>已匹配</span>
                    <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>疑似(⭐)</span>
                    <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>未识别</span>
                  </span>
                </div>
                <div className="relative group bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden focus-within:border-primary">
                  <textarea
                    id="import-textarea"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onScroll={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      const overlay = document.getElementById('import-overlay');
                      if (overlay) overlay.scrollTop = target.scrollTop;
                    }}
                    placeholder="将包含武将和战法名称的文本粘贴到这里..."
                    className="w-full h-48 bg-transparent p-4 text-sm text-transparent caret-on-surface focus:outline-none resize-none z-10 relative leading-6"
                  />
                  <div 
                    id="import-overlay"
                    className="absolute inset-0 p-4 text-sm pointer-events-none overflow-hidden whitespace-pre-wrap break-words leading-6 h-48"
                  >
                    {lineStatuses.length > 0 ? (
                      lineStatuses.map((line, idx) => (
                        <div key={idx} className={`${
                          line.status === 'matched' ? 'text-green-600' :
                          line.status === 'fuzzy' ? 'text-amber-600' :
                          'text-red-500'
                        }`}>
                          {line.text}
                          {line.status === 'fuzzy' && ' ⭐'}
                        </div>
                      ))
                    ) : (
                      <span className="text-on-surface-variant/30 italic">等待粘贴文本...</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant px-1">
                  提示：您可以直接在输入框内修改错别字。绿色表示已识别成功，红色表示未识别，⭐ 表示存在建议 matching。
                </p>
              </div>

              {(parsedGenerals.length > 0 || parsedTactics.length > 0 || fuzzyMatches.length > 0) && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    识别结果 ({finalGenerals.length + finalTactics.length} 项)
                  </h3>
                  
                  {parsedGenerals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-on-surface-variant font-bold">武将 ({parsedGenerals.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {parsedGenerals.map((g, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedTactics.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-on-surface-variant font-bold">战法 ({parsedTactics.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {parsedTactics.map((t, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {fuzzyMatches.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-amber-600 font-bold border-t border-outline-variant/20 pt-4 px-1">
                        模糊匹配建议 (请选择是否采纳)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {fuzzyMatches.map((f, i) => (
                          <div key={i} className={`p-2 rounded-xl border flex flex-col gap-2 transition-all ${
                            f.approved === true ? 'bg-green-50/50 border-green-200' : 
                            f.approved === false ? 'bg-red-50/50 border-red-200' : 
                            'bg-amber-50/50 border-amber-200 h-24'
                          }`}>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-on-surface-variant truncate max-w-[80px]" title={`原始文本: ${f.original}`}>
                                原文: {f.original}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 rounded-full ${f.type === 'general' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                                {f.type === 'general' ? '武将' : '战法'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1 px-1 flex-1">
                              <span className="text-sm font-black truncate text-on-surface">{f.matched}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-auto">
                              <button 
                                onClick={() => toggleFuzzy(i, false)}
                                className={`py-1 rounded-md text-[10px] font-bold transition-all shadow-sm ${
                                  f.approved === false 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white'
                                }`}
                              >
                                不采纳
                              </button>
                              <button 
                                onClick={() => toggleFuzzy(i, true)}
                                className={`py-1 rounded-md text-[10px] font-bold transition-all shadow-sm ${
                                  f.approved === true 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-green-600/10 text-green-700 hover:bg-green-600 hover:text-white'
                                }`}
                              >
                                采纳
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-on-surface">录入完成</h3>
              
              <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                <div className="bg-surface-container-low p-4 rounded-xl">
                  <p className="text-xs text-on-surface-variant mb-1">总计识别</p>
                  <p className="text-2xl font-bold text-on-surface">{importResult.total}</p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-xl">
                  <p className="text-xs text-green-600 mb-1">成功录入</p>
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                </div>
                <div className="bg-yellow-500/10 p-4 rounded-xl">
                  <p className="text-xs text-yellow-600 mb-1">重复跳过</p>
                  <p className="text-2xl font-bold text-yellow-600">{importResult.duplicate}</p>
                </div>
                <div className="bg-red-500/10 p-4 rounded-xl">
                  <p className="text-xs text-red-600 mb-1">失败</p>
                  <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant/20 flex justify-end gap-3 shrink-0 relative">
          {!importResult ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                取消
              </button>
              <div className="group relative">
                {fuzzyMatches.some(f => f.approved === null) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    需要先完成 [模糊匹配建议] 处理
                  </div>
                )}
                <button
                  onClick={() => {
                    if (fuzzyMatches.some(f => f.approved === null)) return;
                    handleImport();
                  }}
                  disabled={isImporting || (finalGenerals.length === 0 && finalTactics.length === 0) || fuzzyMatches.some(f => f.approved === null)}
                  className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                    fuzzyMatches.some(f => f.approved === null)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {isImporting ? '录入中...' : '快捷录入'}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
