
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Switch } from './components/Switch';
import { analyzeText, extractTextFromImage } from './services/geminiService';
import { AnalysisResult, AnalysisConfig } from './types';

declare const pdfjsLib: any;
declare const mammoth: any;

const PROGRESS_MESSAGES = [
  "正在解析文本結構...",
  "識別上下文邏輯中...",
  "深度檢查語法完整性...",
  // Redundancy check message, shown only if enabled
  "比對冗贅詞庫...",
  // Fluency adjustment message, shown only if enabled
  "優化語句流暢度建議...",
  "正在生成最終報告..."
];

// Helper to get visible progress messages based on current config
const getVisibleProgressMessages = (config) => {
  return PROGRESS_MESSAGES.filter((msg, idx) => {
    // Index 3 corresponds to redundancy, index 4 to fluency
    if (idx === 3) return config.checkRedundancy;
    if (idx === 4) return config.checkFluency;
    return true;
  });
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsgIndex, setProgressMsgIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showFinalOnly, setShowFinalOnly] = useState(false);
  const [config, setConfig] = useState<AnalysisConfig>({
    checkRedundancy: true,
    checkFluency: true,
    revisionLevel: 3,
    stylePreference: '',
  });

  // Compute visible progress messages based on current config, memoized to avoid recreating array each render
  const visibleProgressMessages = useMemo(() => getVisibleProgressMessages(config), [config]);
  const [error, setError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const saveToHistory = useCallback((text: string) => {
    setHistory(prev => [text, ...prev].slice(0, 50));
  }, []);

  const undo = useCallback(() => {
    if (history.length > 0) {
      const prevText = history[0];
      setHistory(prev => prev.slice(1));
      setInputText(prevText);
    }
  }, [history]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (document.activeElement === textAreaRef.current) return;
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo]);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setProgress(0);
      setProgressMsgIndex(0);
      interval = setInterval(() => {
        setProgress(prev => (prev < 95 ? prev + Math.random() * 3 : prev));
        setProgressMsgIndex(prev => (prev + 1) % visibleProgressMessages.length);
      }, 1500);
    } else {
      setProgress(100);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, visibleProgressMessages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    saveToHistory(inputText);
    const fileName = file.name.toLowerCase();

    try {
      setIsUploading(true);
      if (fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => setInputText(event.target?.result as string);
        reader.readAsText(file);
      } else if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        setInputText(res.value);
      } else if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        setInputText(fullText);
      } else if (fileName.match(/\.(png|jpg|jpeg)$/)) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          try {
            const extracted = await extractTextFromImage(base64, file.type);
            if (!extracted) throw new Error("No text found");
            setInputText(prev => prev ? prev + "\n\n" + extracted : extracted);
          } catch (err) {
            setError("影像文字辨識失敗。");
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
        return;
      } else {
        setError("不支援此格式。");
      }
    } catch (err) {
      setError("讀取檔案失敗。");
    } finally {
      if (!fileName.match(/\.(png|jpg|jpeg)$/)) setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('請輸入內容。');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeText(inputText, config);
      setResult(data);
    } catch (err: any) {
      setError(err.message || '分析發生錯誤。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'typo': return 'bg-rose-900/40 text-rose-200 border-rose-800';
      case 'redundancy': return 'bg-amber-900/40 text-amber-200 border-amber-800';
      case 'fluency': return 'bg-blue-900/40 text-blue-200 border-blue-800';
      default: return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  const getIndicatorColor = (type: string) => {
    switch (type) {
      case 'typo': return '#F43F5E';
      case 'redundancy': return '#F59E0B';
      case 'fluency': return '#3B82F6';
      default: return '#94A3B8';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'typo': return '錯字';
      case 'redundancy': return '冗贅詞';
      case 'fluency': return '流暢度';
      default: return '其他';
    }
  };

  const renderDiff = (diffText: string) => {
    if (showFinalOnly && result) {
      return <span>{result.revisedText}</span>;
    }

    const parts = diffText.split(/(\[\[(?:DEL|INS)[:：\s\-_]*.*?\]\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[[DEL')) {
        const content = part.replace(/^\[\[DEL[:：\s\-_]*/, '').replace(/\]\]$/, '');
        return <span key={index} className="bg-rose-950 text-rose-300 line-through px-0.5 rounded mx-0.5">{content}</span>;
      } else if (part.startsWith('[[INS')) {
        const content = part.replace(/^\[\[INS[:：\s\-_]*/, '').replace(/\]\]$/, '');
        return <span key={index} className="bg-emerald-950 text-emerald-300 font-bold px-0.5 rounded mx-0.5">{content}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getRevisionLevelLabel = (level: number) => {
    switch (level) {
      case 1: return "精確校正 (僅錯字標點)";
      case 2: return "輕度優化";
      case 3: return "平衡優化";
      case 4: return "深度優化";
      case 5: return "專業改寫 (最大變動)";
      default: return "";
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center justify-between text-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                輸入文本
              </div>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <button onClick={undo} title="還原" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    還原 (Ctrl+Z)
                  </button>
                )}
                {isUploading && <span className="text-xs text-indigo-400 animate-pulse font-bold">辨識中...</span>}
              </div>
            </h2>

            <textarea
              ref={textAreaRef}
              className="w-full h-80 p-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-white font-medium placeholder-slate-500"
              placeholder="請在此輸入文字，或拖放圖片/文件至此..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isUploading}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span>上傳 (.txt, .pdf, .docx, .png, .jpg)</span>
                <input type="file" accept=".txt,.pdf,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
              </label>
              <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                字數：{inputText.length}
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-100">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              選項設定
            </h2>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Switch label="錯字與標點" checked={true} onChange={() => { }} disabled={true} />
                  <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-full font-bold">必選項目</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Switch label="冗贅詞優化" checked={config.checkRedundancy} onChange={(v) => setConfig(p => ({ ...p, checkRedundancy: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Switch label="流暢度調整" checked={config.checkFluency} onChange={(v) => setConfig(p => ({ ...p, checkFluency: v }))} />
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">修改幅度</label>
                  <span className="text-xs font-bold text-indigo-400">{getRevisionLevelLabel(config.revisionLevel)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={config.revisionLevel}
                  onChange={(e) => setConfig(p => ({ ...p, revisionLevel: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[10px] text-slate-600">最保守</span>
                  <span className="text-[10px] text-slate-600">最進取</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">風格傾向 (選填)</label>
                <input type="text" placeholder="例如：正式、口語、商務..." className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" value={config.stylePreference} onChange={(e) => setConfig(p => ({ ...p, stylePreference: e.target.value }))} />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isUploading || !inputText.trim()}
              className={`w-full mt-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] ${isAnalyzing ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:translate-y-[-2px]'}`}
            >
              {isAnalyzing ? '分析執行中...' : '開始校正'}
            </button>
            {error && <p className="mt-4 text-rose-400 text-sm text-center font-bold">{error}</p>}
          </section>
        </div>

        <div className="space-y-6 min-h-[500px]">
          {isAnalyzing && (
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div className="w-full space-y-4">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>深度學習處理中</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-bold animate-pulse">{visibleProgressMessages[progressMsgIndex]}</p>
                <p className="text-slate-500 text-xs mt-2 font-bold uppercase">Powered by Gemini 3 Pro</p>
              </div>
            </div>
          )}

          {!result && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 p-12 text-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-lg font-medium opacity-50">尚無分析結果</p>
            </div>
          )}

          {result && (
            <div className={`space-y-6 transition-all duration-500`}>
              <section className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-100">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                  分析總結
                </h2>
                <div className="p-4 bg-emerald-950/20 text-emerald-100 rounded-xl text-sm leading-relaxed border border-emerald-900/30 font-medium">
                  {result.summary}
                </div>
              </section>

              <section className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                    差異對照
                  </h2>
                  <div className="flex items-center gap-4">
                    {!showFinalOnly && (
                      <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-rose-400">● 刪除</span>
                        <span className="text-emerald-400">● 新增</span>
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors">
                      <input type="checkbox" className="sr-only" checked={showFinalOnly} onChange={(e) => setShowFinalOnly(e.target.checked)} />
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${showFinalOnly ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                        <div className={`absolute w-3 h-3 bg-white rounded-full top-0.5 transition-transform ${showFinalOnly ? 'left-4.5 translate-x-1' : 'left-0.5'}`}></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase">校正後內容</span>
                    </label>
                  </div>
                </div>
                <div className="p-4 bg-slate-800/40 rounded-xl text-slate-100 leading-loose whitespace-pre-wrap font-medium border border-slate-700">
                  {renderDiff(result.diffText)}
                </div>
                <div className="flex gap-4 mt-4">
                  <button onClick={() => {
                    navigator.clipboard.writeText(result.revisedText);
                    const t = document.createElement('div');
                    t.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg text-sm z-50';
                    t.innerText = '校正後內容已複製！';
                    document.body.appendChild(t);
                    setTimeout(() => t.remove(), 2000);
                  }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    複製校正後內容
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(inputText);
                    const t = document.createElement('div');
                    t.className = 'fixed bottom-4 right-4 bg-slate-600 text-white px-4 py-2 rounded shadow-lg text-sm z-50';
                    t.innerText = '原文已複製！';
                    document.body.appendChild(t);
                    setTimeout(() => t.remove(), 2000);
                  }} className="text-xs font-bold text-slate-400 hover:text-slate-300 flex items-center gap-1 border-l border-slate-800 pl-4 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    複製原文
                  </button>
                </div>
              </section>

              <section className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 overflow-hidden">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-400">
                  <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
                  修正詳情 ({result.issues.length})
                </h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.issues.map((issue, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-800/20 hover:bg-slate-800/40 transition-all border-l-4" style={{ borderLeftColor: getIndicatorColor(issue.type) }}>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getTypeStyle(issue.type)}`}>
                          {getTypeText(issue.type)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">原文</p>
                          <p className="text-rose-400 font-bold bg-rose-950/20 px-1.5 py-0.5 rounded text-sm break-all">{issue.original}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">建議</p>
                          <p className="text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.5 rounded text-sm break-all">{issue.suggested}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed"><span className="font-bold text-slate-500 mr-1 italic">原因:</span>{issue.reason}</p>
                    </div>
                  ))}
                  {result.issues.length === 0 && (
                    <div className="text-center py-10 text-slate-500 font-medium">
                      此文本表現優異，未發現明顯修正建議。
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
