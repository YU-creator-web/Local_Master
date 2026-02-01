'use client';

import { useEffect, useState } from 'react';
import { ThreeCanvas } from '@/components/canvas/Scene';
import { GoldParticles } from '@/components/canvas/Particles';

interface CountdownOverlayProps {
  onComplete?: () => void;
  isLoading: boolean; // Control visibility/state
}

export function CountdownOverlay({ onComplete, isLoading }: CountdownOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isLoading) {
       // Reset on start
       setTimeLeft(180);
       setIsVisible(true);
    } else {
       // If loading finishes early, fade out
       const timer = setTimeout(() => setIsVisible(false), 500);
       return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  // Format time mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (!isVisible && !isLoading) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a0f0a] transition-opacity duration-1000 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Background Particles */}
      <div className="absolute inset-0 opacity-40">
        <ThreeCanvas>
          <GoldParticles />
        </ThreeCanvas>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-[#D4AF37] font-[family-name:var(--font-mincho)] text-2xl mb-8 tracking-[0.5em] animate-pulse">
            老舗の歴史を紐解いています
        </h2>

        {/* Timer Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center">
           {/* Rotating Outer Ring */}
           <div className="absolute inset-0 border-4 border-[#D4AF37]/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
           <div className="absolute inset-0 border-t-4 border-[#D4AF37] rounded-full animate-[spin_3s_linear_infinite]"></div>
           
           {/* Time Display */}
           <div className="flex flex-col items-center justify-center z-10 bg-black/50 backdrop-blur-sm w-56 h-56 rounded-full border border-[#D4AF37]/20 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                <span className="text-7xl font-bold text-white font-[family-name:var(--font-sans)] tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                    {formattedTime}
                </span>
                <span className="text-xs text-[#D4AF37] mt-2 uppercase tracking-widest">Estimated Time</span>
           </div>
        </div>

        <p className="mt-12 text-white/60 text-sm font-[family-name:var(--font-mincho)] tracking-widest text-center leading-loose">
            百年の刻を超える物語。<br/>
            少々お時間を頂戴いたします。
        </p>
      </div>
    </div>
  );
}
