"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileJson, Loader2, Share2 } from 'lucide-react';
import { parseShareCode } from '@/lib/shareCode';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (teams: any[]) => { success: number; duplicate: number; failed: number };
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [parsedTeams, setParsedTeams] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; duplicate: number; failed: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [shareCodeError, setShareCodeError] = useState<string | null>(null);
  const [isParsingCode, setIsParsingCode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setFile(null);
    setIsValid(false);
    setParsedTeams([]);
    setError(null);
    setImportResult(null);
    setIsProcessing(false);
    setShareCodeInput('');
    setShareCodeError(null);
    setIsParsingCode(false);
    setDragActive(false);
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateTeams = (data: any) => {
    if (!Array.isArray(data)) {
      throw new Error("文件内容必须是一个阵容数组");
    }
    if (data.length === 0) {
      throw new Error("数组不能为空");
    }
    
    // Basic validation of team structure
    data.forEach((team, index) => {
      if (!team.name || !team.config || !Array.isArray(team.config)) {
        throw new Error(`第 ${index + 1} 个阵容格式不正确`);
      }
    });
    
    return data;
  };

  const handleFile = async (file: File) => {
    setFile(file);
    setError(null);
    setIsValid(false);
    setImportResult(null);
    
    if (file.type !== "application/json" && !file.name.endsWith('.json')) {
      setError("请上传 JSON 格式的文件");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validated = validateTeams(data);
      setParsedTeams(validated);
      setIsValid(true);
    } catch (err: any) {
      setError(err.message || "解析文件失败，请检查 JSON 格式");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleImportClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = onImport(parsedTeams);
      setImportResult(result);
      setIsProcessing(false);
      setIsValid(false);
      setFile(null);
    }, 800);
  };

  const handleParseShareCode = () => {
    if (!shareCodeInput.trim()) return;
    
    setIsParsingCode(true);
    setShareCodeError(null);
    
    setTimeout(() => {
      try {
        const data = parseShareCode(shareCodeInput.trim());
        const validated = validateTeams(Array.isArray(data) ? data : [data]);
        const result = onImport(validated);
        setImportResult(result);
        setShareCodeInput('');
      } catch (err: any) {
        setShareCodeError(err.message || "解析分享码失败");
      } finally {
        setIsParsingCode(false);
      }
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-outline-variant/20">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">导入阵容</h2>
            <p className="text-xs text-outline mt-1 font-bold uppercase tracking-wider">支持文件导入或分享码解析</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-6 h-6 text-outline" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto bg-surface">
          {importResult ? (
            <div className="text-center space-y-6 py-4 max-w-lg mx-auto">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-on-surface font-headline">导入完成</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-2xl font-black text-green-600 font-headline">{importResult.success}</p>
                  <p className="text-[10px] font-bold text-green-700 uppercase">成功</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-2xl font-black text-orange-600 font-headline">{importResult.duplicate}</p>
                  <p className="text-[10px] font-bold text-orange-700 uppercase">重复</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-2xl font-black text-red-600 font-headline">{importResult.failed}</p>
                  <p className="text-[10px] font-bold text-red-700 uppercase">失败</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="w-full py-4 bg-surface-container-highest text-on-surface font-bold rounded-md hover:bg-outline-variant/50 transition-all"
              >
                关闭
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Left Column: File Import */}
              <div className="space-y-6 flex flex-col h-full border-r border-outline-variant/10 pr-8">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-primary" />
                    文件导入
                  </h3>
                  <p className="text-xs text-outline mt-1">上传导出的 JSON 文件</p>
                </div>

                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group min-h-[200px] ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-outline-variant/40 hover:border-primary/60 hover:bg-surface-container-low'
                  }`}
                >
                  <input 
                    ref={inputRef}
                    type="file" 
                    accept=".json"
                    onChange={handleChange}
                    className="hidden"
                  />
                  
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all ${
                    file ? 'bg-green-100 text-green-600' : 'bg-surface-container-high text-outline group-hover:text-primary group-hover:bg-primary/10'
                  }`}>
                    {file ? <FileJson className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                  </div>

                  <div className="text-center">
                    {file ? (
                      <>
                        <p className="font-bold text-on-surface truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-outline mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-on-surface">点击或拖拽文件</p>
                        <p className="text-xs text-outline mt-1">仅支持 .json 格式</p>
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {isValid && (
                  <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700 font-medium">校验成功，共 {parsedTeams.length} 个阵容。</p>
                  </div>
                )}

                <button 
                  disabled={!isValid || isProcessing}
                  onClick={handleImportClick}
                  className={`w-full py-3 rounded-md font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isValid && !isProcessing
                      ? 'bg-primary text-white hover:shadow-xl transform hover:-translate-y-0.5' 
                      : 'bg-surface-container-highest text-outline cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {isProcessing ? '正在导入...' : '开始导入文件'}
                </button>
              </div>

              {/* Right Column: Share Code */}
              <div className="space-y-6 flex flex-col h-full pl-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    分享码解析
                  </h3>
                  <p className="text-xs text-outline mt-1">输入其他玩家生成的分享码</p>
                </div>

                <div className="flex-1 flex flex-col">
                  <textarea
                    value={shareCodeInput}
                    onChange={(e) => setShareCodeInput(e.target.value)}
                    placeholder="在此粘贴分享码..."
                    className="w-full flex-1 min-h-[200px] bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-xs font-mono text-on-surface resize-none focus:outline-none focus:border-primary/50"
                  />
                </div>

                {shareCodeError && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">{shareCodeError}</p>
                  </div>
                )}

                <button 
                  disabled={!shareCodeInput.trim() || isParsingCode}
                  onClick={handleParseShareCode}
                  className={`w-full py-3 rounded-md font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    shareCodeInput.trim() && !isParsingCode
                      ? 'bg-primary text-white hover:shadow-xl transform hover:-translate-y-0.5' 
                      : 'bg-surface-container-highest text-outline cursor-not-allowed'
                  }`}
                >
                  {isParsingCode ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Share2 className="w-5 h-5" />
                  )}
                  {isParsingCode ? '正在解析...' : '解析分享码'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
