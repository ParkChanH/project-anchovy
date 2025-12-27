'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getWeeklyStats, WeeklyStats } from '@/lib/firebase/firestore';

export default function ReportPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        const weeklyStats = await getWeeklyStats(user.uid);
        setStats(weeklyStats);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (!loading && user) {
      fetchStats();
    }
  }, [user, loading]);

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="text-6xl mb-4"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📊
          </motion.div>
          <p className="text-gray-400 font-medium">분석 중...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const getRecommendations = (): string[] => {
    if (!stats || !profile) return [];
    
    const recommendations: string[] = [];
    
    if (stats.completionRate < 50) {
      recommendations.push('💪 운동 횟수를 조금씩 늘려보세요. 꾸준함이 중요합니다!');
    } else if (stats.completionRate >= 80) {
      recommendations.push('🔥 훌륭해요! 이대로 유지하면 목표 달성은 시간문제입니다!');
    }
    
    if (stats.avgDietScore < 3) {
      recommendations.push('🍽️ 끼니를 거르지 마세요. 특히 간식과 보충제가 중요합니다.');
    } else if (stats.avgDietScore >= 4) {
      recommendations.push('🥗 식단 관리가 훌륭합니다! 근성장의 70%는 식단입니다.');
    }
    
    if (profile.goalType === 'bulk') {
      if (stats.weightChange > 0.5) {
        recommendations.push('⚖️ 체중이 빠르게 증가하고 있어요. 지방 증가에 주의하세요.');
      } else if (stats.weightChange < 0) {
        recommendations.push('📈 칼로리 섭취를 더 늘려보세요. 목표는 주 0.3~0.5kg 증가입니다.');
      } else {
        recommendations.push('✨ 이상적인 속도로 체중이 증가하고 있어요!');
      }
    } else if (profile.goalType === 'cut') {
      if (stats.weightChange < -1) {
        recommendations.push('⚠️ 체중이 너무 빨리 빠지고 있어요. 근손실에 주의하세요.');
      } else if (stats.weightChange > 0) {
        recommendations.push('📉 칼로리 섭취를 조금 줄이거나 활동량을 늘려보세요.');
      }
    }
    
    if (stats.totalWorkouts === 0) {
      recommendations.push('🏋️ 이번 주는 운동을 시작해보세요. 가볍게 시작해도 좋아요!');
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  const calculateScore = (): number => {
    if (!stats) return 0;
    
    const workoutScore = (stats.completionRate / 100) * 40;
    const dietScore = (stats.avgDietScore / 5) * 40;
    const consistencyScore = stats.logs.length >= 5 ? 20 : (stats.logs.length / 5) * 20;
    
    return Math.round(workoutScore + dietScore + consistencyScore);
  };

  const score = calculateScore();

  const getScoreGrade = (score: number): { label: string; emoji: string; color: string; bgGradient: string } => {
    if (score >= 90) return { label: 'S', emoji: '🏆', color: '#FFD700', bgGradient: 'from-yellow-500/20 to-orange-500/20' };
    if (score >= 80) return { label: 'A', emoji: '🌟', color: '#C6FF00', bgGradient: 'from-[#C6FF00]/20 to-green-500/20' };
    if (score >= 70) return { label: 'B', emoji: '💪', color: '#22c55e', bgGradient: 'from-green-500/20 to-emerald-500/20' };
    if (score >= 60) return { label: 'C', emoji: '👍', color: '#eab308', bgGradient: 'from-yellow-500/20 to-amber-500/20' };
    if (score >= 50) return { label: 'D', emoji: '🔄', color: '#f97316', bgGradient: 'from-orange-500/20 to-red-500/20' };
    return { label: 'F', emoji: '💥', color: '#ef4444', bgGradient: 'from-red-500/20 to-rose-500/20' };
  };

  const grade = getScoreGrade(score);

  const statCards = [
    {
      emoji: '🏋️',
      label: '운동 횟수',
      value: stats?.totalWorkouts || 0,
      subValue: `/${profile?.workoutDaysPerWeek || 5}회`,
      extra: `달성률 ${stats?.completionRate.toFixed(0) || 0}%`,
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      emoji: '🍽️',
      label: '총 식사',
      value: stats?.totalMeals || 0,
      subValue: '끼',
      extra: `평균 ${stats?.avgDietScore.toFixed(1) || 0}/5점`,
      color: 'from-orange-500/20 to-amber-500/20'
    },
    {
      emoji: '⚖️',
      label: '체중 변화',
      value: stats?.weightChange ? (stats.weightChange > 0 ? '+' : '') + stats.weightChange.toFixed(1) : '0',
      subValue: 'kg',
      extra: '이번 주 기록 기준',
      color: 'from-blue-500/20 to-cyan-500/20',
      valueColor: stats?.weightChange && stats.weightChange > 0 ? 'text-[#C6FF00]' : stats?.weightChange && stats.weightChange < 0 ? 'text-red-400' : 'text-white'
    },
    {
      emoji: '📅',
      label: '기록일',
      value: stats?.logs.length || 0,
      subValue: '/7일',
      extra: '기록의 힘!',
      color: 'from-purple-500/20 to-violet-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#C6FF00]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 -left-40 w-60 h-60 bg-purple-500/5 rounded-full blur-[80px]" />
      </div>

      {/* 헤더 */}
      <motion.header 
        className="relative z-10 p-5 flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button 
          onClick={() => router.push('/')}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ←
        </motion.button>
        <h1 className="text-xl font-black text-white">주간 리포트</h1>
      </motion.header>

      <div className="relative z-10 px-5 pb-24 space-y-5">
        {/* 점수 카드 */}
        <motion.div 
          className={`relative overflow-hidden rounded-3xl p-7 text-center border border-white/10`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${grade.bgGradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          <div className="relative z-10">
            <p className="text-gray-400 mb-4 font-medium">이번 주 종합 점수</p>
            <div className="flex items-center justify-center gap-5 mb-5">
              <motion.span 
                className="text-7xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {grade.emoji}
              </motion.span>
              <div>
                <motion.span 
                  className="text-8xl font-black"
                  style={{ color: grade.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                >
                  {grade.label}
                </motion.span>
                <motion.p 
                  className="text-3xl font-bold text-gray-300 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {score}점
                </motion.p>
              </div>
            </div>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur">
              <motion.div 
                className="h-full rounded-full"
                style={{ 
                  background: `linear-gradient(to right, ${grade.color}, #C6FF00)`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((card, index) => (
            <motion.div 
              key={card.label}
              className="relative overflow-hidden rounded-2xl p-5 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color}`} />
              <div className="relative z-10">
                <div className="text-3xl mb-3">{card.emoji}</div>
                <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                <p className={`text-3xl font-black mt-1 ${card.valueColor || 'text-white'}`}>
                  {card.value}
                  <span className="text-base text-gray-500 font-medium">{card.subValue}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2 font-medium">{card.extra}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 추천사항 */}
        <motion.div 
          className="relative overflow-hidden rounded-2xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-2xl">💡</span> 이번 주 피드백
            </h2>
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <motion.div 
                    key={index}
                    className="bg-white/5 rounded-xl p-4 text-gray-300 font-medium border border-white/5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    {rec}
                  </motion.div>
                ))
              ) : (
                <div className="bg-white/5 rounded-xl p-4 text-gray-400 text-center">
                  📊 데이터가 더 쌓이면 맞춤 피드백을 드릴게요!
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 다음 주 목표 */}
        <motion.div 
          className="relative overflow-hidden rounded-2xl p-6 border border-[#C6FF00]/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#C6FF00]/10 to-green-500/5" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> 다음 주 목표
            </h2>
            <div className="space-y-3">
              {[
                `운동 ${profile?.workoutDaysPerWeek || 3}회 완료하기`,
                '매일 5끼 챙겨먹기',
                '체중 기록 3회 이상'
              ].map((goal, index) => (
                <motion.div 
                  key={goal}
                  className="flex items-center gap-3 text-gray-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <span className="w-7 h-7 rounded-full bg-[#C6FF00]/20 flex items-center justify-center text-sm font-bold text-[#C6FF00]">
                    {index + 1}
                  </span>
                  <span className="font-medium">{goal}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 프로필 요약 */}
        {profile && (
          <motion.div 
            className="relative overflow-hidden rounded-2xl p-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="text-2xl">👤</span> 내 프로필
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: '닉네임', value: profile.nickname || '미설정' },
                  { label: '목표', value: profile.goalType === 'bulk' ? '💪 벌크업' : profile.goalType === 'cut' ? '🔥 다이어트' : '⚖️ 유지' },
                  { label: '현재 체중', value: `${profile.currentWeight}kg`, highlight: true },
                  { label: '목표 체중', value: `${profile.targetWeight}kg`, highlight: true }
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-gray-500 mb-1">{item.label}</p>
                    <p className={`font-bold ${item.highlight ? 'text-[#C6FF00]' : 'text-white'}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <motion.button
                onClick={() => router.push('/onboarding')}
                className="w-full mt-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10 hover:bg-white/10"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                프로필 수정 →
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
