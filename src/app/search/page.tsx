'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui/Components';
import { Header } from '@/components/ui/Header';
import { ThreeCanvas } from '@/components/canvas/Scene';
import { GoldParticles } from '@/components/canvas/Particles';

interface Shop {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  photos?: { name: string }[];
  types?: string[];
  aiAnalysis?: {
    score: number;
    short_summary: string;
    founding_year: string;
    tabelog_rating?: number;
  };
}

function SearchResults() {
  const searchParams = useSearchParams();
  const station = searchParams.get('station');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const genre = searchParams.get('genre');
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchStatus, setSearchStatus] = useState('老舗の歴史を紐解いています...');
  const [error, setError] = useState('');

  // Function to process JSON response
  const fetchSearch = async (url: string) => {
    setLoading(true);
    setError('');
    setShops([]);
    setSearchStatus('老舗を検索中...🐢');

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch shops');
        }
        
        const data = await response.json();
        
        if (data.shops) {
            setShops(data.shops);
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
            genre && `genre=${encodeURIComponent(genre)}`
        ].filter(Boolean).join('&');
        
        fetchSearch(`/api/search?${query}`);
    } else {
        setLoading(false);
    }
  }, [station, lat, lng, genre]);

  const handleResearch = () => {
    if (station || (lat && lng)) {
        const query = [
            station && `station=${encodeURIComponent(station)}`,
            lat && lng && `lat=${lat}&lng=${lng}`,
            genre && `genre=${encodeURIComponent(genre)}`,
            'force=true'
        ].filter(Boolean).join('&');
        
        fetchSearch(`/api/search?${query}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-[#FAFAFA] font-[family-name:var(--font-sans)] pb-20 relative">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none fixed">
        <ThreeCanvas>
          <GoldParticles />
        </ThreeCanvas>
      </div>

      <Header />

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

        {/* Loading Indicator (Top) - Shows status message */}
        {loading && (
          <div className="flex items-center space-x-3 mb-6 bg-[#D4AF37]/10 p-4 rounded-lg border border-[#D4AF37]/30 animate-pulse">
             <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-sm text-[#D4AF37]">{searchStatus}</p>
          </div>
        )}

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        {!loading && !error && shops.length === 0 && (
          <p className="text-center py-20 opacity-60">老舗が見つかりませんでした。</p>
        )}

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
            <Card key={shop.id} className="cursor-pointer group bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-[#D4AF37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]" onClick={() => router.push(`/shop/${shop.id}`)}>
                <div className="relative h-40 bg-black/50 overflow-hidden">
                    {/* Image */}
                    {shop.photos && shop.photos.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                            src={`/api/image?name=${shop.photos[0].name}&maxWidthPx=400`}
                            alt={shop.displayName.text}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#1a0f0a]">
                            No Image
                        </div>
                    )}
                    
                    {/* Score Badges */}
                    <div className="absolute top-2 right-2 flex gap-2">
                        {/* Gourmet Score (New) */}
                        {shop.aiAnalysis?.tabelog_rating && shop.aiAnalysis.tabelog_rating > 0 && (
                             <div className="bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-orange-500/50 shadow-lg">
                                <span className="text-[10px] font-bold block text-center text-orange-500">グルメ度</span>
                                <span className="text-xl font-bold text-white">
                                    {(shop.aiAnalysis.tabelog_rating * 30).toFixed(0)}
                                </span>
                            </div>
                        )}

                        {/* Shinise Score */}
                        <div className="bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-[#D4AF37]/50 shadow-lg">
                            <span className="text-[10px] font-bold block text-center text-[#D4AF37]">老舗度</span>
                            <span className="text-xl font-bold text-white">
                                {shop.aiAnalysis?.score ? shop.aiAnalysis.score : '-'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="p-5">
                    <h3 className="text-lg font-bold mb-1 text-white group-hover:text-[#D4AF37] transition-colors font-[family-name:var(--font-mincho)]">
                        {shop.displayName.text}
                    </h3>
                    {/* Founding Year */}
                    {shop.aiAnalysis?.founding_year && (
                        <p className="text-xs text-[#D4AF37] mb-2 font-semibold">
                            🏛️ 創業：{shop.aiAnalysis.founding_year}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 mb-4">{shop.formattedAddress}</p>
                    
                    {shop.aiAnalysis?.short_summary && shop.aiAnalysis.short_summary !== '-' && (
                        <div className="relative p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                            <span className="absolute -top-2 left-2 px-1 bg-[#1a0f0a] text-[10px] text-[#D4AF37] border border-[#D4AF37]/30 rounded">AI 解説</span>
                            <p className="text-xs italic text-gray-300 leading-relaxed">
                                "{shop.aiAnalysis.short_summary}"
                            </p>
                        </div>
                    )}
                </div>
            </Card>
            ))}
        </div>
      </div>
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
