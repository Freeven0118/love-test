
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
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
  // 狀態管理
  const [step, setStep] = useState<'hero' | 'quiz' | 'diagnosing' | 'result'>('hero');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isIntroMode, setIsIntroMode] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  const [imagesCache, setImagesCache] = useState<Record<number, string>>({});
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState<AiReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);

  // Refs
  const loadingRef = useRef<Record<number, boolean>>({});
  const aiFetchingRef = useRef(false); // 防止重複呼叫 AI
  const radarChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  // 用於 Debug 的狀態
  const [keyStatus, setKeyStatus] = useState<string>('Checking...');
  const [lastError, setLastError] = useState<string>('');

  useEffect(() => {
    // 檢查 API Key 狀態
    const key = process.env.API_KEY;
    if (!key || key === "undefined" || key === "") {
      setKeyStatus("MISSING");
    } else {
      setKeyStatus(`Present (Len: ${key.length}, Starts: ${key.substring(0, 4)}...)`);
    }
  }, []);

  const handleStart = () => {
    setStep('quiz');
    setCurrentIdx(0);
    setIsIntroMode(true);
    setAnswers({});
    setImagesCache({});
    setAiAnalysis(null);
    setFakeProgress(0);
    setLastError('');
    loadingRef.current = {};
    aiFetchingRef.current = false;
  };

  const generateImageForIndex = async (index: number, isPriority: boolean = false) => {
    if (imagesCache[index] || loadingRef.current[index] || index >= QUESTIONS.length) return;
    if (isPriority) setIsImageLoading(true);
    loadingRef.current[index] = true;

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === "undefined" || apiKey === "") return;

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const category = QUESTIONS[index].category;
      const basePrompt = IMAGE_PROMPTS[category] || `Professional photography related to ${QUESTIONS[index].text}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
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
      setLastError(`Img Error: ${e.message}`);
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
    // 只有當 aiAnalysis 真的有值時，才跳轉到結果頁
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

  // AI 分析主邏輯
  useEffect(() => {
    if (step === 'diagnosing' && localSummary && !aiFetchingRef.current) {
      const fetchAiAnalysis = async () => {
        aiFetchingRef.current = true;
        setIsAiLoading(true);
        setLastError(''); 

        const fallbackAnalysis: AiReport = {
          selectedPersonaId: localSummary.totalScore > 36 ? 'charmer' : 'neighbor',
          personaExplanation: "⚠️ AI 連線忙碌中，這是根據您的分數生成的基礎報告。",
          personaOverview: "您的魅力潛力巨大，建議重新整理頁面再次進行深度分析。",
          appearanceAnalysis: "保持整潔，找出適合自己的風格是第一步。",
          socialAnalysis: "社群媒體是您的名片，試著多展現生活感。",
          interactionAnalysis: "主動一點，故事就會開始。",
          mindsetAnalysis: "心態決定高度，保持自信。",
          coachGeneralAdvice: "系統暫時無法連線至 AI 大腦，請檢查下方的錯誤訊息，或稍後再試。"
        };

        const apiKey = process.env.API_KEY;
        if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
          setLastError("API Key MISSING or Invalid.");
          setAiAnalysis(fallbackAnalysis);
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
            請分析以上數據，並嚴格依照下方的 JSON 格式回傳報告。不要包含任何 Markdown 格式標記（如 \`\`\`json）。

            必須回傳的 JSON 結構範本：
            {
              "selectedPersonaId": "從 [charmer, statue, hustler, neighbor, sage, pioneer] 中選一個最貼切的 ID",
              "personaExplanation": "解釋為何選這個人格 (約 100 字)",
              "personaOverview": "一句話總結他的現狀",
              "appearanceAnalysis": "針對形象外表的具體分析與建議 (約 50 字)",
              "socialAnalysis": "針對社群形象的具體分析與建議 (約 50 字)",
              "interactionAnalysis": "針對行動與互動的具體分析與建議 (約 50 字)",
              "mindsetAnalysis": "針對心態與習慣的具體分析與建議 (約 50 字)",
              "coachGeneralAdvice": "彭邦典教練的總結戰略建議 (直白、專業，約 100 字)"
            }

            重要規則：
            - 若總分 > 38 且各維度均衡，selectedPersonaId 必須是 'charmer'。
            - 語氣：有威嚴、專業、直白。
          `;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              // 改用純字串設定 Safety Settings，避免 Enum Import 問題
              safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              ]
            }
          });

          const jsonText = response.text;
          console.log("Raw AI Response:", jsonText); 

          if (!jsonText) {
            throw new Error("Empty response from AI model");
          }

          let json;
          try {
             const cleanText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
             json = JSON.parse(cleanText);
          } catch (e) {
             throw new Error("Invalid JSON format");
          }

          if (!json.selectedPersonaId) {
             throw new Error("Missing fields in AI response");
          }

          setAiAnalysis(json);
        } catch (e: any) {
          console.error("AI Analysis Error:", e);
          let detailedError = e.message || e.toString();
          setLastError(detailedError);
          // 發生任何錯誤，強制設定 Fallback 數據，確保頁面不會空白
          setAiAnalysis(fallbackAnalysis);
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

  // Helper function to get the AI analysis text for a specific category
  const getAiAnalysisForCategory = (category: Category) => {
    if (!aiAnalysis) return "分析中...";
    switch(category) {
      case '形象外表': return aiAnalysis.appearanceAnalysis;
      case '社群形象': return aiAnalysis.socialAnalysis;
      case '行動與互動': return aiAnalysis.interactionAnalysis;
      case '心態與習慣': return aiAnalysis.mindsetAnalysis;
      default: return "";
    }
  };

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

      {step === 'result' && localSummary && aiAnalysis && (
        <div className="w-full space-y-10 py-8 animate-fade-in px-2">
          {/* 1. 人格卡片區塊 */}
          <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="relative aspect-[3/2] bg-gray-50 flex items-center justify-center">
              <img src={activePersona.imageUrl} alt={activePersona.title} className="w-full h-full object-contain p-6" />
              <div className="absolute bottom-0 left-0 p-8 text-white bg-gradient-to-t from-black/80 w-full">
                <div className="flex flex-col items-start space-y-1 mb-2">
                   <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Persona</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{activePersona.title}</h2>
                <p className="text-lg md:text-xl font-medium text-white/90 italic">{aiAnalysis.personaOverview || activePersona.subtitle}</p>
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
                 <p className="text-slate-800 text-lg md:text-xl leading-relaxed font-bold">{aiAnalysis.personaExplanation}</p>
              </div>
            </div>
          </div>

          {/* 2. 數據雷達圖區塊 (移到這裡) */}
          <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-slate-50 text-center">
            <div className="text-3xl md:text-4xl font-black text-slate-800 mb-8">總體魅力：<span className="text-blue-600">{localSummary.totalScore}</span> <span className="text-slate-300 text-lg">/ 48</span></div>
            <div className="h-[20rem] md:h-[24rem] mb-6"><canvas ref={radarChartRef}></canvas></div>
          </div>

          {/* 3. 四大維度深度診斷區塊 */}
          <div className="grid grid-cols-1 gap-6">
             <div className="text-center py-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">四大屬性深度剖析</h3>
                <p className="text-slate-400 font-bold">由 AI 針對你的回答細節生成的專屬建議</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localSummary.summary.map((item) => (
                  <div key={item.category} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col space-y-4 relative overflow-hidden group hover:shadow-xl transition-all">
                     <div className={`absolute top-0 left-0 w-2 h-full ${item.level === '綠燈' ? 'bg-green-500' : item.level === '黃燈' ? 'bg-orange-400' : 'bg-red-500'}`}></div>
                     <div className="flex items-center justify-between pl-4">
                        <h4 className="text-xl font-black text-slate-800">{item.category}</h4>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-black ${item.level === '綠燈' ? 'bg-green-100 text-green-700' : item.level === '黃燈' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {item.level} ({item.score}分)
                        </span>
                     </div>
                     <p className="text-slate-600 leading-relaxed pl-4 text-justify font-medium">
                       {getAiAnalysisForCategory(item.category)}
                     </p>
                  </div>
                ))}
             </div>
          </div>

          {/* 4. 教練總結與 CTA 區塊 (重構為無縫長卡片) */}
          {activePersona.id === 'charmer' ? (
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-[3.5rem] shadow-2xl p-10 md:p-14 text-center space-y-8 animate-fade-in border border-slate-800">
              <div className="text-6xl md:text-8xl">🏆</div>
              <h4 className="text-3xl md:text-4xl font-black text-white">你已是頂級魅力家</h4>
              <p className="text-slate-300 text-xl md:text-2xl font-bold">彭教練對你唯一的建議是：好好善用這份天賦。祝你一帆風順！</p>
            </div>
          ) : (
            <div className="rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col bg-white">
              {/* 上半部：圖片 */}
              <div className="w-full relative">
                <img src={EXPERT_CONFIG.imageUrl} alt="Expert Coach" className="w-full h-auto block object-cover" />
              </div>
              
              {/* 下半部：無縫銜接的深色文字區塊 */}
              <div className="bg-slate-900 p-8 md:p-12 space-y-8 flex-1">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">💡</span>
                    <h3 className="text-2xl font-black text-amber-400 tracking-tight">教練總結</h3>
                  </div>
                  
                  {/* AI 建議 */}
                  <p className="text-lg md:text-xl leading-relaxed font-medium text-slate-200 opacity-95 text-justify">
                    {aiAnalysis.coachGeneralAdvice}
                  </p>

                  {/* 分隔線 */}
                  <div className="w-full h-px bg-slate-700 my-4"></div>

                  {/* 課程銷售文案 */}
                  <p className="text-lg md:text-xl leading-relaxed font-bold text-white text-justify">
                    {EXPERT_CONFIG.description}
                  </p>
                </div>

                <button onClick={() => window.open('https://www.menspalais.com', '_blank')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[2rem] text-xl md:text-2xl shadow-xl shadow-blue-900/50 flex items-center justify-center space-x-3 transition transform active:scale-95 mt-4">
                  <span>{EXPERT_CONFIG.ctaButtonText}</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="text-center pb-8"><button onClick={handleStart} className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors">重新進行測試</button></div>
        </div>
      )}

      <footer className="w-full text-center py-10 text-slate-400 text-[12px] px-6 border-t border-slate-100 mt-auto space-y-2 bg-slate-50">
        <p className="font-bold">© 男性形象教練 彭邦典 版權所有</p>
        <p>本測驗深度診斷由 AI 輔助生成，測驗結果僅供社交魅力提升參考。</p>
        
        {/* DEBUG PANEL - 顯示錯誤訊息 */}
        <div className="inline-block mt-4 px-4 py-3 bg-white border border-slate-200 rounded text-xs font-mono text-left shadow-sm max-w-full overflow-hidden">
           <p className={`font-bold ${keyStatus.startsWith('MISSING') ? 'text-red-600' : 'text-green-600'}`}>
             API Key: {keyStatus}
           </p>
           {/* 紅色錯誤顯示區 */}
           {lastError && (
             <div className="mt-2 p-2 bg-red-50 text-red-600 border border-red-100 rounded break-all">
               <strong>GOOGLE API ERROR:</strong> <br/>
               {lastError}
             </div>
           )}
           {lastError.includes('referer') && (
             <p className="text-slate-500 mt-2 italic">
               Hint: Your Google Key restricts domains. Add <b>https://love-test-*.vercel.app/*</b> to your Google Cloud Console "Website Restrictions".
             </p>
           )}
        </div>
      </footer>
    </div>
  );
};

export default App;
