'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useAuth } from '@/context/AuthContext';
import { getProfileBasedMealPlan, triggerHaptic } from '@/lib/utils';
import { matchProgramToUser } from '@/lib/programDatabase';

type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supplement';

const MEAL_INFO: Record<MealType, { label: string; time: string; icon: string }> = {
  breakfast: { label: '아침', time: '08:00', icon: '🌅' },
  lunch: { label: '점심', time: '12:00', icon: '☀️' },
  snack: { label: '간식', time: '15:00', icon: '🍪' },
  dinner: { label: '저녁', time: '19:00', icon: '🌙' },
  supplement: { label: '보충제', time: '21:00', icon: '💊' },
};

export default function MealPlanCard() {
  const { completedMeals: completedMealsArray, toggleMeal, loading } = useDailyLog();
  const { profile } = useAuth();
  const todayMealPlan = getProfileBasedMealPlan(profile);

  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);

  // 완료 상태 사용
  const completedMeals = new Set(completedMealsArray);
  const completedCount = completedMeals.size;
  const scoreLevel = getScoreLevel(completedCount);

  // 프로필 기반 칼로리 목표
  const calorieTarget = profile 
    ? matchProgramToUser(profile).calorieInfo.targetCalories 
    : todayMealPlan.totalCalories;

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

  const calorieProgress = (completedCalories / calorieTarget) * 100;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
    >
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-amber-600/5 to-yellow-600/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      <div className="relative p-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">🍽️</span>
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white">오늘의 식단</h3>
              <p className="text-gray-400 text-sm">
                목표 {calorieTarget.toLocaleString()}kcal
              </p>
            </div>
          </div>
          
          {/* 점수 배지 */}
          <motion.div 
            className="px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${scoreLevel.color}30, ${scoreLevel.color}10)`,
              borderColor: `${scoreLevel.color}50`,
              color: scoreLevel.color,
              border: `1px solid ${scoreLevel.color}40`,
            }}
            animate={{ scale: loading ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 0.5, repeat: loading ? Infinity : 0 }}
          >
            {loading && (
              <motion.span 
                className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className="text-lg">{scoreLevel.emoji}</span>
            <span>{completedCount}/5</span>
          </motion.div>
        </div>

        {/* 식단 슬롯 리스트 */}
        <div className="space-y-2 mb-5">
          <AnimatePresence>
            {mealTypes.map((type, index) => (
              <MealSlotRow
                key={type}
                type={type}
                meal={todayMealPlan[type]}
                info={MEAL_INFO[type]}
                index={index}
                isCompleted={completedMeals.has(type)}
                isExpanded={expandedMeal === type}
                onToggleComplete={() => handleToggleMeal(type)}
                onToggleExpand={() => setExpandedMeal(expandedMeal === type ? null : type)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* 칼로리 진행 바 */}
        <motion.div 
          className="pt-4 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm font-medium">섭취 칼로리</span>
            <motion.span 
              className="font-bold text-lg"
              style={{ color: scoreLevel.color }}
              key={completedCalories}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {completedCalories.toLocaleString()} / {calorieTarget.toLocaleString()} kcal
            </motion.span>
          </div>
          
          <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur">
            <motion.div 
              className="h-full rounded-full relative"
              style={{ 
                background: `linear-gradient(90deg, #f97316, ${scoreLevel.color})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(calorieProgress, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {calorieProgress > 0 && (
                <motion.div 
                  className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          </div>
          
          {completedCount >= 4 && (
            <motion.p 
              className="text-center text-sm font-bold mt-3"
              style={{ color: scoreLevel.color }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {scoreLevel.message}
            </motion.p>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

interface MealSlotRowProps {
  type: MealType;
  meal: { name: string; detail: string; calories: number; emoji: string };
  info: { label: string; time: string; icon: string };
  index: number;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleComplete: () => void;
  onToggleExpand: () => void;
}

function MealSlotRow({
  type,
  meal,
  info,
  index,
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpand,
}: MealSlotRowProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        rounded-2xl overflow-hidden backdrop-blur transition-all duration-300
        ${isCompleted 
          ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
        }
      `}
    >
      {/* 메인 행 */}
      <div 
        className="flex items-center p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* 체크박스 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-pressed={isCompleted}
          aria-label={`${meal.name} ${isCompleted ? '완료됨' : ''}`}
          className={`
            w-12 h-12 rounded-xl mr-4 flex items-center justify-center text-2xl
            transition-all duration-300 flex-shrink-0 shadow-lg
            ${isCompleted 
              ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30' 
              : 'bg-white/10 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
            }
          `}
        >
          {meal.emoji}
        </motion.button>
        
        {/* 식단 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isCompleted ? 'text-orange-300' : 'text-white'}`}>
              {meal.name}
            </p>
            {isCompleted && (
              <motion.span 
                className="text-green-400 text-xs bg-green-500/20 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ✓ 완료
              </motion.span>
            )}
          </div>
          <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
            <span>{info.icon}</span>
            <span>{info.time}</span>
            <span>·</span>
            <span>{info.label}</span>
          </p>
        </div>
        
        {/* 칼로리 */}
        <div className="text-right flex-shrink-0">
          <motion.p 
            className={`text-sm font-bold ${isCompleted ? 'text-orange-400' : 'text-gray-400'}`}
            animate={{ scale: isCompleted ? [1, 1.1, 1] : 1 }}
          >
            {meal.calories}kcal
          </motion.p>
        </div>
      </div>

      {/* 확장 패널 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-gray-300 text-sm leading-relaxed">{meal.detail}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
