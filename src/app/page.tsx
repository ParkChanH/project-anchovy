'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { calculateDDay, getTodayLabel } from '@/lib/utils';
import { GOALS } from '@/lib/constants';
import ProgressCard from '@/components/dashboard/ProgressCard';
import WorkoutCard from '@/components/dashboard/WorkoutCard';
import MealPlanCard from '@/components/dashboard/MealPlanCard';
import HistoryCalendar from '@/components/dashboard/HistoryCalendar';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading, isOffline } = useAuth();
  const dDay = calculateDDay();
  const todayLabel = getTodayLabel();

  // 인증 및 온보딩 체크
  useEffect(() => {
    if (!loading && !isOffline) {
      // 로그인하지 않은 사용자 → 로그인 페이지
      if (!user) {
        router.push('/login');
        return;
      }
      
      // 온보딩 미완료 사용자 → 온보딩 페이지
      if (profile && !profile.onboardingCompleted) {
        router.push('/onboarding');
        return;
      }
    }
  }, [loading, user, profile, isOffline, router]);

  // 로딩 화면
  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-dvh">
        <div className="text-4xl mb-4 animate-bounce">🐟</div>
        <p className="text-gray-400">로딩 중...</p>
      </main>
    );
  }

  // 현재 체중 (DB에서 가져오거나 기본값)
  const currentWeight = profile?.currentWeight ?? GOALS.startWeight;

  return (
    <main className="flex flex-col min-h-dvh safe-top safe-bottom">
      {/* 오프라인 알림 배너 */}
      {isOffline && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center">
          <p className="text-yellow-400 text-xs">
            ⚠️ 오프라인 모드 - 데이터가 저장되지 않습니다. 
            <span className="text-yellow-500 ml-1">Firebase 설정을 완료하세요.</span>
          </p>
        </div>
      )}

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* 헤더 */}
        <Header 
          dDay={dDay} 
          todayLabel={todayLabel} 
          isOffline={isOffline} 
          nickname={profile?.nickname}
          onProfileClick={() => router.push('/report')}
        />
        
        {/* 체중 진행률 카드 */}
        <div className="mb-4">
          <ProgressCard 
            currentWeight={currentWeight}
            targetWeight={profile?.targetWeight ?? GOALS.targetWeight}
            startWeight={profile?.startWeight ?? GOALS.startWeight}
          />
        </div>

        {/* 오늘의 식단 카드 */}
        <div className="mb-4">
          <MealPlanCard />
        </div>

        {/* 오늘의 운동 카드 */}
        <div className="mb-4">
          <WorkoutCard />
        </div>

        {/* 기록 캘린더 */}
        <div className="mb-8">
          <HistoryCalendar />
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </main>
  );
}

// 헤더 컴포넌트
function Header({ 
  dDay, 
  todayLabel, 
  isOffline,
  nickname,
  onProfileClick 
}: { 
  dDay: number; 
  todayLabel: string; 
  isOffline: boolean;
  nickname?: string;
  onProfileClick: () => void;
}) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex justify-between items-start pt-4 pb-5 animate-fade-in">
      <div>
        <p className="text-gray-500 text-sm mb-0.5">{formattedDate} {todayLabel}</p>
        <h1 className="text-xl font-extrabold">
          {nickname ? (
            <>
              <span className="text-white">안녕,</span>
              <span className="text-gradient neon-lime ml-1">{nickname}</span>
              <span className="text-white">! 💪</span>
            </>
          ) : (
            <>
              <span className="text-gradient neon-lime">Project</span>
              <span className="text-white ml-1.5">Anchovy</span>
            </>
          )}
        </h1>
        <p className="text-gray-500 text-xs mt-1 italic">
          "먹는 것까지가 운동이다"
        </p>
      </div>
      
      <div className="flex flex-col items-end gap-1.5">
        {/* D-Day 배지 (클릭하면 리포트로) */}
        <button onClick={onProfileClick} className="relative group">
          <div className="absolute inset-0 bg-[#C6FF00]/20 rounded-full blur-md group-hover:blur-lg transition-all" />
          <div className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-[#2E7D32]/30 to-[#1a472a]/30 border border-[#2E7D32]/50 group-hover:border-[#C6FF00]/50 transition-colors">
            <span className="text-[#C6FF00] font-black text-sm tracking-tight">D+{dDay}</span>
          </div>
        </button>
        
        {/* 상태 표시 */}
        <div className="flex items-center gap-1 text-[10px]">
          {isOffline ? (
            <span className="text-yellow-500">⚠️ 오프라인</span>
          ) : (
            <>
              <span className="text-gray-600">🐟</span>
              <span className="text-gray-600">→</span>
              <span className="text-gray-600 opacity-40">🐠</span>
              <span className="text-gray-600 opacity-20">🦈</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// 하단 네비게이션
function BottomNav() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)]/95 backdrop-blur-lg border-t border-gray-800 safe-bottom">
      <div className="flex justify-around items-center py-2">
        <button 
          className="flex flex-col items-center gap-1 px-6 py-2 text-[var(--primary)]"
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-medium">홈</span>
        </button>
        
        <button 
          onClick={() => router.push('/report')}
          className="flex flex-col items-center gap-1 px-6 py-2 text-gray-500 hover:text-white transition-colors"
        >
          <span className="text-xl">📊</span>
          <span className="text-[10px] font-medium">리포트</span>
        </button>
        
        <button 
          onClick={() => router.push('/onboarding')}
          className="flex flex-col items-center gap-1 px-6 py-2 text-gray-500 hover:text-white transition-colors"
        >
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] font-medium">설정</span>
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-6 py-2 text-gray-500 hover:text-red-400 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="text-[10px] font-medium">로그아웃</span>
        </button>
      </div>
    </nav>
  );
}
