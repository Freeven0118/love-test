
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { QUESTIONS, OPTIONS, CATEGORY_INFO, PERSONAS, EXPERT_CONFIG, IMAGE_PROMPTS } from './constants';
import { Category } from './types';

// 定義 AI 回傳的報告結構
interface AiReport {
  selectedPersonaId: string; 
  personaExplanation: string; 
  personaOverview: string; 
  appearanceAnalysis: string; 
  socialAnalysis: string;
  interactionAnalysis: string;
  mindsetAnalysis: string; 
  coachGeneralAdvice: string; 
}

const App: React.FC = () => {
  // 狀態管理：移除 security 狀態，預設為 hero
  const [step, setStep] = useState<'hero' | 'quiz' | 'diagnosing' | 'result'>('hero');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isIntroMode, setIsIntroMode] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  const [imagesCache, setImagesCache] = useState<Record<number, string>>({});
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState<AiReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);

  const loadingRef = useRef<Record<number, boolean>>({});
  const radarChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  const handleStart = () => {
    setStep('quiz');
    setCurrentIdx(0);
    setIsIntroMode(true);
    setAnswers({});
    setImagesCache({});
    setAiAnalysis(null);
    setFakeProgress(0);
    loadingRef.current = {};
  };

  const generateImageForIndex = async (index: number, isPriority: boolean = false) => {
    if (imagesCache[index] || loadingRef.current[index] || index >= QUESTIONS.length) return;
    if (isPriority) setIsImageLoading(true);
    loadingRef.current[index] = true;

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey.includes('undefined')) {
         console.warn("API Key missing, skipping image generation");
         return;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const category = QUESTIONS[index].category;
      const basePrompt = IMAGE_PROMPTS[category] || `Professional photography related to ${QUESTIONS[index].text}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: basePrompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } },
      });
      
      const parts = response?.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            setImagesCache(prev => ({ ...prev, [index]: `data:image/png;base64,${part.inlineData!.data}` }));
            break;
          }
        }
      }
    } catch (e: any) { 
      console.error("Image generation error:", e);
    } finally {
      loadingRef.current[index] = false;
      if (isPriority) setIsImageLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'quiz' && !isIntroMode) {
      generateImageForIndex(currentIdx, true).then(() => {
        if (currentIdx + 1 < QUESTIONS.length) generateImageForIndex(currentIdx + 1, false);
      });
    }
  }, [currentIdx, isIntroMode, step]);

  useEffect(() => {
    let timer: number;
    if (step === 'diagnosing') {
      timer = window.setInterval(() => {
        setFakeProgress(prev => {
          if (prev >= 98) return prev;
          return prev + 0.35; 
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step === 'diagnosing' && aiAnalysis) {
      setFakeProgress(100);
      const timer = setTimeout(() => {
        setStep('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, aiAnalysis]);

  const localSummary = useMemo(() => {
    if (step !== 'result' && step !== 'diagnosing') return null;
    const categories: Category[] = ['形象外表', '社群形象', '行動與互動', '心態與習慣'];
    const summary = categories.map(cat => {
      const catQuestions = QUESTIONS.filter(q => q.category === cat);
      const score = catQuestions.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
      let level: '紅燈' | '黃燈' | '綠燈' = '紅燈';
      let color = '#ef4444'; 
      if (score >= 9) { level = '綠燈'; color = '#22c55e'; }
      else if (score >= 5) { level = '黃燈'; color = '#f97316'; }
      return { category: cat, score, level, color, description: CATEGORY_INFO[cat].description, suggestion: CATEGORY_INFO[cat].suggestions[level] };
    });

    const totalScore = summary.reduce((acc, curr) => acc + curr.score, 0);
    return { summary, totalScore };
  }, [step, answers]);

  useEffect(() => {
    if (step === 'diagnosing' && localSummary && !aiAnalysis && !isAiLoading) {
      const fetchAiAnalysis = async () => {
        setIsAiLoading(true);
        
        // 1. 檢查 API Key 是否存在
        const apiKey = process.env.API_KEY;
        // 如果是在 Vercel 環境但沒設定好，這裡通常會是 undefined
        if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
          console.error("Critical: No API Key found.");
          setAiAnalysis({
            selectedPersonaId: localSummary.totalScore > 36 ? 'charmer' : 'neighbor',
            personaExplanation: "⚠️ 系統檢測不到 API 金鑰。請確認 Vercel 後台的 Environment Variables 是否已設定 'VITE_API_KEY'，並且設定完畢後是否有點擊 'Redeploy' 重新部署。",
            personaOverview: "無法連線至 AI 大腦。",
            appearanceAnalysis: "請檢查 Vercel 設定。",
            socialAnalysis: "請檢查 Vercel 設定。",
            interactionAnalysis: "請檢查 Vercel 設定。",
            mindsetAnalysis: "請檢查 Vercel 設定。",
            coachGeneralAdvice: "設定完成後請重新整理頁面。"
          });
          setIsAiLoading(false);
          return;
        }

        try {
          const ai = new GoogleGenAI({ apiKey: apiKey });
          const detailedData = QUESTIONS.map(q => ({
            question: q.text,
            category: q.category,
            answer: OPTIONS.find(o => o.value === answers[q.id])?.label || '未答'
          }));

          const prompt = `
            你現在是專業形象教練「彭邦典」。這是一位 25-35 歲男性的「脫單力檢核」測驗結果深度報告。
            
            數據：
            1. 總分：${localSummary.totalScore}/48
            2. 各維度分數：${JSON.stringify(localSummary.summary.map(s => ({ cat: s.category, score: s.score })))}
            3. 具體作答：${JSON.stringify(detailedData)}

            任務指令：
            1. 人格選定與解析：從以下清單中選出一個最貼切的人格 ID [charmer, statue, hustler, neighbor, sage, pioneer]。
               - 重要規則：若總分很高（例如 38 分以上）且各維度表現均衡（綠燈多），請務必判定為 'charmer' (天生魅力家)。
               - 解釋為何選它，字數約 100 字。
            2. 維度診斷：分析其形象、社群、互動、心態的現況。
            3. 教練戰略實踐方案：直接輸出純文字，不要有任何修飾符號。
            語氣：有威嚴、專業、直白。
          `;

          // 改用 Flash 模型，速度更快，失敗率更低
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  selectedPersonaId: { type: Type.STRING },
                  personaExplanation: { type: Type.STRING },
                  personaOverview: { type: Type.STRING },
                  appearanceAnalysis: { type: Type.STRING },
                  socialAnalysis: { type: Type.STRING },
                  interactionAnalysis: { type: Type.STRING },
                  mindsetAnalysis: { type: Type.STRING },
                  coachGeneralAdvice: { type: Type.STRING }
                },
                required: ["selectedPersonaId", "personaExplanation", "personaOverview", "appearanceAnalysis", "socialAnalysis", "interactionAnalysis", "mindsetAnalysis", "coachGeneralAdvice"]
              }
            }
          });

          const jsonText = response.text || "{}";
          const json = JSON.parse(jsonText);
          setAiAnalysis(json);
        } catch (e: any) {
          console.error("AI Analysis Error:", e);
          let errorMsg = "由於網路連線狀況，我們根據目前分數為您進行基礎判定。";
          
          // 如果是權限錯誤，顯示更清楚的訊息
          if (e.toString().includes('403') || e.toString().includes('key')) {
             errorMsg = "API 金鑰無效或權限不足 (403)。請確認您的 API Key 是否正確且有足夠額度。";
          }

          setAiAnalysis({
            selectedPersonaId: localSummary.totalScore > 36 ? 'charmer' : 'neighbor',
            personaExplanation: errorMsg,
            personaOverview: "AI 連線暫時中斷。",
            appearanceAnalysis: "建議您稍後再試。",
            socialAnalysis: "建議您稍後再試。",
            interactionAnalysis: "建議您稍後再試。",
            mindsetAnalysis: "建議您稍後再試。",
            coachGeneralAdvice: "若持續發生，請檢查網路連線。"
          });
        } finally {
          setIsAiLoading(false);
        }
      };
      fetchAiAnalysis();
    }
  }, [step, localSummary]);

  useEffect(() => {
    if (step === 'result' && localSummary && radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d');
      if (ctx) {
        if (chartInstance.current) chartInstance.current.destroy();
        // @ts-ignore
        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: localSummary.summary.map(r => r.category),
            datasets: [{
              label: '魅力值',
              data: localSummary.summary.map(r => r.score),
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 3,
              pointBackgroundColor: 'rgba(59, 130, 246, 1)',
              pointBorderColor: '#fff',
            }]
          },
          options: {
            scales: { 
              r: { 
                min: 0, max: 12, ticks: { display: false, stepSize: 3 },
                pointLabels: { font: { size: 14, weight: '700' }, color: '#64748b' }
              } 
            },
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
          }
        });
      }
    }
  }, [step, localSummary]);

  const handleAnswer = (val: number) => setAnswers(prev => ({ ...prev, [QUESTIONS[currentIdx].id]: val }));
  
  const nextStep = () => {
    if (isIntroMode) { setIsIntroMode(false); return; }
    if (currentIdx < QUESTIONS.length - 1) {
      const nextIdx = currentIdx + 1;
      if (nextIdx % 4 === 0) setIsIntroMode(true);
      setCurrentIdx(nextIdx);
    } else {
      setStep('diagnosing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (isIntroMode) {
      if (currentIdx > 0) { setIsIntroMode(false); setCurrentIdx(currentIdx - 1); }
      else setStep('hero');
      return;
    }
    if (currentIdx % 4 === 0) setIsIntroMode(true);
    else setCurrentIdx(prev => prev - 1);
  };

  const activePersona = useMemo(() => {
    if (!aiAnalysis) return PERSONAS[5];
    const normalizedId = aiAnalysis.selectedPersonaId.toLowerCase().trim();
    const found = PERSONAS.find(p => p.id === normalizedId);
    return found || PERSONAS[5];
  }, [aiAnalysis]);

  return (
    <div className="min-h-screen max-w-2xl mx-auto flex flex-col items-center p-4 md:p-8">
      {step === 'hero' && (
        <div className="flex-1 flex flex-col justify-center w-full animate-fade-in py-10 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">脫單力檢核分析</h1>
            <p className="text-2xl text-slate-500 font-bold">快速找出你的脫單阻礙</p>
          </div>

          <div className="relative w-full aspect-[4/3] flex items-center justify-center animate-float">
             <img src="https://d1yei2z3i6k35z.cloudfront.net/2452254/694caa69f0eb6_main.svg" className="w-full h-full object-contain" />
          </div>

          <div className="grid grid-cols-1 gap-6 px-4">
            <div className="flex items-center space-x-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="text-6xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(244, 63, 94, 0.4))' }}>✨</div>
              <div>
                <h3 className="text-xl font-black text-slate-800">魅力原型</h3>
                <p className="text-slate-400 font-medium">分析你在戀愛市場中的真實定位</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="text-6xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.4))' }}>📊</div>
              <div>
                <h3 className="text-xl font-black text-slate-800">多維雷達</h3>
                <p className="text-slate-400 font-medium">將外型、社交、心態數據化呈現</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="text-6xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.4))' }}>🌱</div>
              <div>
                <h3 className="text-xl font-black text-slate-800">進化指南</h3>
                <p className="text-slate-400 font-medium">獲得個人深度報告與建議</p>
              </div>
            </div>
          </div>

          <button onClick={handleStart} className="bg-slate-900 hover:bg-black text-white font-black py-7 px-24 rounded-[2.5rem] text-2xl shadow-2xl transition transform active:scale-95 text-center">啟動深度分析</button>
        </div>
      )}

      {step === 'quiz' && (
        <div className="w-full space-y-6 py-4 animate-fade-in">
          <div className="w-full px-2">
            <div className="flex justify-between text-[10px] text-slate-400 mb-2 font-black uppercase tracking-widest">
              <span>{QUESTIONS[currentIdx].category}</span>
              <span>Question {currentIdx + 1} / {QUESTIONS.length}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${((currentIdx + (isIntroMode ? 0 : 1)) / QUESTIONS.length) * 100}%` }}></div>
            </div>
          </div>

          {isIntroMode ? (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center">
              <h2 className="text-4xl font-black text-slate-800 mb-4">{QUESTIONS[currentIdx].category}</h2>
              <p className="text-xl text-slate-500 leading-relaxed mb-10">{CATEGORY_INFO[QUESTIONS[currentIdx].category].description}</p>
              <button onClick={nextStep} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl text-lg shadow-lg transition transform active:scale-95">進入測驗</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                {isImageLoading && !imagesCache[currentIdx] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div></div>
                )}
                {imagesCache[currentIdx] ? <img src={imagesCache[currentIdx]} alt="Visual" className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold italic">載入情境中...</div>}
              </div>
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 text-center leading-relaxed px-4">{QUESTIONS[currentIdx].text}</h2>
                <div className="space-y-3">
                  {OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => handleAnswer(opt.value)} className={`w-full p-5 rounded-2xl border-2 transition-all ${answers[QUESTIONS[currentIdx].id] === opt.value ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-50 bg-slate-50/50 hover:bg-slate-100'}`}>
                      <span className="font-bold text-base md:text-lg text-slate-700">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-4 px-2">
                <button onClick={prevStep} className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">上一步</button>
                <button onClick={nextStep} disabled={answers[QUESTIONS[currentIdx].id] === undefined} className={`flex-[2] py-4 rounded-2xl font-black shadow-lg transition-all ${answers[QUESTIONS[currentIdx].id] === undefined ? 'bg-blue-300 text-white opacity-50 cursor-not-allowed' : 'bg-blue-600 text-white active:scale-95'}`}>{currentIdx === QUESTIONS.length - 1 ? '分析報告' : '下一步'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'diagnosing' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full space-y-12 animate-fade-in text-center px-4">
          <div className="relative">
            <div className="w-32 h-32 border-8 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-800">{Math.floor(fakeProgress)}%</div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI 診斷引擎正在啟動</h2>
            <div className="flex flex-col space-y-2 text-slate-500 font-bold">
              <span className={fakeProgress > 15 ? 'text-blue-600 opacity-100' : 'opacity-40 transition-opacity'}>● 正在分析你的作答細節...</span>
              <span className={fakeProgress > 45 ? 'text-blue-600 opacity-100' : 'opacity-40 transition-opacity'}>● 比對 10,000+ 社交成功案例...</span>
              <span className={fakeProgress > 80 ? 'text-blue-600 opacity-100' : 'opacity-40 transition-opacity'}>● 彭邦典教練正在生成專屬建議...</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${fakeProgress}%` }}></div>
          </div>
          <p className="text-slate-400 font-medium italic">「魅力不是天生，而是可以被設計的」</p>
        </div>
      )}

      {step === 'result' && localSummary && (
        <div className="w-full space-y-10 py-8 animate-fade-in px-2">
          <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="relative aspect-[3/2] bg-gray-50 flex items-center justify-center">
              <img src={activePersona.imageUrl} alt={activePersona.title} className="w-full h-full object-contain p-6" />
              <div className="absolute bottom-0 left-0 p-8 text-white bg-gradient-to-t from-black/80 w-full">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">{activePersona.title}</h2>
                <p className="text-lg md:text-xl font-medium text-white/80">{activePersona.subtitle}</p>
              </div>
            </div>
            <div className="p-8 md:p-10 space-y-8">
              <div className="flex flex-wrap gap-3">
                {activePersona.tags.map(tag => (
                  <span key={tag} className="px-6 py-3 bg-slate-100 text-slate-800 rounded-full text-lg font-black border border-slate-200"># {tag}</span>
                ))}
              </div>
              <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                 <h5 className="text-blue-600 font-black text-xl uppercase tracking-widest mb-3">人格診斷分析</h5>
                 <p className="text-slate-800 text-lg md:text-xl leading-relaxed font-bold">{aiAnalysis?.personaExplanation}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-slate-50 text-center">
            <div className="text-3xl md:text-4xl font-black text-slate-800 mb-8">總體魅力：<span className="text-blue-600">{localSummary.totalScore}</span> <span className="text-slate-300 text-lg">/ 48</span></div>
            <div className="h-[20rem] md:h-[24rem] mb-6"><canvas ref={radarChartRef}></canvas></div>
          </div>

          {activePersona.id === 'charmer' ? (
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-[3.5rem] shadow-2xl p-10 md:p-14 text-center space-y-8 animate-fade-in border border-slate-800">
              <div className="text-6xl md:text-8xl">🏆</div>
              <h4 className="text-3xl md:text-4xl font-black text-white">你已是頂級魅力家</h4>
              <p className="text-slate-300 text-xl md:text-2xl font-bold">彭教練對你唯一的建議是：好好善用這份天賦。祝你一帆風順！</p>
            </div>
          ) : (
            <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100">
              <img src={EXPERT_CONFIG.imageUrl} alt="Expert" className="w-full h-auto block" />
              <div className="p-8 md:p-14 space-y-12">
                <button onClick={() => window.open('https://www.menspalais.com', '_blank')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-8 rounded-[2.5rem] text-2xl md:text-3xl shadow-2xl shadow-blue-200 flex items-center justify-center space-x-4 transition transform active:scale-95">
                  <span>{EXPERT_CONFIG.ctaButtonText}</span>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="text-center pb-8"><button onClick={handleStart} className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors">重新進行測試</button></div>
        </div>
      )}

      <footer className="w-full text-center py-10 text-slate-400 text-[12px] px-6 border-t border-slate-100 mt-auto">
        <p className="font-bold">© 男性形象教練 彭邦典 版權所有</p>
        <p>本測驗深度診斷由 AI 輔助生成，測驗結果僅供社交魅力提升參考。</p>
        {(!process.env.API_KEY || process.env.API_KEY === "undefined") && (
          <p className="text-red-500 font-bold mt-2">DEBUG: Vercel API Key not set</p>
        )}
      </footer>
    </div>
  );
};

export default App;
