'use client';

import { useState } from 'react';
import { useDailyLog } from '@/hooks/useDailyLog';
import { getTodayMealPlan, calculateTotalCalories, triggerHaptic } from '@/lib/utils';
import { GOALS } from '@/lib/constants';
import type { MealData } from '@/lib/constants';

type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supplement';

const MEAL_INFO: Record<MealType, { label: string; time: string }> = {
  breakfast: { label: '아침', time: '08:00' },
  lunch: { label: '점심', time: '12:00' },
  snack: { label: '간식', time: '15:00' },
  dinner: { label: '저녁', time: '19:00' },
  supplement: { label: '보충제', time: '21:00' },
};

export default function MealPlanCard() {
  const { completedMeals: completedMealsArray, toggleMeal, loading } = useDailyLog();
  const todayMealPlan = getTodayMealPlan();
  const totalCalories = calculateTotalCalories(todayMealPlan);

  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);

  // 완료 상태 사용
  const completedMeals = new Set(completedMealsArray);
  const completedCount = completedMeals.size;
  const scoreLevel = getScoreLevel(completedCount);

  // 완료된 칼로리 합산
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'supplement'];
  const completedCalories = mealTypes.reduce((sum, type) => {
    if (completedMeals.has(type)) {
      return sum + (todayMealPlan[type].calories || 0);
    }
    return sum;
  }, 0);

  const handleToggleMeal = async (type: MealType) => {
    triggerHaptic(50);
    await toggleMeal(type);
  };

  return (
    <section className="bg-gradient-to-br from-[#1e1e1e] to-[#252525] p-5 rounded-3xl border border-white/5 shadow-xl animate-slide-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-10 rounded-full bg-orange-500" />
          <div>
            <h3 className="text-lg font-bold text-white">오늘의 식단</h3>
            <p className="text-gray-400 text-sm">
              목표 {GOALS.dailyCalorieTarget.toLocaleString()}kcal
            </p>
          </div>
        </div>
        
        {/* 점수 배지 */}
        <div 
          className="px-3 py-1.5 rounded-2xl font-bold text-sm transition-all duration-300 border flex items-center gap-1"
          style={{ 
            backgroundColor: `${scoreLevel.color}20`,
            borderColor: `${scoreLevel.color}50`,
            color: scoreLevel.color,
          }}
        >
          {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          <span>{scoreLevel.emoji}</span>
          <span>{completedCount}/5</span>
        </div>
      </div>

      {/* 식단 슬롯 리스트 */}
      <div className="space-y-2 mb-4">
        {mealTypes.map((type) => (
          <MealSlotRow
            key={type}
            type={type}
            meal={todayMealPlan[type]}
            info={MEAL_INFO[type]}
            isCompleted={completedMeals.has(type)}
            isExpanded={expandedMeal === type}
            onToggleComplete={() => handleToggleMeal(type)}
            onToggleExpand={() => setExpandedMeal(expandedMeal === type ? null : type)}
          />
        ))}
      </div>

      {/* 칼로리 진행 바 */}
      <div className="pt-3 border-t border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-sm">섭취 칼로리</span>
          <span className="font-bold text-sm" style={{ color: scoreLevel.color }}>
            {completedCalories.toLocaleString()} / {GOALS.dailyCalorieTarget.toLocaleString()} kcal
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min((completedCalories / GOALS.dailyCalorieTarget) * 100, 100)}%`,
              background: `linear-gradient(90deg, #f97316, ${scoreLevel.color})`,
            }}
          />
        </div>
        {completedCount >= 4 && (
          <p className="text-center text-sm font-medium mt-2 animate-pulse" style={{ color: scoreLevel.color }}>
            {scoreLevel.message}
          </p>
        )}
      </div>
    </section>
  );
}

interface MealSlotRowProps {
  type: MealType;
  meal: MealData;
  info: { label: string; time: string };
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleComplete: () => void;
  onToggleExpand: () => void;
}

function MealSlotRow({
  type,
  meal,
  info,
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpand,
}: MealSlotRowProps) {
  return (
    <div 
      className={`
        rounded-xl overflow-hidden transition-all duration-300
        ${isCompleted 
          ? 'bg-orange-500/10 border border-orange-500/20' 
          : 'bg-white/5 border border-transparent'
        }
      `}
    >
      {/* 메인 행 */}
      <div 
        className="flex items-center p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* 체크박스 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          aria-pressed={isCompleted}
          aria-label={`${meal.name} ${isCompleted ? '완료됨' : ''}`}
          className={`
            w-10 h-10 rounded-xl mr-3 flex items-center justify-center text-xl
            transition-all duration-300 flex-shrink-0
            ${isCompleted 
              ? 'bg-orange-500/30 scale-100' 
              : 'bg-white/10 grayscale opacity-60 hover:opacity-100'
            }
          `}
        >
          {meal.emoji}
        </button>
        
        {/* 식단 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isCompleted ? 'text-orange-300' : 'text-white'}`}>
              {meal.name}
            </p>
            {isCompleted && (
              <span className="text-green-400 text-xs">✓ 저장됨</span>
            )}
          </div>
          <p className="text-gray-500 text-xs">{info.time} · {info.label}</p>
        </div>
        
        {/* 칼로리 */}
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-medium ${isCompleted ? 'text-orange-400' : 'text-gray-400'}`}>
            {meal.calories}kcal
          </p>
        </div>
      </div>

      {/* 확장 패널 */}
      {isExpanded && (
        <div className="px-3 pb-3 animate-fade-in">
          <div className="p-3 bg-black/20 rounded-lg">
            <p className="text-gray-400 text-sm">{meal.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreLevel(count: number) {
  const levels = [
    { emoji: '😢', color: '#ef4444', message: '시작이 반!' },
    { emoji: '😕', color: '#f97316', message: '조금 더 먹어요!' },
    { emoji: '😐', color: '#eab308', message: '절반 왔어요!' },
    { emoji: '🙂', color: '#84cc16', message: '좋아요!' },
    { emoji: '😊', color: '#22c55e', message: '거의 완벽! 근성장 +1' },
    { emoji: '🔥', color: '#C6FF00', message: '퍼펙트! 💪 오늘 최고!' },
  ];
  return levels[Math.min(count, 5)];
}
