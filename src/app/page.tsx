'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThreeCanvas } from '@/components/canvas/Scene';
import { GoldParticles } from '@/components/canvas/Particles';
import { Button, Input } from '@/components/ui/Components';

export default function Home() {
  const router = useRouter();
  const [station, setStation] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    '/bg-eel.png',
    '/bg-wagashi.png',
    '/bg-sushi.png',
    '/bg-teishoku.png',
    '/bg-souzai.png'
  ];

  // Background Slider Effect
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (station.trim()) {
      const query = new URLSearchParams({
        station: station.trim(),
        ...(genre.trim() && { genre: genre.trim() })
      }).toString();
      router.push(`/search?${query}`);
    }
  };

  const handleNearbySearch = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          router.push(`/search?lat=${latitude}&lng=${longitude}&genre=${encodeURIComponent(genre)}`);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("現在地を取得できませんでした。");
          setLoading(false);
        }
      );
    } else {
      alert("お使いのブラウザは現在地情報をサポートしていません。");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1a0f0a] text-[#FAFAFA] font-[family-name:var(--font-sans)]">
      
      {/* Background Image Slider */}
      {images.map((img, index) => (
        <div 
          key={img}
          className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      <div className="absolute inset-0 z-0 bg-black/40"></div> {/* Lighter Overlay for better visibility */}

      {/* 3D Background - Gold Dust */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <ThreeCanvas>
          <GoldParticles />
        </ThreeCanvas>
      </div>

      {/* Hero Content */}
      <main className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center gap-10">
        
        {/* Title Section */}
        <div className="flex flex-col items-center text-center drop-shadow-md">
            <h1 className="text-5xl md:text-7xl font-bold tracking-[0.2em] font-[family-name:var(--font-mincho)] text-white drop-shadow-lg">
            老舗
            </h1>
            <p className="mt-4 text-xs md:text-sm tracking-[0.5em] uppercase opacity-90 text-[#F0E68C] font-bold font-[family-name:var(--font-sans)]">
                Shinise Master
            </p>
        </div>

        {/* Glassmorphism Card - High Contrast */}
        <div className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-8 shadow-2xl">
          <p className="text-center text-sm mb-6 text-white font-medium leading-loose font-[family-name:var(--font-mincho)] drop-shadow-sm">
            百年の刻を超えて愛される店。<br/>
            その物語を、今のあなたへ。
          </p>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-5">
                <div className="relative group">
                    <label className="text-xs text-[#D4AF37] font-bold mb-1 block pl-2">探したい場所</label>
                    <Input 
                        placeholder="例: 京都、浅草" 
                        value={station}
                        onChange={(e) => setStation(e.target.value)}
                        className="bg-white/90 border-transparent text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/50 transition-all duration-300 rounded-lg py-3 font-bold shadow-inner"
                    />
                </div>

                <div className="relative group">
                    <label className="text-xs text-[#D4AF37] font-bold mb-1 block pl-2">ジャンル (任意)</label>
                    <Input 
                        placeholder="例: 鰻、寿司" 
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="bg-white/90 border-transparent text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/50 transition-all duration-300 rounded-lg py-3 font-bold shadow-inner"
                    />
                </div>
            </div>
            
            <Button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#EDCC53] hover:to-[#D4AF37] text-black font-bold tracking-widest rounded-lg transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] transform hover:-translate-y-0.5"
            >
              探求する
            </Button>
          </form>

          <div className="mt-6 text-center">
              <button 
                onClick={handleNearbySearch}
                disabled={loading}
                className="text-xs font-bold text-white/90 hover:text-[#D4AF37] tracking-wider border-b border-white/30 hover:border-[#D4AF37] transition-all pb-1 flex items-center justify-center gap-2 mx-auto"
              >
                {loading ? (
                    <span className="animate-pulse">現在地から探索中...</span>
                ) : (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        現在地から紐解く
                    </>
                )}
              </button>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-4 text-[10px] tracking-widest text-white/60 drop-shadow-md">
        © 2025 SINISE MASTER
      </footer>
    </div>
  );
}
