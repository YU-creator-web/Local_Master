'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui/Components';
import { Header } from '@/components/ui/Header';
import { useAuth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function ShopDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [shop, setShop] = useState<any>(null);
  const [aiGuide, setAiGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Memo State
  const [memo, setMemo] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoStatus, setMemoStatus] = useState('');

  // Fetch Memo if user exists
  useEffect(() => {
    const fetchMemo = async () => {
      if (!user || !id) return;
      try {
        const memoRef = doc(db, 'memos', user.uid, 'shops', id);
        const memoSnap = await getDoc(memoRef);
        if (memoSnap.exists()) {
          setMemo(memoSnap.data().text || '');
        }
      } catch (e) {
        console.error("Memo fetch error", e);
      }
    };
    fetchMemo();
  }, [user, id]);

  const handleSaveMemo = async () => {
    if (!user || !id) return;
    setMemoSaving(true);
    try {
      const memoRef = doc(db, 'memos', user.uid, 'shops', id);
      await setDoc(memoRef, {
        text: memo,
        updatedAt: new Date(),
        shopName: shop?.displayName?.text || '',
      });
      setMemoStatus('保存しました！');
      setTimeout(() => setMemoStatus(''), 2000);
    } catch (e) {
      console.error("Memo save error", e);
      setMemoStatus('保存に失敗しました');
    } finally {
      setMemoSaving(false);
    }
  };

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
      <div className="min-h-screen bg-[var(--color-shinise-paper)] flex items-center justify-center flex-col">
        <div className="w-16 h-16 border-4 border-[var(--color-shinise-brown)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-[family-name:var(--font-mincho)] animate-pulse">老舗の物語を紡いでいます...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col p-4 bg-[var(--color-shinise-paper)]">
        <p className="text-red-500 mb-4">{error || 'Shop not found'}</p>
        <Button onClick={() => router.push('/')}>トップへ戻る</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-[#FAFAFA] font-[family-name:var(--font-sans)] pb-20">
      
      {/* Hero Image */}
      <div className="w-full h-[45vh] bg-black relative overflow-hidden group">
        {shop.photos && shop.photos.length > 0 ? (
           /* eslint-disable-next-line @next/next/no-img-element */
           <img 
             src={`https://places.googleapis.com/v1/${shop.photos[0].name}/media?maxHeightPx=800&maxWidthPx=800&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`}
             alt={shop.displayName.text}
             className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2000ms]"
           />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a0f0a] text-gray-600">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0a] via-[#1a0f0a]/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 w-full z-10">
            <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="mb-4 text-xs border-white/30 text-white/70 hover:bg-white/10 hover:text-white"
            >
                ← 戻る
            </Button>
            <h1 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-mincho)] mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#F0E68C] drop-shadow-lg">
                {shop.displayName.text}
            </h1>
            <p className="text-sm md:text-base opacity-80 text-gray-300 font-light tracking-wide">{shop.formattedAddress}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-12 relative z-20 space-y-10">
        
        {/* AI Guide Section */}
        {aiGuide && (
            <Card className="p-8 bg-[#1a0f0a]/80 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
                
                <div className="flex items-center mb-8 border-b border-white/10 pb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7326] flex items-center justify-center text-[#1a0f0a] font-bold mr-4 shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        AI
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-[family-name:var(--font-mincho)] text-white">老舗鑑定士の「ここが推し」</h2>
                        <p className="text-xs text-[#D4AF37] opacity-80 tracking-widest">Provided by Gemini 3.0 Pro</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h3 className="flex items-center text-[#D4AF37] font-bold mb-3 text-lg tracking-wide">
                             <span className="mr-2 opacity-50">◇</span> 物語・歴史
                        </h3>
                        <p className="text-sm leading-8 text-gray-300 tracking-wide font-light">{aiGuide.history_background}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                             <h3 className="font-bold text-[#FDB931] mb-3 text-sm">★ おすすめポイント</h3>
                             <p className="text-sm text-gray-300 leading-relaxed">{aiGuide.recommended_points}</p>
                        </div>
                         <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                             <h3 className="font-bold text-[#D4AF37] mb-3 text-sm">♨ 雰囲気・時間帯</h3>
                             <p className="text-sm text-gray-300 leading-relaxed">{aiGuide.atmosphere}<br/><span className="text-xs text-gray-500 mt-2 block">({aiGuide.best_time_to_visit})</span></p>
                        </div>
                    </div>
                </div>
            </Card>
        )}
        
        {/* Map Section */}
        <section className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-6 font-[family-name:var(--font-mincho)] border-l-4 border-[#D4AF37] pl-4 text-white">
                場所・アクセス
            </h2>
            <div className="w-full h-64 rounded-xl overflow-hidden shadow-lg border border-white/10 grayscale hover:grayscale-0 transition-all duration-500">
                <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${id}`}
                ></iframe>
            </div>
            <div className="mt-6 flex gap-4">
                 <a 
                    href={shop.googleMapsUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-white/10 border border-white/20 text-center py-4 rounded-xl hover:bg-[#D4AF37] hover:text-black hover:border-transparent transition-all text-sm font-bold text-white tracking-wider"
                 >
                    Google Maps で見る
                 </a>
            </div>
        </section>

      </div>
    </div>
  );
}

export default function ShopDetailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ShopDetail />
        </Suspense>
    )
}
