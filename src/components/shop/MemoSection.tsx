'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function MemoSection({ placeId }: { placeId: string }) {
  const { user, signInWithGoogle } = useAuth();
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!user || !placeId) {
        setIsLoading(false);
        return;
    }

    const loadMemo = async () => {
      try {
        const memoRef = doc(db, 'memos', `${user.uid}_${placeId}`);
        const snap = await getDoc(memoRef);
        if (snap.exists()) {
          setMemo(snap.data().text || '');
          if (snap.data().updatedAt) {
            setLastSaved(snap.data().updatedAt.toDate());
          }
        }
      } catch (err) {
        console.error("Failed to load memo:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMemo();
  }, [user, placeId]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const memoRef = doc(db, 'memos', `${user.uid}_${placeId}`);
      await setDoc(memoRef, {
        userId: user.uid,
        placeId: placeId,
        text: memo,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save memo:", err);
      alert("保存に失敗しました...");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="mt-8 p-6 rounded-xl bg-[#1a0f0a]/40 border border-[#D4AF37]/20 backdrop-blur-sm text-center">
        <h3 className="text-lg font-serif text-[#D4AF37] mb-2">
           旅の思い出を記録しませんか？
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          ログインすると、このお店についての自分だけのメモを残せます。<br/>
          (誰にも公開されません 🤫)
        </p>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-2 bg-[#D4AF37] text-[#1a0f0a] font-bold rounded-full hover:bg-[#FDB931] transition-colors shadow-lg"
        >
          Googleでログインしてメモを書く
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 rounded-xl bg-[#1a0f0a]/60 border border-[#D4AF37]/30 backdrop-blur-sm">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-xl font-serif text-[#D4AF37] drop-shadow-md">
           📝 旅のメモ
        </h3>
        {lastSaved && (
           <span className="text-xs text-gray-500">
             最終保存: {lastSaved.toLocaleTimeString()}
           </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse bg-gray-800/50 rounded-lg"></div>
      ) : (
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="味の感想、頼んだメニュー、店主との会話などを記録しよう..."
          className="w-full h-32 bg-black/40 border border-[#D4AF37]/20 rounded-lg p-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all resize-none"
        />
      )}

      <div className="flex justify-end mt-3">
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className={`px-6 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2
            ${isSaving 
              ? 'bg-[#D4AF37]/50 text-[#1a0f0a]/50 cursor-wait' 
              : 'bg-[#D4AF37] text-[#1a0f0a] hover:bg-[#FDB931] hover:scale-105 active:scale-95'
            }`}
        >
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}
