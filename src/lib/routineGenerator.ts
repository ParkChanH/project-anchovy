import { UserProfile } from '@/lib/firebase/firestore';
import { 
  WEEKLY_ROUTINE, 
  WEEKLY_MEAL_PLAN, 
  DailyRoutine, 
  DailyMealPlan,
  ExerciseData,
  DayOfWeek 
} from './constants';

// ============================================
// 개인화 루틴 생성기
// ============================================

// 주 운동 횟수에 따른 요일 패턴
const WORKOUT_PATTERNS: Record<number, DayOfWeek[]> = {
  2: ['Tue', 'Thu'],
  3: ['Mon', 'Wed', 'Fri'],
  4: ['Mon', 'Tue', 'Thu', 'Fri'],
  5: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  6: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  7: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

// 경험 레벨에 따른 세트/횟수 조정 비율
const LEVEL_MULTIPLIERS = {
  beginner: { sets: 0.75, reps: 1.0 }, // 세트 수 줄임
  intermediate: { sets: 1.0, reps: 1.0 },
  advanced: { sets: 1.25, reps: 0.9 }, // 세트 늘리고 무거운 중량
};

// 목표에 따른 휴식시간 가이드
const REST_TIME_GUIDE = {
  bulk: '2-3분 (근비대 최적화)',
  cut: '30초-1분 (심박수 유지)',
  maintain: '1-2분 (균형 잡힌 휴식)',
};

// 목표에 따른 칼로리 조정
const CALORIE_ADJUSTMENT = {
  bulk: 1.15, // +15%
  cut: 0.85, // -15%
  maintain: 1.0,
};

export interface PersonalizedRoutine {
  workoutDays: DayOfWeek[];
  restDays: DayOfWeek[];
  routineType: string;
  restTimeGuide: string;
  dailyCalorieTarget: number;
}

export interface PersonalizedDailyRoutine extends DailyRoutine {
  isWorkoutDay: boolean;
  adjustedExercises: ExerciseData[];
}

export interface PersonalizedMealPlan extends DailyMealPlan {
  dailyCalorieTarget: number;
  adjustedForLactose: boolean;
}

// 개인화된 주간 루틴 정보 생성
export function generatePersonalizedRoutineInfo(profile: UserProfile | null): PersonalizedRoutine {
  const workoutDays = profile?.workoutDaysPerWeek || 5;
  const goalType = profile?.goalType || 'bulk';
  
  const workoutPattern = WORKOUT_PATTERNS[workoutDays] || WORKOUT_PATTERNS[5];
  const allDays: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const restDays = allDays.filter(day => !workoutPattern.includes(day));
  
  // 칼로리 계산 (해리스-베네딕트 공식 간소화)
  const baseCalories = profile ? calculateBMR(profile) : 2000;
  const activityMultiplier = profile?.lifestyle === 'active' ? 1.55 : 
                             profile?.lifestyle === 'student' ? 1.4 : 1.35;
  const adjustedCalories = Math.round(
    baseCalories * activityMultiplier * CALORIE_ADJUSTMENT[goalType]
  );
  
  return {
    workoutDays: workoutPattern,
    restDays,
    routineType: getRoutineType(workoutDays),
    restTimeGuide: REST_TIME_GUIDE[goalType],
    dailyCalorieTarget: adjustedCalories,
  };
}

// 기초대사량 계산 (Mifflin-St Jeor 공식)
function calculateBMR(profile: UserProfile): number {
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : 25;
  const weight = profile.currentWeight || 60;
  const height = profile.height || 170;
  
  if (profile.gender === 'female') {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
  return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
}

// 루틴 타입 결정
function getRoutineType(workoutDays: number): string {
  if (workoutDays <= 2) return '상하체 분할';
  if (workoutDays <= 3) return '전신 or 상하체';
  if (workoutDays <= 4) return '상하체 분할';
  return '3분할 (Push-Pull-Legs)';
}

// 오늘의 개인화된 루틴 가져오기
export function getTodayPersonalizedRoutine(
  profile: UserProfile | null, 
  dayCode: DayOfWeek
): PersonalizedDailyRoutine {
  const info = generatePersonalizedRoutineInfo(profile);
  const baseRoutine = WEEKLY_ROUTINE[dayCode];
  const isWorkoutDay = info.workoutDays.includes(dayCode);
  
  const level = profile?.experienceLevel || 'beginner';
  const multiplier = LEVEL_MULTIPLIERS[level];
  
  // 운동일이 아니면 휴식 루틴
  if (!isWorkoutDay) {
    return {
      ...baseRoutine,
      type: 'Rest',
      focus: '휴식 & 회복',
      isWorkoutDay: false,
      adjustedExercises: [
        { name: '스트레칭', sets: 1, reps: '15분', note: '근육 회복에 집중' },
        { name: '가벼운 산책', sets: 1, reps: '20분', note: '활성 회복' },
      ],
    };
  }
  
  // 세트 수 조정
  const adjustedExercises = baseRoutine.exercises.map(exercise => ({
    ...exercise,
    sets: Math.max(2, Math.round(exercise.sets * multiplier.sets)),
  }));
  
  return {
    ...baseRoutine,
    isWorkoutDay: true,
    adjustedExercises,
  };
}

// 오늘의 개인화된 식단 가져오기
export function getTodayPersonalizedMealPlan(
  profile: UserProfile | null,
  dayCode: DayOfWeek
): PersonalizedMealPlan {
  const info = generatePersonalizedRoutineInfo(profile);
  const baseMealPlan = WEEKLY_MEAL_PLAN[dayCode];
  
  const hasLactoseIntolerance = profile?.lactoseIntolerance ?? false;
  
  // 유당불내증 시 식단 조정
  const adjustedMealPlan = { ...baseMealPlan };
  
  if (hasLactoseIntolerance) {
    // 우유 관련 항목 대체
    if (adjustedMealPlan.breakfast.name.includes('시리얼')) {
      adjustedMealPlan.breakfast = {
        ...adjustedMealPlan.breakfast,
        detail: adjustedMealPlan.breakfast.detail.replace('우유', '두유/아몬드밀크'),
      };
    }
    
    adjustedMealPlan.supplement = {
      ...adjustedMealPlan.supplement,
      detail: 'WPI 분리유청 + 물 (유청 분리로 유당 최소화)',
    };
  }
  
  return {
    ...adjustedMealPlan,
    dailyCalorieTarget: info.dailyCalorieTarget,
    adjustedForLactose: hasLactoseIntolerance,
  };
}

// 다음 주 루틴 추천 (기록 기반)
export interface WeeklyRecommendation {
  focusArea: string;
  exerciseAdjustments: string[];
  mealAdjustments: string[];
  overallAdvice: string;
}

export function generateWeeklyRecommendation(
  profile: UserProfile | null,
  completionRate: number,
  avgDietScore: number,
  weightChange: number
): WeeklyRecommendation {
  const goalType = profile?.goalType || 'bulk';
  const focusAreas: string[] = [];
  const exerciseAdjustments: string[] = [];
  const mealAdjustments: string[] = [];
  
  // 운동 완료율 기반 조정
  if (completionRate < 50) {
    focusAreas.push('운동 일관성');
    exerciseAdjustments.push('주 운동 횟수를 1-2회 줄여보세요');
    exerciseAdjustments.push('짧고 강렬한 운동으로 변경해보세요');
  } else if (completionRate >= 90) {
    exerciseAdjustments.push('무게를 2.5kg씩 점진적으로 늘려보세요');
    exerciseAdjustments.push('새로운 운동 추가를 고려해보세요');
  }
  
  // 식단 점수 기반 조정
  if (avgDietScore < 3) {
    focusAreas.push('식단 관리');
    mealAdjustments.push('간식을 미리 준비해두세요');
    mealAdjustments.push('보충제를 챙겨먹는 습관을 들이세요');
  } else if (avgDietScore >= 4) {
    mealAdjustments.push('훌륭합니다! 식단을 그대로 유지하세요');
  }
  
  // 체중 변화 기반 조정
  if (goalType === 'bulk') {
    if (weightChange < 0) {
      mealAdjustments.push('칼로리 섭취를 200kcal 늘려보세요');
      mealAdjustments.push('식사 사이에 간식을 추가하세요');
    } else if (weightChange > 0.7) {
      mealAdjustments.push('체중 증가가 빠릅니다. 지방 증가에 주의하세요');
    }
  } else if (goalType === 'cut') {
    if (weightChange > 0) {
      mealAdjustments.push('칼로리 섭취를 점검해보세요');
      exerciseAdjustments.push('유산소 운동 10분을 추가해보세요');
    }
  }
  
  // 전반적인 조언
  let overallAdvice = '';
  if (focusAreas.length === 0) {
    overallAdvice = '이번 주도 훌륭했어요! 같은 페이스로 계속 가세요 💪';
  } else {
    overallAdvice = `이번 주는 "${focusAreas.join(', ')}"에 집중해보세요!`;
  }
  
  return {
    focusArea: focusAreas.join(', ') || '유지',
    exerciseAdjustments,
    mealAdjustments,
    overallAdvice,
  };
}

