'use client';

import { useRouter } from 'next/navigation';
import { useCourse } from '@/context/CourseContext';
import { Header } from '@/components/ui/Header';
import { Button, Card } from '@/components/ui/Components';
import { ThreeCanvas } from '@/components/canvas/Scene';
import { GoldParticles } from '@/components/canvas/Particles';
import { CourseMap } from '@/components/map/CourseMap';

export default function CoursePage() {
  const router = useRouter();
  const { courseItems, removeFromCourse } = useCourse();

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-[#FAFAFA] font-[family-name:var(--font-sans)] pb-20 relative">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none fixed">
        <ThreeCanvas>
          <GoldParticles />
        </ThreeCanvas>
      </div>

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-mincho)] text-white drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                私の飲み歩きコース🍶
            </h1>
            <Button 
                variant="outline" 
                onClick={() => {
                   const lastSearch = localStorage.getItem('lastSearchUrl');
                   if (lastSearch) {
                      router.push(lastSearch);
                   } else {
                      router.push('/');
                   }
                }} 
                className="text-xs text-white border-white/30 hover:bg-white/10"
            >
                検索結果に戻る
            </Button>
        </div>

        {courseItems.length > 0 && (
            <div className="mb-12 bg-white/5 border border-[#D4AF37]/30 p-1 rounded-xl backdrop-blur-md animate-fade-in h-[400px] w-full">
                <CourseMap shops={courseItems} />
            </div>
        )}

        {courseItems.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <p className="text-gray-400 mb-4">飲み歩きコースに登録された店舗はありません。</p>
            <Button onClick={() => router.push('/')} className="bg-[#D4AF37] text-black font-bold">
                老舗を探しに行く
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4">
              {courseItems.map((shop, index) => (
                <Card key={shop.id} className="flex flex-row items-center p-4 bg-white/10 border border-white/10 backdrop-blur-sm">
                   <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#D4AF37] text-black font-bold mr-4 shrink-0">
                      {index + 1}
                   </div>
                   <div className="flex-1 min-w-0 mr-4">
                      <h3 className="text-lg font-bold text-white truncate">{shop.displayName.text}</h3>
                      <p className="text-xs text-gray-400 truncate mb-1">{shop.formattedAddress}</p>
                   </div>
                   
                   <div className="flex items-center gap-2 shrink-0">
                       <a 
                            href={`https://tabelog.com/rstLst/?vs=1&sw=${encodeURIComponent(shop.aiAnalysis?.tabelog_name || shop.displayName.text)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] md:text-xs bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 text-[#D4AF37] border border-[#D4AF37]/50 px-3 py-2 rounded-full transition-colors font-bold"
                        >
                            <span>食べログ</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                       <Button 
                         variant="ghost" 
                         onClick={() => removeFromCourse(shop.id)}
                         className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
                       >
                         削除
                       </Button>
                   </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
