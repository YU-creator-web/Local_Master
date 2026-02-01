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
      <div className="mt-4 p-4 rounded-lg bg-black/40 border border-[#D4AF37]/20 text-center">
        <p className="text-xs text-gray-400 mb-3">
          ログインするとメモを残せます
        </p>
        <button
          onClick={signInWithGoogle}
          className="px-4 py-1.5 bg-[#D4AF37] text-black text-xs font-bold rounded-full hover:bg-[#FDB931]"
        >
          Googleでログイン
        </button>
      </div>
  }

  return (
    <div className="mt-4 p-4 rounded-lg bg-black/40 border border-[#D4AF37]/30">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
           <span>📝</span> メモ (非公開)
        </h3>
        {lastSaved && (
           <span className="text-[10px] text-gray-500">
             {lastSaved.toLocaleTimeString()}
           </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-20 animate-pulse bg-gray-800/50 rounded-lg"></div>
      ) : (
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="メモを入力..."
          className="w-full h-24 bg-black/60 border border-[#D4AF37]/20 rounded p-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
        />
      )}

      <div className="flex justify-end mt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className={`px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1
            ${isSaving 
              ? 'bg-[#D4AF37]/50 text-black/50' 
              : 'bg-[#D4AF37] text-black hover:bg-[#FDB931]'
            }`}
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
