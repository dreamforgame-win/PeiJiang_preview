"use client";

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface WarehouseQuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGenerals: any[];
  allTactics: any[];
  collectedGenerals: string[];
  collectedTactics: string[];
  onImport: (generals: string[], tactics: string[]) => void;
}

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
  const [parsedGenerals, setParsedGenerals] = useState<string[]>([]);
  const [parsedTactics, setParsedTactics] = useState<string[]>([]);
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
      setParsedGenerals([]);
      setParsedTactics([]);
      setImportResult(null);
      setIsImporting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!inputText.trim()) {
      setParsedGenerals([]);
      setParsedTactics([]);
      return;
    }

    // Simple parsing logic: check if any general or tactic name exists in the text
    const foundGenerals = allGenerals
      .map(g => g.name)
      .filter(name => inputText.includes(name));
      
    const foundTactics = allTactics
      .map(t => t.name)
      .filter(name => inputText.includes(name));

    setParsedGenerals(foundGenerals);
    setParsedTactics(foundTactics);
  }, [inputText, allGenerals, allTactics]);

  const handleImport = () => {
    setIsImporting(true);
    
    let successCount = 0;
    let duplicateCount = 0;
    
    const newGeneralsToCollect: string[] = [];
    const newTacticsToCollect: string[] = [];

    parsedGenerals.forEach(g => {
      if (collectedGenerals.includes(g)) {
        duplicateCount++;
      } else {
        newGeneralsToCollect.push(g);
        successCount++;
      }
    });

    parsedTactics.forEach(t => {
      if (collectedTactics.includes(t)) {
        duplicateCount++;
      } else {
        newTacticsToCollect.push(t);
        successCount++;
      }
    });

    const total = parsedGenerals.length + parsedTactics.length;
    // We don't really have "failed" in this simple string matching logic unless we count things that weren't matched, 
    // but the user said "筛选出有用的信息" so the total is the matched ones.
    // Actually, "failed" could be 0 here since we only extract known ones.
    
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
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">粘贴文本数据</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="将包含武将和战法名称的文本粘贴到这里，建议使用pixpin截长图后全部文本复制粘贴于此..."
                  className="w-full h-40 bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {(parsedGenerals.length > 0 || parsedTactics.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    识别结果 ({parsedGenerals.length + parsedTactics.length} 项)
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

        <div className="p-6 border-t border-outline-variant/20 flex justify-end gap-3 shrink-0">
          {!importResult ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || (parsedGenerals.length === 0 && parsedTactics.length === 0)}
                className="px-6 py-2.5 rounded-lg font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? '录入中...' : '快捷录入'}
              </button>
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
