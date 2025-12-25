'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  DailyLog,
  getOrCreateDailyLog,
  toggleMealComplete,
  toggleExerciseComplete,
  logTodayWeight,
} from '@/lib/firebase/firestore';

export function useDailyLog() {
  const { user, isOffline } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 로컬 상태 (오프라인 모드 및 기본값)
  const [completedMeals, setCompletedMeals] = useState<string[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [weightMeasured, setWeightMeasured] = useState<number | undefined>();

  // 오늘의 기록 불러오기
  const loadTodayLog = useCallback(async () => {
    // 오프라인 모드면 로컬 상태만 사용
    if (isOffline || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const log = await getOrCreateDailyLog(user.uid);
      setCompletedMeals(log.completedMeals || []);
      setCompletedExercises(log.completedExercises || []);
      setWeightMeasured(log.weightMeasured);
      setError(null);
    } catch (err) {
      console.error('일일 기록 로드 실패:', err);
      setError('기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, isOffline]);

  // 식단 완료 토글
  const handleToggleMeal = useCallback(async (mealType: string) => {
    // 먼저 UI 업데이트 (낙관적 업데이트)
    setCompletedMeals(prev => {
      if (prev.includes(mealType)) {
        return prev.filter(m => m !== mealType);
      }
      return [...prev, mealType];
    });

    // 온라인이면 서버에도 저장
    if (!isOffline && user) {
      try {
        await toggleMealComplete(user.uid, mealType);
      } catch (err) {
        console.error('식단 토글 저장 실패:', err);
        // 실패해도 UI는 유지 (오프라인 느낌)
      }
    }
  }, [user, isOffline]);

  // 운동 완료 토글
  const handleToggleExercise = useCallback(async (exerciseName: string) => {
    // 먼저 UI 업데이트 (낙관적 업데이트)
    setCompletedExercises(prev => {
      if (prev.includes(exerciseName)) {
        return prev.filter(e => e !== exerciseName);
      }
      return [...prev, exerciseName];
    });

    // 온라인이면 서버에도 저장
    if (!isOffline && user) {
      try {
        await toggleExerciseComplete(user.uid, exerciseName);
      } catch (err) {
        console.error('운동 토글 저장 실패:', err);
      }
    }
  }, [user, isOffline]);

  // 체중 기록
  const handleLogWeight = useCallback(async (weight: number) => {
    setWeightMeasured(weight);

    if (!isOffline && user) {
      try {
        await logTodayWeight(user.uid, weight);
      } catch (err) {
        console.error('체중 기록 실패:', err);
        setError('저장에 실패했습니다.');
      }
    } else {
      console.log('오프라인 모드: 체중 기록은 저장되지 않습니다.');
    }
  }, [user, isOffline]);

  // 초기 로드
  useEffect(() => {
    loadTodayLog();
  }, [loadTodayLog]);

  // dailyLog 객체 생성 (호환성 유지)
  const dailyLog: DailyLog = {
    id: user?.uid ? `${user.uid}_${new Date().toISOString().split('T')[0]}` : 'local',
    oderId: user?.uid || 'local',
    date: new Date().toISOString().split('T')[0],
    dietScore: completedMeals.length,
    completedMeals,
    workoutPart: '',
    completedExercises,
    weightMeasured,
    createdAt: null as any,
    updatedAt: null as any,
  };

  return {
    dailyLog,
    completedMeals,
    completedExercises,
    loading,
    error,
    isOffline,
    toggleMeal: handleToggleMeal,
    toggleExercise: handleToggleExercise,
    logWeight: handleLogWeight,
    refresh: loadTodayLog,
  };
}
