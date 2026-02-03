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
  const [mode, setMode] = useState<'standard' | 'adventure'>('standard');
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
        ...(genre.trim() && { genre: genre.trim() }),
        mode
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
          router.push(`/search?lat=${latitude}&lng=${longitude}&genre=${encodeURIComponent(genre)}&mode=${mode}`);
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

      {/* Hero Content - Split Layout for Desktop */}
      <main className="relative z-10 w-full max-w-7xl px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-0 min-h-screen md:h-screen py-20 md:py-0">
        
        {/* Left Side: Title & Narrative */}
        <div className="flex flex-col items-center md:items-start space-y-8 md:w-1/2">
            <div className="flex flex-row items-start gap-6">
                <div className="hidden md:block h-32 w-[1px] bg-gradient-to-b from-white/0 via-[#D4AF37] to-white/0"></div>
                
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                        <span className="text-[10px] tracking-[0.3em] text-white/80 font-medium">AI AGENT × LOCAL GEMS</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-medium tracking-[0.1em] font-[family-name:var(--font-mincho)] text-white leading-tight">
                        <span className="block text-4xl md:text-5xl mb-2 opacity-90">地元に</span>
                        <span className="block text-4xl md:text-5xl mb-2 opacity-90">愛される店を</span>
                        <span className="block text-[#F0E68C] blur-[1px] hover:blur-none transition-all duration-700">巡る旅</span>
                    </h1>

                    <p className="hidden md:block text-sm text-white/60 font-[family-name:var(--font-mincho)] leading-loose tracking-widest pl-1">
                        路地の奥、看板の明かりが呼んでいる。<br/>
                        AIと切り拓く、未体験のローカル。
                    </p>
                </div>
            </div>
        </div>

        {/* Right Side: Interactive "Ticket" Card */}
        <div className="w-full md:w-[450px] perspective-1000">
            <div className="relative bg-black/60 backdrop-blur-md border-[0.5px] border-white/20 rounded-2xl p-10 shadow-2xl transform transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.2)] group">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/20 blur-[60px] rounded-full pointer-events-none opacity-50"></div>
                
                {/* Vertical Text Decoration */}
                <div className="absolute right-6 top-10 hidden md:block opacity-30">
                     <p className="writing-vertical-rl text-[10px] tracking-[0.4em] text-white font-serif border-l border-white/30 pl-2">JOURNEY STARTS HERE</p>
                </div>

                <div className="relative z-10 space-y-10">
                    <div className="space-y-3">
                        <h2 className="text-2xl text-white font-[family-name:var(--font-mincho)] tracking-widest flex items-center gap-4">
                            <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]"></span>
                            旅の支度
                        </h2>
                        <p className="text-[10px] text-white/50 font-light tracking-[0.2em] pl-16 uppercase">Design your night</p>
                    </div>

                    <div className="flex items-center justify-center gap-6 pb-2">
                        <button 
                            type="button"
                            onClick={() => setMode('standard')}
                            className={`relative px-2 py-1 transition-all duration-300 ${mode === 'standard' ? 'text-[#D4AF37]' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <span className="text-xs tracking-[0.2em] font-medium">定番</span>
                            <span className="text-[9px] block text-center opacity-60 tracking-tighter">STANDARD</span>
                            {mode === 'standard' && <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"></span>}
                        </button>
                        <div className="w-[1px] h-4 bg-white/10"></div>
                        <button 
                            type="button"
                            onClick={() => setMode('adventure')}
                            className={`relative px-2 py-1 transition-all duration-300 ${mode === 'adventure' ? 'text-[#D4AF37]' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <span className="text-xs tracking-[0.2em] font-medium">冒険</span>
                            <span className="text-[9px] block text-center opacity-60 tracking-tighter">ADVENTURE</span>
                            {mode === 'adventure' && <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"></span>}
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-8 pl-4 pr-8">
                        <div className="space-y-8">
                            <div className="group relative">
                                <label className="text-[9px] text-[#D4AF37] tracking-[0.2em] uppercase mb-1 block opacity-80 group-focus-within:opacity-100 transition-opacity">Area</label>
                                <Input 
                                    placeholder="エリア (例: 高円寺)" 
                                    value={station}
                                    onChange={(e) => setStation(e.target.value)}
                                    className="bg-transparent border-b border-white/20 text-white placeholder:text-white/20 focus:bg-transparent focus:border-[#D4AF37] focus:ring-0 focus:outline-none transition-all duration-300 rounded-none px-0 py-2 text-base font-normal tracking-wider"
                                />
                            </div>

                            <div className="group relative">
                                <label className="text-[9px] text-[#D4AF37] tracking-[0.2em] uppercase mb-1 block opacity-80 group-focus-within:opacity-100 transition-opacity">Genre</label>
                                <Input 
                                    placeholder="ジャンル (例: やきとり)" 
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="bg-transparent border-b border-white/20 text-white placeholder:text-white/20 focus:bg-transparent focus:border-[#D4AF37] focus:ring-0 focus:outline-none transition-all duration-300 rounded-none px-0 py-2 text-base font-normal tracking-wider"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-6">
                            <Button 
                                type="submit" 
                                className="w-full py-4 bg-white/5 hover:bg-[#D4AF37] text-white border border-white/20 hover:border-[#D4AF37] hover:text-[#1a0f0a] font-medium tracking-[0.4em] rounded-sm transition-all duration-500 flex items-center justify-center gap-4 group/btn"
                            >
                                START
                            </Button>
                        </div>
                    </form>

                    <div className="pt-2 text-center border-t border-white/5">
                        <button 
                            onClick={handleNearbySearch}
                            disabled={loading}
                            className="w-full py-4 text-xs tracking-widest text-white/40 hover:text-white transition-colors duration-300 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <span className="animate-pulse">LOCATING...</span>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    USE CURRENT LOCATION
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <footer className="absolute bottom-4 text-[10px] tracking-widest text-white/60 drop-shadow-md">
        © 2026 LOCAL MASTER
      </footer>
    </div>
  );
}
