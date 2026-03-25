"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileJson, Loader2 } from 'lucide-react';

interface GenericImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onImport: (data: any[]) => { success: number; duplicate: number; failed: number };
  validateData: (data: any) => any[];
}

export default function GenericImportModal({ 
  isOpen, 
  onClose, 
  title, 
  onImport,
  validateData 
}: GenericImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; duplicate: number; failed: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setFile(null);
    setIsValid(false);
    setParsedData([]);
    setError(null);
    setImportResult(null);
    setIsProcessing(false);
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
      const validated = validateData(data);
      setParsedData(validated);
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
      const result = onImport(parsedData);
      setImportResult(result);
      setIsProcessing(false);
      setIsValid(false);
      setFile(null);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-outline-variant/20">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">{title}</h2>
            <p className="text-xs text-outline mt-1 font-bold uppercase tracking-wider">支持 JSON 格式文件拖拽或选择</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-6 h-6 text-outline" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto bg-surface">
          {importResult ? (
            <div className="text-center space-y-6 py-4">
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
            <div className="space-y-6">
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${
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
                
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                  file ? 'bg-green-100 text-green-600' : 'bg-surface-container-high text-outline group-hover:text-primary group-hover:bg-primary/10'
                }`}>
                  {file ? <FileJson className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>

                <div className="text-center">
                  {file ? (
                    <>
                      <p className="font-bold text-on-surface truncate max-w-[250px]">{file.name}</p>
                      <p className="text-xs text-outline mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-on-surface">点击或拖拽文件到此处</p>
                      <p className="text-xs text-outline mt-1">仅支持 .json 格式</p>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {isValid && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">文件校验成功，共识别出 {parsedData.length} 个项目。</p>
                </div>
              )}

              <button 
                disabled={!isValid || isProcessing}
                onClick={handleImportClick}
                className={`w-full py-4 rounded-md font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isValid && !isProcessing
                    ? 'bg-primary text-white hover:shadow-xl transform hover:-translate-y-0.5' 
                    : 'bg-surface-container-highest text-outline cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    正在导入...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    立即导入
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
