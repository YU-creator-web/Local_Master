'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from './Components';

export const Header = () => {
  const router = useRouter();
  const { user, signInWithGoogle, logout } = useAuth();

  return (
    <header className="flex justify-between items-center p-4 bg-[#1a0f0a]/80 backdrop-blur-md border-b border-[#D4AF37]/30 sticky top-0 z-50">
      <h1 
        className="text-xl font-bold font-[family-name:var(--font-mincho)] cursor-pointer text-white drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] bg-clip-text text-transparent bg-gradient-to-r from-white to-[#D4AF37]" 
        onClick={() => router.push('/')}
      >
        老舗 Master
      </h1>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img 
               src={user.photoURL || ''} 
               alt={user.displayName || 'User'} 
               className="w-8 h-8 rounded-full border border-[#D4AF37]/50"
             />
             <Button 
                variant="outline" 
                onClick={logout} 
                className="text-xs px-3 py-1 bg-transparent border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
               ログアウト
             </Button>
          </div>
        ) : (
          <Button 
            variant="primary" 
            onClick={signInWithGoogle} 
            className="text-sm px-4 py-1 bg-[#D4AF37] text-[#1a0f0a] font-bold hover:bg-[#FDB931] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
          >
            ログイン
          </Button>
        )}
      </div>
    </header>
  );
};
