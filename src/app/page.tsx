'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { calculateDDay, getTodayLabel } from '@/lib/utils';
import { GOALS } from '@/lib/constants';
import ProgressCard from '@/components/dashboard/ProgressCard';
import WorkoutCard from '@/components/dashboard/WorkoutCard';
import MealPlanCard from '@/components/dashboard/MealPlanCard';
import HistoryCalendar from '@/components/dashboard/HistoryCalendar';
import AITrainerChat from '@/components/ai/AITrainerChat';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading, isOffline } = useAuth();
  const dDay = calculateDDay();
  const todayLabel = getTodayLabel();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 인증 및 온보딩 체크
  useEffect(() => {
    if (!loading && !isOffline) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (profile && !profile.onboardingCompleted) {
        router.push('/onboarding');
        return;
      }
    }
  }, [loading, user, profile, isOffline, router]);

  // 로딩 화면
  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-dvh bg-[#0a0a0a]">
        <motion.div 
          className="text-6xl mb-4"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🐟
        </motion.div>
        <motion.p 
          className="text-gray-400 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          로딩 중...
        </motion.p>
      </main>
    );
  }

  const currentWeight = profile?.currentWeight ?? GOALS.startWeight;

  return (
    <main className="flex flex-col min-h-dvh bg-[#0a0a0a] safe-top safe-bottom">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#C6FF00]/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* 오프라인 알림 배너 */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-500/30 px-4 py-3"
          >
            <p className="text-yellow-400 text-sm text-center font-medium">
              ⚠️ 오프라인 모드 - 데이터가 저장되지 않습니다
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 relative z-10">
        {/* 헤더 */}
        <Header 
          dDay={dDay} 
          todayLabel={todayLabel} 
          isOffline={isOffline} 
          nickname={profile?.nickname}
          onProfileClick={() => router.push('/report')}
        />
        
        {/* 체중 진행률 카드 */}
        <div className="mb-5">
          <ProgressCard 
            currentWeight={currentWeight}
            targetWeight={profile?.targetWeight ?? GOALS.targetWeight}
            startWeight={profile?.startWeight ?? GOALS.startWeight}
          />
        </div>

        {/* 오늘의 식단 카드 */}
        <div className="mb-5">
          <MealPlanCard />
        </div>

        {/* 오늘의 운동 카드 */}
        <div className="mb-5">
          <WorkoutCard />
        </div>

        {/* 기록 캘린더 */}
        <div className="mb-8">
          <HistoryCalendar />
        </div>
      </div>

      {/* 하단 네비게이션 with AI 버튼 */}
      <BottomNav onAIClick={() => setIsChatOpen(true)} />

      {/* AI 트레이너 챗봇 */}
      <AITrainerChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
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
    <motion.header 
      className="flex justify-between items-start pt-6 pb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <motion.p 
          className="text-gray-500 text-sm mb-1 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {formattedDate} {todayLabel}
        </motion.p>
        <motion.h1 
          className="text-2xl font-black"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {nickname ? (
            <>
              <span className="text-white">안녕,</span>
              <span className="bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] bg-clip-text text-transparent ml-1">{nickname}</span>
              <span className="text-white ml-1">! 💪</span>
            </>
          ) : (
            <>
              <span className="bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] bg-clip-text text-transparent">Project</span>
              <span className="text-white ml-2">Anchovy</span>
            </>
          )}
        </motion.h1>
        <motion.p 
          className="text-gray-600 text-xs mt-1.5 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          &ldquo;먹는 것까지가 운동이다&rdquo;
        </motion.p>
      </div>
      
      <motion.div 
        className="flex flex-col items-end gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* D-Day 배지 */}
        <motion.button 
          onClick={onProfileClick} 
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-[#C6FF00]/30 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
          <div className="relative px-4 py-2 rounded-2xl bg-gradient-to-r from-[#2E7D32]/40 to-[#1a472a]/40 border border-[#2E7D32]/50 group-hover:border-[#C6FF00]/70 transition-colors backdrop-blur">
            <span className="text-[#C6FF00] font-black text-lg tracking-tight">D+{dDay}</span>
          </div>
        </motion.button>
        
        {/* 상태 표시 */}
        <div className="flex items-center gap-1.5 text-sm">
          {isOffline ? (
            <span className="text-yellow-500 font-medium">⚠️ 오프라인</span>
          ) : (
            <motion.div 
              className="flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span>🐟</span>
              <span className="text-gray-600">→</span>
              <span className="opacity-50">🐠</span>
              <span className="opacity-25">🦈</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.header>
  );
}

// 하단 네비게이션
function BottomNav({ onAIClick }: { onAIClick: () => void }) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const leftItems = [
    { icon: '🏠', label: '홈', active: true, onClick: () => router.push('/') },
    { icon: '📊', label: '리포트', active: false, onClick: () => router.push('/report') },
  ];

  const rightItems = [
    { icon: '⚙️', label: '설정', active: false, onClick: () => router.push('/onboarding') },
    { icon: '🚪', label: '나가기', active: false, onClick: handleLogout, danger: true },
  ];

  const NavButton = ({ item }: { item: { icon: string; label: string; active: boolean; onClick: () => void; danger?: boolean } }) => (
    <motion.button 
      onClick={item.onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
        ${item.active 
          ? 'text-[#C6FF00] bg-[#C6FF00]/10' 
          : item.danger 
            ? 'text-gray-500 hover:text-red-400' 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <span className="text-lg">{item.icon}</span>
      <span className="text-[10px] font-semibold">{item.label}</span>
    </motion.button>
  );

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 safe-bottom z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative flex justify-between items-center py-2 px-4">
        {/* 왼쪽 메뉴 */}
        <div className="flex gap-1">
          {leftItems.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </div>

        {/* 중앙 AI 버튼 */}
        <motion.button
          onClick={onAIClick}
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#C6FF00] to-[#9EF01A] flex items-center justify-center shadow-lg shadow-[#C6FF00]/40 border-4 border-[#0a0a0a]"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span 
            className="text-2xl"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            🤖
          </motion.span>
        </motion.button>

        {/* 오른쪽 메뉴 */}
        <div className="flex gap-1">
          {rightItems.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
