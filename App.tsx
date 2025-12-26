
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { QUESTIONS, OPTIONS, CATEGORY_INFO, PERSONAS, EXPERT_CONFIG, CATEGORY_IMAGES } from './constants';
import { Category } from './types';
import Chart from 'chart.js/auto';

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
  
  const [aiAnalysis, setAiAnalysis] = useState<AiReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);

  // Refs
  const aiFetchingRef = useRef(false);
  const radarChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  const handleStart = () => {
    setStep('quiz');
    setCurrentIdx(0);
    setIsIntroMode(true);
    setAnswers({});
    setAiAnalysis(null);
    setFakeProgress(0);
    aiFetchingRef.current = false;
  };

  // 模擬進度條動畫
  useEffect(() => {
    let timer: number;
    if (step === 'diagnosing') {
      setFakeProgress(1);
      timer = window.setInterval(() => {
        setFakeProgress(prev => {
          if (prev >= 98) return prev;
          return prev + 1.2; 
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [step]);

  // AI 結束後跳轉
  useEffect(() => {
    if (step === 'diagnosing' && aiAnalysis) {
      setFakeProgress(100);
      const timer = setTimeout(() => {
        setStep('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
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
      return { 
        category: cat, 
        score, 
        level, 
        color, 
        description: CATEGORY_INFO[cat].description, 
        suggestion: CATEGORY_INFO[cat].suggestions[level] 
      };
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

        const fallbackAnalysis: AiReport = {
          selectedPersonaId: localSummary.totalScore > 30 ? 'charmer' : 'neighbor',
          personaExplanation: "目前的分析顯示，你在社交維度上有獨特的發展軌跡。這份建議是基於你的分數趨勢生成的基礎版點評。",
          personaOverview: "你的魅力潛力正在覺醒，只需要正確的戰略引導。",
          appearanceAnalysis: "保持整潔是基本，找到能突顯個人氣質的穿搭風格是關鍵。",
          socialAnalysis: "社群是你的第二生命，多展現生活感強的照片能拉近距離。",
          interactionAnalysis: "互動的關鍵在於推拉，試著在關心之餘展現一點點幽默感。",
          mindsetAnalysis: "強大的心態是脫單的基石，每一次拒絕都是優化的機會。",
          coachGeneralAdvice: "你的數據顯示出你具備社交基礎，但目前在某些環節還欠缺火侯。\n\n建議先從最有把握的環節開始優化，穩定感比短暫的高標更有吸引力。"
        };

        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const detailedData = QUESTIONS.map(q => ({
            question: q.text,
            category: q.category,
            answer: OPTIONS.find(o => o.value === answers[q.id])?.label || '未答'
          }));

          const prompt = `測驗數據細節：
            總分：${localSummary.totalScore}/48
            分項分數：${JSON.stringify(localSummary.summary.map(s => ({ cat: s.category, score: s.score })))}
            原始作答：${JSON.stringify(detailedData)}`;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: prompt,
            config: {
              systemInstruction: `你現在是專業形象教練「彭邦典」。這是一位 25-35 歲男性的「脫單力檢核」測驗結果深度報告。
              任務指令：分析數據並回傳 JSON。人格原型 ID 限於 [charmer, statue, hustler, neighbor, sage, pioneer]。
              關於「coachGeneralAdvice」：宏觀戰略與核心盲點分析，語氣像溫暖的兄長，段落間請用 \\n 換行。`,
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

          const jsonText = response.text;
          if (!jsonText) throw new Error("Empty response");
          setAiAnalysis(JSON.parse(jsonText.trim()));
        } catch (e: any) {
          console.error("AI Error:", e);
          setAiAnalysis(fallbackAnalysis);
        } finally {
          setIsAiLoading(false);
        }
      };
      fetchAiAnalysis();
    }
  }, [step, localSummary]);

  // 雷達圖
  useEffect(() => {
    if (step === 'result' && localSummary && radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d');
      if (ctx) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: localSummary.summary.map(r => r.category),
            datasets: [{
              label: '能力分佈',
              data: localSummary.summary.map(r => r.score),
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 3,
              pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            }]
          },
          options: {
            scales: { 
              r: { 
                min: 0, 
                max: 12, 
                ticks: { display: false }, 
                pointLabels: { 
                  font: { 
                    size: 14, 
                    weight: 'bold' // 修復：將 '700' 改為 'bold' 以解決 TS 類型錯誤
                  } 
                } 
              } 
            },
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
          }
        });
      }
    }
    // Cleanup function to destroy chart on unmount or step change
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [step, localSummary]);

  const handleAnswer = (score: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentIdx].id]: score }));
    
    // 視覺回饋與自動進度
    setTimeout(() => {
      if (currentIdx < QUESTIONS.length - 1) {
        const nextIdx = currentIdx + 1;
        if (nextIdx % 4 === 0) {
          setIsIntroMode(true);
        }
        setCurrentIdx(nextIdx);
      } else {
        setStep('diagnosing');
      }
    }, 200);
  };

  const prevStep = () => {
    if (isIntroMode) {
      if (currentIdx === 0) setStep('hero');
      else {
        setIsIntroMode(false);
        setCurrentIdx(currentIdx - 1);
      }
      return;
    }
    
    if (currentIdx % 4 === 0) setIsIntroMode(true);
    else setCurrentIdx(prev => prev - 1);
  };

  const currentQuestion = QUESTIONS[currentIdx];
  const progressPercentage = Math.round(((currentIdx) / QUESTIONS.length) * 100);

  if (step === 'hero') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="relative mb-12 animate-float">
          <img src="https://d1yei2z3i6k35z.cloudfront.net/2452254/694caa69f0eb6_main.svg" className="w-64 h-64 mx-auto" alt="Logo" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">男士脫單力<br/><span className="text-blue-500">深度診斷</span></h1>
        <p className="text-slate-400 text-lg md:text-2xl max-w-xl mb-12 font-medium">
          透過 AI 深度比對你的社交數據<br/>精準找出你在戀愛市場中的「定位盲點」
        </p>
        <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-6 px-16 rounded-full text-2xl transition-all transform hover:scale-105 shadow-2xl shadow-blue-900/40">
          立即啟動分析
        </button>
      </div>
    );
  }

  if (step === 'quiz') {
    return (
      <div className="min-h-screen bg-white flex flex-col animate-fade-in">
        <div className="w-full bg-slate-100 h-2">
          <div className="bg-blue-600 h-2 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
          {isIntroMode ? (
            <div className="text-center space-y-8 animate-fade-in">
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl">
                 <img src={CATEGORY_IMAGES[currentQuestion.category]} className="w-full h-full object-cover" alt="category" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h2 className="text-4xl font-black text-white">{currentQuestion.category}</h2>
                 </div>
              </div>
              <p className="text-xl text-slate-500 leading-relaxed font-bold">{CATEGORY_INFO[currentQuestion.category].description}</p>
              <div className="flex flex-col space-y-4">
                <button onClick={() => setIsIntroMode(false)} className="bg-slate-900 text-white font-black py-5 rounded-2xl text-xl shadow-xl">開始本章節</button>
                <button onClick={prevStep} className="text-slate-400 font-bold hover:text-slate-600">回到上一題</button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-8 animate-fade-in">
              <div className="text-center">
                <span className="text-blue-600 font-black tracking-widest uppercase text-sm">{currentQuestion.category}</span>
                <h2 className="text-2xl md:text-3xl font-black mt-4 leading-snug">{currentQuestion.text}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(opt.value)} 
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center group ${answers[currentQuestion.id] === opt.value ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 mr-4 flex items-center justify-center group-hover:border-blue-400">
                      <div className={`w-3 h-3 rounded-full bg-blue-600 transition-transform ${answers[currentQuestion.id] === opt.value ? 'scale-100' : 'scale-0'}`}></div>
                    </div>
                    <span className="text-lg font-black text-slate-700">{opt.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={prevStep} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">回到上一題</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (step === 'diagnosing') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="relative mb-10">
          <div className="w-32 h-32 border-8 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">{Math.round(fakeProgress)}%</div>
        </div>
        <h2 className="text-3xl font-black mb-4">AI 正在計算你的魅力原型...</h2>
        <div className="space-y-2 text-slate-400 font-medium">
          <p className={fakeProgress > 20 ? 'text-blue-400' : ''}>● 分析 16 項行為指標中</p>
          <p className={fakeProgress > 50 ? 'text-blue-400' : ''}>● 比對 5,000+ 社交成功案例</p>
          <p className={fakeProgress > 80 ? 'text-blue-400' : ''}>● 彭邦典教練生成診斷建議</p>
        </div>
      </div>
    );
  }

  const persona = PERSONAS.find(p => p.id === aiAnalysis?.selectedPersonaId) || PERSONAS[5];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 animate-fade-in">
      <div className="bg-white shadow-2xl rounded-b-[4rem] overflow-hidden">
        <div className="relative w-full aspect-square md:aspect-[21/9]">
          <img src={persona.imageUrl} className="w-full h-full object-cover" alt={persona.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
            <span className="text-blue-400 font-black tracking-widest mb-2 uppercase">Your Persona Type</span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2">{persona.title}</h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium italic">{persona.subtitle}</p>
          </div>
        </div>
        <div className="p-8 md:p-12 space-y-8">
          <div className="flex flex-wrap gap-3">
            {persona.tags.map(tag => <span key={tag} className="bg-slate-100 text-slate-800 px-5 py-2 rounded-full text-lg font-black border border-slate-200"># {tag}</span>)}
          </div>
          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
            <h3 className="text-blue-600 font-black text-xl mb-3">人格深度分析</h3>
            <p className="text-slate-700 text-lg leading-relaxed font-bold">{aiAnalysis?.personaExplanation}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12 space-y-12">
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl text-center">
          <h2 className="text-3xl font-black mb-8 text-slate-800">四大維度數據分析</h2>
          <div className="h-80 w-full"><canvas ref={radarChartRef}></canvas></div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localSummary?.summary.map(s => (
            <div key={s.category} className="bg-white p-8 rounded-[2.5rem] shadow-lg border-l-8 flex flex-col space-y-4" style={{ borderLeftColor: s.color }}>
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-black">{s.category}</h4>
                <span className="px-4 py-1 rounded-full text-sm font-black" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{s.level}</span>
              </div>
              <p className="text-slate-600 font-bold leading-relaxed">{s.category === '形象外表' ? aiAnalysis?.appearanceAnalysis : s.category === '社群形象' ? aiAnalysis?.socialAnalysis : s.category === '行動與互動' ? aiAnalysis?.interactionAnalysis : aiAnalysis?.mindsetAnalysis}</p>
            </div>
          ))}
        </div>

        <section className="bg-slate-900 rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-800">
          <img src={EXPERT_CONFIG.imageUrl} className="w-full aspect-video object-cover" alt="Coach" />
          <div className="p-10 md:p-14 space-y-8">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-400 p-1 rounded-lg text-slate-900 font-black px-3 py-1 uppercase text-sm tracking-tighter">Strategic Insight</div>
              <h3 className="text-2xl font-black text-white">教練專屬戰略建議</h3>
            </div>
            <div className="space-y-6">
              {aiAnalysis?.coachGeneralAdvice.split('\n').filter(l => l.trim()).map((line, i) => (
                <p key={i} className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium text-justify">{line}</p>
              ))}
            </div>
            <div className="pt-6">
              <button onClick={() => window.open('https://www.menspalais.com', '_blank')} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl text-2xl shadow-xl transition-all transform active:scale-95">
                {EXPERT_CONFIG.ctaButtonText}
              </button>
            </div>
          </div>
        </section>

        <footer className="text-center pt-10 pb-20">
          <button onClick={handleStart} className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors">重新進行測試</button>
        </footer>
      </div>
    </div>
  );
};

export default App;
