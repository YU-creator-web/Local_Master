'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui/Components';
import { Header } from '@/components/ui/Header';

interface Shop {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  photos?: { name: string }[];
  aiAnalysis?: {
    score: number;
    short_summary: string;
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
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      setError('');
      try {
        const query = [
            station && `station=${encodeURIComponent(station)}`,
            lat && lng && `lat=${lat}&lng=${lng}`,
            genre && `genre=${encodeURIComponent(genre)}`
        ].filter(Boolean).join('&');
          
        const res = await fetch(`/api/search?${query}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setShops((data.shops as Shop[]) || []);
      } catch (err) {
        setError('店舗の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    if (station || (lat && lng)) {
      fetchShops();
    }
  }, [station, lat, lng, genre]);

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-[#FAFAFA] font-[family-name:var(--font-sans)] pb-20">
      <Header />

      <div className="max-w-md mx-auto p-4">
        <h2 className="text-xl mb-6 font-bold border-b border-[#D4AF37] inline-block pb-2 font-[family-name:var(--font-mincho)] text-white drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
          {station ? `${station} ` : '現在地'} 
          {genre ? `× ${genre}` : ''} 周辺の候補
        </h2>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
             <p className="animate-pulse text-sm text-[#D4AF37]">老舗の歴史を紐解いています...</p>
          </div>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && shops.length === 0 && (
          <p className="text-center py-20 opacity-60">老舗が見つかりませんでした。</p>
        )}

        <div className="space-y-6">
            {!loading && shops.map((shop) => (
            <Card key={shop.id} className="cursor-pointer group bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-[#D4AF37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]" onClick={() => router.push(`/shop/${shop.id}`)}>
                <div className="relative h-40 bg-black/50 overflow-hidden">
                    {/* Image Placeholder or Photo */}
                    {shop.photos && shop.photos.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                            src={`https://places.googleapis.com/v1/${shop.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`}
                            alt={shop.displayName.text}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#1a0f0a]">
                            No Image
                        </div>
                    )}
                    
                    {/* Score Badge */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-[#D4AF37]/50 shadow-lg">
                        <span className="text-[10px] font-bold block text-center text-[#D4AF37]">老舗度</span>
                        <span className="text-xl font-bold text-white">
                            {shop.aiAnalysis?.score ? shop.aiAnalysis.score : '-'}
                        </span>
                    </div>
                </div>
                
                <div className="p-5">
                    <h3 className="text-lg font-bold mb-1 text-white group-hover:text-[#D4AF37] transition-colors font-[family-name:var(--font-mincho)]">
                        {shop.displayName.text}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">{shop.formattedAddress}</p>
                    
                    {shop.aiAnalysis?.short_summary && shop.aiAnalysis.short_summary !== '-' && (
                        <div className="relative p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                            <span className="absolute -top-2 left-2 px-1 bg-[#1a0f0a] text-[10px] text-[#D4AF37] border border-[#D4AF37]/30 rounded">AI 解説</span>
                            <p className="text-xs italic text-gray-300 leading-relaxed">
                                “{shop.aiAnalysis.short_summary}”
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
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
