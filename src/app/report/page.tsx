'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📊</div>
          <p className="text-gray-400">분석 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // 추천사항 생성
  const getRecommendations = (): string[] => {
    if (!stats || !profile) return [];
    
    const recommendations: string[] = [];
    
    // 운동 완료율 기반
    if (stats.completionRate < 50) {
      recommendations.push('💪 운동 횟수를 조금씩 늘려보세요. 꾸준함이 중요합니다!');
    } else if (stats.completionRate >= 80) {
      recommendations.push('🔥 훌륭해요! 이대로 유지하면 목표 달성은 시간문제입니다!');
    }
    
    // 식단 점수 기반
    if (stats.avgDietScore < 3) {
      recommendations.push('🍽️ 끼니를 거르지 마세요. 특히 간식과 보충제가 중요합니다.');
    } else if (stats.avgDietScore >= 4) {
      recommendations.push('🥗 식단 관리가 훌륭합니다! 근성장의 70%는 식단입니다.');
    }
    
    // 체중 변화 기반
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
    
    // 운동 일수 기반
    if (stats.totalWorkouts === 0) {
      recommendations.push('🏋️ 이번 주는 운동을 시작해보세요. 가볍게 시작해도 좋아요!');
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  // 점수 계산 (100점 만점)
  const calculateScore = (): number => {
    if (!stats) return 0;
    
    const workoutScore = (stats.completionRate / 100) * 40; // 40점
    const dietScore = (stats.avgDietScore / 5) * 40; // 40점
    const consistencyScore = stats.logs.length >= 5 ? 20 : (stats.logs.length / 5) * 20; // 20점
    
    return Math.round(workoutScore + dietScore + consistencyScore);
  };

  const score = calculateScore();

  const getScoreGrade = (score: number): { label: string; emoji: string; color: string } => {
    if (score >= 90) return { label: 'S', emoji: '🏆', color: '#FFD700' };
    if (score >= 80) return { label: 'A', emoji: '🌟', color: '#C6FF00' };
    if (score >= 70) return { label: 'B', emoji: '💪', color: '#22c55e' };
    if (score >= 60) return { label: 'C', emoji: '👍', color: '#eab308' };
    if (score >= 50) return { label: 'D', emoji: '🔄', color: '#f97316' };
    return { label: 'F', emoji: '💥', color: '#ef4444' };
  };

  const grade = getScoreGrade(score);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 헤더 */}
      <header className="p-4 flex items-center gap-4">
        <button 
          onClick={() => router.push('/')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-white">주간 리포트</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* 점수 카드 */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-center">
          <p className="text-gray-400 mb-2">이번 주 종합 점수</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl">{grade.emoji}</span>
            <div>
              <span 
                className="text-7xl font-bold"
                style={{ color: grade.color }}
              >
                {grade.label}
              </span>
              <p className="text-2xl text-gray-400">{score}점</p>
            </div>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ 
                width: `${score}%`,
                background: `linear-gradient(to right, ${grade.color}, #C6FF00)`
              }}
            />
          </div>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-800">
            <div className="text-3xl mb-2">🏋️</div>
            <p className="text-gray-400 text-sm">운동 횟수</p>
            <p className="text-2xl font-bold text-white">
              {stats?.totalWorkouts || 0}
              <span className="text-sm text-gray-500">/{profile?.workoutDaysPerWeek || 5}회</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              달성률 {stats?.completionRate.toFixed(0) || 0}%
            </p>
          </div>

          <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-800">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-gray-400 text-sm">총 식사</p>
            <p className="text-2xl font-bold text-white">
              {stats?.totalMeals || 0}
              <span className="text-sm text-gray-500">끼</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              평균 {stats?.avgDietScore.toFixed(1) || 0}/5점
            </p>
          </div>

          <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-800">
            <div className="text-3xl mb-2">⚖️</div>
            <p className="text-gray-400 text-sm">체중 변화</p>
            <p className={`text-2xl font-bold ${
              stats?.weightChange && stats.weightChange > 0 
                ? 'text-green-400' 
                : stats?.weightChange && stats.weightChange < 0 
                  ? 'text-red-400' 
                  : 'text-white'
            }`}>
              {stats?.weightChange 
                ? (stats.weightChange > 0 ? '+' : '') + stats.weightChange.toFixed(1) 
                : '0'}
              <span className="text-sm">kg</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">이번 주 기록 기준</p>
          </div>

          <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-gray-800">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-gray-400 text-sm">기록일</p>
            <p className="text-2xl font-bold text-white">
              {stats?.logs.length || 0}
              <span className="text-sm text-gray-500">/7일</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">기록의 힘!</p>
          </div>
        </div>

        {/* 추천사항 */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>💡</span> 이번 주 피드백
          </h2>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-4 text-gray-300"
                >
                  {rec}
                </div>
              ))
            ) : (
              <div className="bg-gray-800/50 rounded-lg p-4 text-gray-300">
                📊 데이터가 더 쌓이면 맞춤 피드백을 드릴게요!
              </div>
            )}
          </div>
        </div>

        {/* 다음 주 목표 */}
        <div className="bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/20 rounded-2xl p-6 border border-[var(--primary)]/30">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🎯</span> 다음 주 목표
          </h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--primary)]/30 flex items-center justify-center text-sm">1</span>
              운동 {(profile?.workoutDaysPerWeek || 3)}회 완료하기
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--primary)]/30 flex items-center justify-center text-sm">2</span>
              매일 5끼 챙겨먹기
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--primary)]/30 flex items-center justify-center text-sm">3</span>
              체중 기록 3회 이상
            </div>
          </div>
        </div>

        {/* 프로필 요약 */}
        {profile && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>👤</span> 내 프로필
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">닉네임</p>
                <p className="text-white font-medium">{profile.nickname || '미설정'}</p>
              </div>
              <div>
                <p className="text-gray-400">목표</p>
                <p className="text-white font-medium">
                  {profile.goalType === 'bulk' ? '벌크업' : profile.goalType === 'cut' ? '다이어트' : '유지'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">현재 체중</p>
                <p className="text-white font-medium">{profile.currentWeight}kg</p>
              </div>
              <div>
                <p className="text-gray-400">목표 체중</p>
                <p className="text-white font-medium">{profile.targetWeight}kg</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              프로필 수정 →
            </button>
          </div>
        )}
      </div>

      {/* 하단 여백 */}
      <div className="h-20" />
    </div>
  );
}

