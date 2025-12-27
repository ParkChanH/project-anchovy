import { PROJECT_START_DATE, WEEKLY_ROUTINE, WEEKLY_MEAL_PLAN, DayOfWeek, DAY_LABELS } from './constants';
import type { DailyRoutine, DailyMealPlan } from './constants';

// D-Day 계산
export function calculateDDay(startDate: Date = PROJECT_START_DATE): number {
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // D+1부터 시작
}

// 진행률 계산 (%)
export function calculateProgress(
  currentWeight: number,
  startWeight: number,
  targetWeight: number
): number {
  if (targetWeight === startWeight) return 0;
  const progress = ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100;
  return Math.max(0, Math.min(100, progress));
}

// 오늘의 요일 코드 가져오기
export function getTodayDayCode(): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

// 오늘의 요일 한글
export function getTodayLabel(): string {
  return DAY_LABELS[getTodayDayCode()];
}

// 오늘의 운동 루틴 가져오기
export function getTodayRoutine(): DailyRoutine {
  return WEEKLY_ROUTINE[getTodayDayCode()];
}

// 오늘의 식단 가져오기
export function getTodayMealPlan(): DailyMealPlan {
  return WEEKLY_MEAL_PLAN[getTodayDayCode()];
}

// 오늘의 운동 파트 (이전 호환성)
export function getTodayWorkout() {
  return getTodayRoutine().type;
}

// 1RM 추정 계산 (Brzycki 공식)
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 12) return weight * 1.25; // 12회 초과시 근사값
  return Math.round(weight / (1.0278 - 0.0278 * reps));
}

// 날짜 포맷팅 (한국어)
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

// 짧은 날짜 포맷팅
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

// 시간 포맷팅
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 체중 변화량 계산
export function calculateWeightChange(currentWeight: number, startWeight: number): string {
  const change = currentWeight - startWeight;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}kg`;
}

// 예상 총 칼로리 계산
export function calculateTotalCalories(mealPlan: DailyMealPlan): number {
  return (
    (mealPlan.breakfast.calories || 0) +
    (mealPlan.lunch.calories || 0) +
    (mealPlan.snack.calories || 0) +
    (mealPlan.dinner.calories || 0) +
    (mealPlan.supplement.calories || 0)
  );
}

// 유당 키워드 감지
export function detectLactose(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// 햅틱 피드백
type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | number;

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const durations: Record<string, number | number[]> = {
      light: 10,
      medium: 30,
      heavy: 50,
      success: [10, 50, 30], // 짧게-멈춤-길게
      error: [50, 100, 50, 100, 50], // 반복 진동
    };
    
    const duration = typeof type === 'number' ? type : durations[type] || 30;
    navigator.vibrate(duration);
  }
}
