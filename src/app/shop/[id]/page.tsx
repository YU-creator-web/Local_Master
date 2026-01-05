'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui/Components';
import { useAuth } from '@/lib/firebase/auth';
import { ThreeCanvas } from '@/components/canvas/Scene';
import { GoldParticles } from '@/components/canvas/Particles';
import MemoSection from '@/components/shop/MemoSection';


function ShopDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [shop, setShop] = useState<any>(null);
  const [aiGuide, setAiGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  


  // Fetch Shop Details
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/shop/${id}`);
        if (!res.ok) throw new Error('Failed to fetch shop details');
        const data = await res.json();
        
        setShop(data.shop);
        setAiGuide(data.aiGuide);
      } catch (err) {
        setError('店舗情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0f0a] flex items-center justify-center flex-col">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-[family-name:var(--font-mincho)] text-[#D4AF37] animate-pulse">老舗の物語を紡いでいます...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col p-4 bg-[#1a0f0a] text-white">
        <p className="text-red-500 mb-4">{error || 'Shop not found'}</p>
        <Button onClick={() => router.push('/')}>トップへ戻る</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-[#FAFAFA] font-[family-name:var(--font-sans)] pb-20 relative">
       <div className="absolute inset-0 z-0 opacity-30 pointer-events-none fixed">
          <ThreeCanvas>
            <GoldParticles />
          </ThreeCanvas>
        </div>
      
      {/* Hero Section */}
      <div className="w-full h-[50vh] bg-black relative overflow-hidden group">
        {shop.photos && shop.photos.length > 0 ? (
           /* eslint-disable-next-line @next/next/no-img-element */
           <img 
             src={`/api/image?name=${shop.photos[0].name}&maxWidthPx=1200`}
             alt={shop.displayName.text}
             className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-[2000ms]"
           />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a0f0a] text-gray-600">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0a] via-transparent to-black/30"></div>
        
        {/* Navigation & Title */}
        <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start">
             <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="text-xs border-white/20 bg-black/20 backdrop-blur-md text-white hover:bg-white/20"
            >
                ← 戻る
            </Button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 z-10 max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-mincho)] mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[#F0E68C] to-white drop-shadow-lg leading-tight">
                {shop.displayName.text}
            </h1>
            <p className="text-sm md:text-base opacity-90 text-gray-200 font-light tracking-wide flex items-center mb-6">
                <span className="mr-4">📍 {shop.formattedAddress}</span>
                {aiGuide?.smoking_status && aiGuide.smoking_status !== '不明' && (
                    <span className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs">
                         🚬 {aiGuide.smoking_status}
                    </span>
                )}
            </p>
            
            {/* Actions */}
            <div className="flex flex-wrap gap-4">
                <a 
                    href={`https://tabelog.com/rstLst/?vs=1&sw=${encodeURIComponent(shop.displayName.text)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[#D4AF37] hover:bg-[#B5952F] text-black font-bold py-3 px-6 rounded-lg transition-colors shadow-lg flex items-center"
                >
                    <span>食べログで探す</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
                <a 
                    href={shop.googleMapsUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-lg transition-all backdrop-blur-md flex items-center"
                >
                    Google Maps
                </a>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 space-y-12 mb-20">
        
        {/* AI Guide Section */}
        {aiGuide && (
            <div className="bg-[#1a0f0a]/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden relative p-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>
                
                <div className="flex items-center mb-10 pb-6 border-b border-white/5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7326] flex items-center justify-center text-[#1a0f0a] font-bold text-xl mr-5 shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                        AI
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-[family-name:var(--font-mincho)] text-white mb-1">
                            老舗鑑定士の「ここが推し」
                        </h2>
                        <p className="text-xs text-[#D4AF37] opacity-80 tracking-widest font-sans">Powered by Gemini 3.0 Pro</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="prose prose-invert max-w-none">
                        <h3 className="flex items-center text-[#D4AF37] font-bold mb-4 text-lg tracking-wide border-l-4 border-[#D4AF37] pl-3">
                             物語・歴史
                        </h3>
                        <p className="text-base leading-relaxed text-gray-300 font-light tracking-wide text-justify">
                            {aiGuide.history_background}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
                             <h3 className="font-bold text-[#FDB931] mb-2 text-sm flex items-center">
                                <span className="mr-2 text-lg">★</span> おすすめポイント
                             </h3>
                             <p className="text-sm text-gray-300 leading-relaxed">{aiGuide.recommended_points}</p>
                        </div>
                         <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
                             <h3 className="font-bold text-[#D4AF37] mb-2 text-sm flex items-center">
                                <span className="mr-2 text-lg">♨</span> 雰囲気・時間帯
                             </h3>
                             <p className="text-sm text-gray-300 leading-relaxed mb-2">{aiGuide.atmosphere}</p>
                             <p className="text-xs text-gray-500 border-t border-white/10 pt-2 mt-2">
                                🕒 {aiGuide.best_time_to_visit}
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Basic Info & Map Section */}
        <section>
            <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-mincho)] text-[#D4AF37] text-center">
                店舗情報・アクセス
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info List */}
                <div className="md:col-span-1 space-y-4 text-sm text-gray-300 bg-white/5 p-6 rounded-xl border border-white/5 h-fit">
                    <div>
                        <p className="text-[#D4AF37] text-xs mb-1">住所</p>
                        <p>{shop.formattedAddress}</p>
                    </div>
                    {shop.internationalPhoneNumber && (
                        <div>
                            <p className="text-[#D4AF37] text-xs mb-1">電話番号</p>
                            <p>{shop.internationalPhoneNumber}</p>
                        </div>
                    )}
                    {/* Add more fields if available from details */}
                    {aiGuide?.smoking_status && (
                        <div>
                             <p className="text-[#D4AF37] text-xs mb-1">喫煙・禁煙</p>
                             <p>{aiGuide.smoking_status}</p>
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="md:col-span-2 h-64 md:h-auto min-h-[250px] rounded-xl overflow-hidden shadow-lg border border-white/10 grayscale hover:grayscale-0 transition-all duration-500 relative bg-white/5">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_MAPS_JS_API_KEY}&q=place_id:${id}`}
                    ></iframe>
                </div>
            </div>
        </section>

        {/* User Memo Section */}
        <MemoSection placeId={id} />

      </div>
    </div>
  );
}

export default function ShopDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1a0f0a]"></div>}>
            <ShopDetail />
        </Suspense>
    )
}
