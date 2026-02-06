'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui/Components';
import { Header } from '@/components/ui/Header';
import { ThreeCanvas } from '@/components/canvas/Scene';
import { GoldParticles } from '@/components/canvas/Particles';
import { CountdownOverlay } from '@/components/ui/CountdownOverlay';
import { useCourse, Shop } from '@/context/CourseContext';
import MemoSection from '@/components/shop/MemoSection';
import { AgentSelector } from '@/components/agent/AgentSelector';
import { AgentResults } from '@/components/agent/AgentResults';
import { AgentType, AgentResponse } from '@/lib/agents/core';

function SearchResults() {
  const searchParams = useSearchParams();
  const station = searchParams.get('station');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const genre = searchParams.get('genre');
  const mode = searchParams.get('mode');
  const router = useRouter();
  const { addToCourse, removeFromCourse, isInCourse } = useCourse();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to process JSON response (Streaming Keep-Alive Supported)
  const fetchSearch = async (url: string) => {
    setLoading(true);
    setError('');
    setShops([]);

    // Check Session Storage first
    const cacheKey = `search_cache_${url}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
       console.log("Using client-side cache");
       setShops(JSON.parse(cached));
       setLoading(false);
       return;
    }

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorMsg = 'Failed to fetch shops';
            try {
                // Try to parse error json if possible, or fallback
                // clone() might be needed if body is used, but for error cases typically fine
                const errorData = await response.json(); 
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                // ignore
            }
            throw new Error(errorMsg);
        }
        
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value, { stream: true });
            result += text;
            
            // The server sends " " (space) as heartbeat.
            // We just accumulate it. The final JSON parse will ignore whitespace.
        }
        
        const jsonString = result.trim();
        
        if (!jsonString) {
             console.warn("Empty response from search API");
             setShops([]);
             setLoading(false);
             return;
        }

        const data = JSON.parse(jsonString);
        
        if (data.shops) {
            setShops(data.shops);
            // Save to Session Storage
            try {
               sessionStorage.setItem(cacheKey, JSON.stringify(data.shops));
            } catch (e) {
               console.warn("Failed to save to sessionStorage", e);
            }
        } else {
             setShops([]);
        }

        setLoading(false);
    } catch (err) {
        console.error('Search Error:', err);
        setError('店舗情報の取得に失敗しました。');
        setLoading(false);
    }
  };

  useEffect(() => {
    if (station || (lat && lng)) {
        const query = [
            station && `station=${encodeURIComponent(station)}`,
            lat && lng && `lat=${lat}&lng=${lng}`,
            genre && `genre=${encodeURIComponent(genre)}`,
            mode && `mode=${mode}`
        ].filter(Boolean).join('&');
        
        // Save current search URL for "Back" navigation
        const currentUrl = `/search?${query}`;
        localStorage.setItem('lastSearchUrl', currentUrl);

        fetchSearch(`/api/search?${query}`);
    } else {
        setLoading(false);
    }
  }, [station, lat, lng, genre, mode]);

  const handleResearch = () => {
    if (station || (lat && lng)) {
        const query = [
            station && `station=${encodeURIComponent(station)}`,
            lat && lng && `lat=${lat}&lng=${lng}`,
            genre && `genre=${encodeURIComponent(genre)}`,
            mode && `mode=${mode}`,
            'force=true'
        ].filter(Boolean).join('&');
        
        fetchSearch(`/api/search?${query}`);
    }
  };

  const toggleCourse = (e: React.MouseEvent, shop: Shop) => {
    e.stopPropagation();
    if (isInCourse(shop.id)) {
        removeFromCourse(shop.id);
    } else {
        addToCourse(shop);
    }
  };

  // State for expanded UI
  const [openMemoId, setOpenMemoId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});
  
  // Agent State (Per Shop)
  // Agent State (Per Shop)
  const [activeAgentShopId, setActiveAgentShopId] = useState<string | null>(null); // To open selector
  // We keep results state global so they persist  // --- State for Agent Results ---
  // Load from sessionStorage on mount to persist across navigation
  const [shopAgentResults, setShopAgentResults] = useState<Record<string, AgentResponse[]>>({});
  const [shopPendingAgents, setShopPendingAgents] = useState<Record<string, AgentType[]>>({});
  const [resultModalShopId, setResultModalShopId] = useState<string | null>(null);

  // Restore state from session storage
  useEffect(() => {
      const savedResults = sessionStorage.getItem('shinise_agent_results');
      if (savedResults) {
          try {
              setShopAgentResults(JSON.parse(savedResults));
          } catch (e) {
              console.error("Failed to parse saved agent results", e);
          }
      }
  }, []);

  // Save state to session storage whenever it changes
  useEffect(() => {
      if (Object.keys(shopAgentResults).length > 0) {
          sessionStorage.setItem('shinise_agent_results', JSON.stringify(shopAgentResults));
      }
  }, [shopAgentResults]);

  const handleDeployAgents = (shop: Shop, selected: AgentType[]) => {
      setActiveAgentShopId(null);
      setResultModalShopId(shop.id); // Open results modal immediately
      
      // Initialize state for this shop if not exists or append? 
      // User says "Agent Go", implies a new run or adding. Let's merge or reset? 
      // Ideally reset for fresh run or append. Let's append but filter dupes if needed.
      // For simplicity/demo: Reset pending, keep old results, add new pending.
      
      // Throttled Concurrent Execution (Limit: 3)
      // Throttled Concurrent Execution (Limit: 3)
      const CONCURRENCY_LIMIT = 3;
      const queue = [...selected];
      
      // Initialize pending state for all selected agents
      setShopPendingAgents(prev => ({ 
          ...prev, 
          [shop.id]: [...(prev[shop.id] || []), ...selected] 
      }));

      const processAgent = async (type: AgentType) => {
        console.log(`[Client Debug] Deploying agent ${type} for shop ${shop.id}`);
        try {
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentType: type,
                    shopName: shop.displayName.text,
                    shopAddress: shop.formattedAddress,
                    shopId: shop.id
                })
            });
            
            let data: AgentResponse;
            if (!res.ok) {
                if (res.status === 429) {
                    data = {
                        agentType: type,
                        agentName: "Error",
                        icon: "⚠️",
                        summary: "混雑中",
                        details: ["アクセス集中により制限されています。少し時間を置いてください。"],
                        riskLevel: "caution"
                    }
                } else {
                     throw new Error(`API Error: ${res.status}`);
                }
            } else {
                // Handle Streaming Keep-Alive
                if (!res.body) throw new Error("No response body");
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let result = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    result += decoder.decode(value, { stream: true });
                }
                
                const jsonString = result.trim();
                if (!jsonString) throw new Error("Empty response");
                
                data = JSON.parse(jsonString);
            }
            
            setShopAgentResults(prev => {
                const current = prev[shop.id] || [];
                // Remove existing result of same type
                const filtered = current.filter(item => item.agentType !== type);
                return {
                    ...prev,
                    [shop.id]: [...filtered, data]
                };
            });
        } catch (e: any) {
            console.error(`Agent ${type} failed`, e);
            setShopAgentResults(prev => {
                const current = prev[shop.id] || [];
                const filtered = current.filter(item => item.agentType !== type);
                return {
                    ...prev,
                    [shop.id]: [...filtered, {
                        agentType: type,
                        agentName: "Error",
                        icon: "❌",
                        summary: "通信エラー",
                        details: [e.message || "不明なエラー"],
                        riskLevel: "caution"
                    }]
                };
            });
        } finally {
             // Remove from pending
             setShopPendingAgents(prev => ({
                ...prev,
                [shop.id]: (prev[shop.id] || []).filter(p => p !== type)
            }));
        }
      };

      const worker = async () => {
          while (queue.length > 0) {
              const type = queue.shift();
              if (type) await processAgent(type);
          }
      };

      // Launch workers allowed by concurrency limit
      const workers = Array(Math.min(selected.length, CONCURRENCY_LIMIT))
          .fill(null)
          .map(() => worker());
          
      // workers continue in background
  };

  // Memo Component Import (Dynamic import to avoid circular dep issues if any, or just regular)
  // We need to import MemoSection at the top file level, but I'll assume it's added.

  const handleAnalyze = async (shop: Shop) => {
    setAnalyzingId(shop.id);
    try {
       const res = await fetch('/api/analyze-reviews', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ placeId: shop.id, shopName: shop.displayName.text })
       });
       const data = await res.json();
       if (data.analysis) {
         setAnalysisResults(prev => ({ ...prev, [shop.id]: data.analysis }));
       }
    } catch (e) {
       console.error("Analysis failed", e);
       alert("分析に失敗しました");
    } finally {
       setAnalyzingId(null);
    }
  };

  const toggleMemo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMemoId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-[#FAFAFA] font-[family-name:var(--font-sans)] pb-20 relative">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none fixed">
        <ThreeCanvas>
          <GoldParticles />
        </ThreeCanvas>
      </div>

      <Header />
      
      {/* 3-Minute Gorgeous Countdown Overlay */}
      <CountdownOverlay isLoading={loading} />

      {/* Responsive container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-[#D4AF37]/30">
            <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-mincho)] text-white drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
            {station ? `${station} ` : '現在地'} 
            {genre ? `× ${genre}` : ''} 周辺の候補
            </h2>
            
            {!loading && (
                <Button 
                    onClick={handleResearch} 
                    className="mt-4 md:mt-0 text-sm font-bold py-3 px-8 rounded-full shadow-[0_4px_15px_rgba(212,175,55,0.4)] transition-all hover:scale-105 active:scale-95 border-none relative overflow-hidden group"
                    style={{ 
                        background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)',
                        color: '#1a0f0a',
                        zIndex: 50
                    }}
                >
                    <span className="relative z-10 flex items-center">
                        情報を更新して再検索
                        <span className="absolute inset-0 bg-white/30 skew-x-12 -translate-x-full group-hover:animate-[shimmer_1s_infinite] w-full h-full block transform origin-left" style={{ filter: 'blur(5px)' }}></span>
                    </span>
                </Button>
            )}
        </div>

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        {!loading && !error && shops.length === 0 && (
          <p className="text-center py-20 opacity-60">老舗が見つかりませんでした。</p>
        )}

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => {
              const inCourse = isInCourse(shop.id);
              // const analysis = analysisResults[shop.id]; // Deprecated old analysis
              const results = shopAgentResults[shop.id] || [];
              const pending = shopPendingAgents[shop.id] || [];

              return (
                <Card key={shop.id} className="cursor-default bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden rounded-xl transition-all duration-300 hover:border-[#D4AF37]/30">
                    <div className="relative h-48 bg-black/50 overflow-hidden">
                        {/* Image */}
                        {shop.photos && shop.photos.length > 0 ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                                src={`/api/image?name=${shop.photos[0].name}&maxWidthPx=400`}
                                alt={shop.displayName.text}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110 opacity-80 hover:opacity-100"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#1a0f0a]">
                                No Image
                            </div>
                        )}
                        
                        {/* Score Badges */}
                        <div className="absolute top-2 right-2 flex gap-2">
                            {/* Gourmet Score */}
                            {shop.aiAnalysis?.tabelog_rating && shop.aiAnalysis.tabelog_rating > 0 && (
                                 <div className="bg-gradient-to-br from-black/90 via-[#1a0f0a] to-[#3a2f0a] backdrop-blur px-3 py-2 rounded-lg border border-[#D4AF37] shadow-[0_4px_10px_rgba(212,175,55,0.3)] min-w-[60px] flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-bold block text-center text-[#D4AF37] tracking-wider mb-0.5 whitespace-nowrap">グルメ度</span>
                                    <span className="text-xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tabular-nums tracking-tighter w-full text-center">
                                        {(Number(shop.aiAnalysis.tabelog_rating) * 30).toFixed(0)}
                                    </span>
                                </div>
                            )}
                        </div>

                         {/* Add to Course Button (Overlay on Image Bottom Right) */}
                         <div className="absolute bottom-2 right-2">
                            <button
                                onClick={(e) => toggleCourse(e, shop)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all duration-300 ${inCourse ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.6)]' : 'bg-black/60 text-white border border-white/30 hover:bg-black/80'}`}
                            >
                                {inCourse ? (
                                  <>
                                    <span className="text-xl">✓</span> <span>コース追加済</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xl">+</span> <span>飲み歩きコースに追加</span>
                                  </>
                                )}
                            </button>
                         </div>
                    </div>
                    
                    <div className="p-5">
                        <h3 className="text-lg font-bold mb-1 text-white font-[family-name:var(--font-mincho)]">
                            {shop.displayName.text}
                        </h3>
                        {/* Founding Year */}
                        {shop.aiAnalysis?.founding_year && shop.aiAnalysis.founding_year !== '不明' && (
                            <p className="text-xs text-[#D4AF37] mb-2 font-semibold flex items-center">
                               <span className="mr-1">🏛️</span> 創業：{shop.aiAnalysis.founding_year}
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mb-4">{shop.formattedAddress}</p>
                        
                        {/* AI Summary */}
                        {shop.aiAnalysis?.reasoning && (
                                <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5em] mb-4">
                                {shop.aiAnalysis.reasoning}
                                </p>
                        )}

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                             {/* Tabelog */}
                             <a 
                                href={`https://tabelog.com/rstLst/?vs=1&sw=${encodeURIComponent(shop.aiAnalysis?.tabelog_name || shop.displayName.text)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded border border-[#D4AF37]/30 transition-colors"
                            >
                                <span>食べログ</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>

                            {/* Google Maps */}
                             <a 
                                href={shop.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.formattedAddress + " " + shop.displayName.text)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded border border-white/20 transition-colors"
                            >
                                <span>Google Maps</span>
                            </a>

                            {/* Memo Toggle */}
                            <button
                                onClick={(e) => toggleMemo(e, shop.id)}
                                className={`flex items-center justify-center gap-1 py-2 text-xs font-bold rounded border transition-colors ${openMemoId === shop.id ? 'bg-white/20 border-white text-white' : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/10'}`}
                            >
                                <span>{openMemoId === shop.id ? 'メモを閉じる' : 'メモを書く'}</span>
                            </button>

                            {/* New Agent Mission Control Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveAgentShopId(shop.id); }}
                                className="flex items-center justify-center gap-1 py-2 bg-black/40 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] md:text-xs font-bold rounded border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all animate-pulse hover:animate-none"
                            >
                                <span className="mr-1">🕵️‍♀️</span> 作戦会議
                            </button>
                             {/* View Results Button (if results exist) */}
                             {(results.length > 0 || pending.length > 0) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setResultModalShopId(shop.id); }}
                                    className="flex items-center justify-center gap-1 py-2 bg-[#D4AF37] text-black text-[10px] md:text-xs font-bold rounded border border-[#D4AF37] shadow-lg transition-all col-span-2"
                                >
                                    <span>📑 レポートを見る ({results.length}/{results.length + pending.length})</span>
                                </button>
                             )}
                        </div>



                        {/* Memo Section */}
                        {openMemoId === shop.id && (
                             <div className="animate-in fade-in slide-in-from-top-2">
                                <MemoSection placeId={shop.id} />
                             </div>
                        )}

                    </div>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Global Agent Selector Modal */}
      {activeAgentShopId && (() => {
         const shop = shops.find(s => s.id === activeAgentShopId);
         if (!shop) return null;
         return (
            <AgentSelector 
                onDeploy={(selected) => handleDeployAgents(shop, selected)}
                onCancel={() => setActiveAgentShopId(null)}
            />
         );
      })()}

      {/* Global Agent Results Modal */}
      {resultModalShopId && (() => {
          const shop = shops.find(s => s.id === resultModalShopId);
          if (!shop) return null;
          const results = shopAgentResults[shop.id] || [];
          const pending = shopPendingAgents[shop.id] || [];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
                 <div className="w-full max-w-5xl bg-[#1a0f0a] border border-[#D4AF37]/50 rounded-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#D4AF37]/10">
                        <div>
                             <h2 className="text-xl font-bold font-[family-name:var(--font-mincho)] text-white flex items-center gap-2">
                                <span className="text-2xl">📑</span> Mission Result: {shop.displayName.text}
                             </h2>
                        </div>
                        <button onClick={() => setResultModalShopId(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                            ✕
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-black/20">
                         <AgentResults results={results} pendingAgents={pending} />
                         
                         {/* Empty State */}
                         {results.length === 0 && pending.length === 0 && (
                             <div className="text-center py-20 text-gray-500">
                                 まだエージェントが派遣されていません。
                             </div>
                         )}
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/10 bg-[#1a0f0a] flex justify-end gap-4">
                         <Button onClick={() => { setActiveAgentShopId(shop.id); }} variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
                             + 追加エージェント派遣
                         </Button>
                         <Button onClick={() => setResultModalShopId(null)}>
                             閉じる
                         </Button>
                    </div>
                 </div>
            </div>
          );
      })()}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[#D4AF37]">Loading Search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
