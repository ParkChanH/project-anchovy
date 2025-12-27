// ============================================
// 범용 헬스케어 프로그램 데이터베이스
// ============================================

import { UserProfile } from '@/lib/firebase/firestore';

// ============================================
// 타입 정의
// ============================================

export type GoalType = 'BULK_UP' | 'MAINTENANCE' | 'DIET';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ExerciseItem {
  name: string;
  sets: number;
  reps: string;
  burnfitId?: string;
  note?: string;
}

export interface DailyWorkout {
  part: string;
  exercises: ExerciseItem[];
}

export interface WorkoutProgram {
  programId: string;
  targetGoal: GoalType;
  frequency: number;
  level: ExperienceLevel;
  hasGymAccess: boolean;
  description: string;
  routines: Partial<Record<DayOfWeek, DailyWorkout>>;
}

export interface MealItem {
  name: string;
  detail: string;
  calories: number;
  emoji: string;
}

export interface DailyMeal {
  breakfast: MealItem;
  lunch: MealItem;
  snack: MealItem;
  dinner: MealItem;
  supplement: MealItem;
}

export interface DietPlan {
  planId: string;
  targetCalories: number;
  targetGoal: GoalType;
  tags: string[];
  lactoseFree: boolean;
  vegetarian: boolean;
  description: string;
  menuGuide: DailyMeal;
}

// ============================================
// BMI 기반 목표 자동 분류
// ============================================

export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

export function classifyGoalByBMI(bmi: number, userGoal?: string): GoalType {
  // 사용자가 명시적으로 선택한 경우 우선
  if (userGoal === 'bulk') return 'BULK_UP';
  if (userGoal === 'cut') return 'DIET';
  if (userGoal === 'maintain') return 'MAINTENANCE';
  
  // BMI 기반 자동 분류
  if (bmi < 18.5) return 'BULK_UP';
  if (bmi > 23.0) return 'DIET';
  return 'MAINTENANCE';
}

// ============================================
// 칼로리 계산 (해리스-베네딕트 공식)
// ============================================

export interface CalorieCalculation {
  bmr: number;
  tdee: number;
  targetCalories: number;
  surplus: number;
}

export function calculateCalories(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: number, // 1.2 ~ 1.9
  goal: GoalType
): CalorieCalculation {
  // 해리스-베네딕트 공식
  let bmr: number;
  if (gender === 'female') {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  } else {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  }
  
  const tdee = bmr * activityLevel;
  
  // 목표에 따른 칼로리 조정
  let surplus = 0;
  if (goal === 'BULK_UP') surplus = 500; // +500kcal
  else if (goal === 'DIET') surplus = -500; // -500kcal
  
  const targetCalories = Math.round(tdee + surplus);
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    surplus,
  };
}

// 활동 계수 결정
export function getActivityMultiplier(workoutDaysPerWeek: number, lifestyle: string): number {
  const baseMultiplier = lifestyle === 'active' ? 1.55 : 
                         lifestyle === 'student' ? 1.4 : 1.35;
  
  // 운동 일수에 따른 추가 조정
  if (workoutDaysPerWeek >= 6) return baseMultiplier + 0.15;
  if (workoutDaysPerWeek >= 4) return baseMultiplier + 0.1;
  if (workoutDaysPerWeek >= 2) return baseMultiplier + 0.05;
  return baseMultiplier;
}

// ============================================
// 운동 프로그램 데이터베이스
// ============================================

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  // ==========================================
  // 벌크업 프로그램
  // ==========================================
  {
    programId: 'BULK_UP_3_GYM_BEGINNER',
    targetGoal: 'BULK_UP',
    frequency: 3,
    level: 'beginner',
    hasGymAccess: true,
    description: '초보자를 위한 주 3일 전신 벌크업',
    routines: {
      Mon: { part: 'Full Body A', exercises: [
        { name: '스쿼트', sets: 4, reps: '8-10', burnfitId: '바벨-백스쿼트' },
        { name: '벤치프레스', sets: 4, reps: '8-10', burnfitId: '벤치프레스' },
        { name: '바벨 로우', sets: 3, reps: '10-12', burnfitId: '바벨-로우' },
      ]},
      Wed: { part: 'Full Body B', exercises: [
        { name: '데드리프트', sets: 3, reps: '5-6', burnfitId: '컨벤셔널-데드리프트' },
        { name: '오버헤드 프레스', sets: 3, reps: '8-10', burnfitId: '오버헤드-프레스' },
        { name: '렛풀다운', sets: 3, reps: '10-12', burnfitId: '랫풀다운' },
      ]},
      Fri: { part: 'Full Body C', exercises: [
        { name: '레그 프레스', sets: 4, reps: '10-12', burnfitId: '레그-프레스' },
        { name: '덤벨 프레스', sets: 3, reps: '10-12', burnfitId: '덤벨-벤치프레스' },
        { name: '시티드 로우', sets: 3, reps: '10-12', burnfitId: '시티드-케이블-로우' },
      ]},
    },
  },
  {
    programId: 'BULK_UP_5_GYM_INTERMEDIATE',
    targetGoal: 'BULK_UP',
    frequency: 5,
    level: 'intermediate',
    hasGymAccess: true,
    description: '중급자를 위한 5분할 근비대 프로그램',
    routines: {
      Mon: { part: 'Chest (가슴)', exercises: [
        { name: '벤치프레스', sets: 4, reps: '6-8', burnfitId: '벤치프레스' },
        { name: '인클라인 덤벨프레스', sets: 4, reps: '8-10', burnfitId: '인클라인-덤벨-벤치프레스' },
        { name: '펙덱 플라이', sets: 3, reps: '12-15', burnfitId: '펙덱-플라이-머신' },
        { name: '딥스', sets: 3, reps: 'MAX', burnfitId: '딥스' },
      ]},
      Tue: { part: 'Back (등)', exercises: [
        { name: '풀업', sets: 4, reps: 'MAX', burnfitId: '풀업' },
        { name: '바벨 로우', sets: 4, reps: '6-8', burnfitId: '바벨-로우' },
        { name: '렛풀다운', sets: 3, reps: '10-12', burnfitId: '랫풀다운' },
        { name: '시티드 로우', sets: 3, reps: '10-12', burnfitId: '시티드-케이블-로우' },
      ]},
      Wed: { part: 'Legs (하체)', exercises: [
        { name: '스쿼트', sets: 5, reps: '5-8', burnfitId: '바벨-백스쿼트' },
        { name: '루마니안 데드리프트', sets: 4, reps: '8-10', burnfitId: '루마니안-데드리프트' },
        { name: '레그 프레스', sets: 4, reps: '10-12', burnfitId: '레그-프레스' },
        { name: '레그 컬', sets: 3, reps: '12-15', burnfitId: '레그-컬' },
      ]},
      Thu: { part: 'Shoulder (어깨)', exercises: [
        { name: '오버헤드 프레스', sets: 4, reps: '6-8', burnfitId: '오버헤드-프레스' },
        { name: '사이드 레터럴 레이즈', sets: 5, reps: '15-20', burnfitId: '덤벨-레터럴-레이즈' },
        { name: '페이스풀', sets: 4, reps: '12-15', burnfitId: '페이스-풀' },
        { name: '덤벨 슈러그', sets: 3, reps: '12-15', burnfitId: '덤벨-슈러그' },
      ]},
      Fri: { part: 'Arms (팔)', exercises: [
        { name: '바벨 컬', sets: 4, reps: '8-10', burnfitId: '바벨-컬' },
        { name: '해머 컬', sets: 3, reps: '10-12', burnfitId: '덤벨-해머-컬' },
        { name: '트라이셉스 푸시다운', sets: 4, reps: '10-12', burnfitId: '케이블-푸시-다운' },
        { name: '오버헤드 익스텐션', sets: 3, reps: '12-15', burnfitId: '케이블-오버헤드-트라이셉-익스텐션' },
      ]},
    },
  },
  {
    programId: 'BULK_UP_3_HOME_BEGINNER',
    targetGoal: 'BULK_UP',
    frequency: 3,
    level: 'beginner',
    hasGymAccess: false,
    description: '홈트레이닝 벌크업 (덤벨만)',
    routines: {
      Mon: { part: 'Upper (상체)', exercises: [
        { name: '푸시업', sets: 4, reps: 'MAX', burnfitId: '푸시업' },
        { name: '덤벨 로우', sets: 4, reps: '10-12', burnfitId: '덤벨-로우' },
        { name: '덤벨 숄더 프레스', sets: 3, reps: '10-12', burnfitId: '덤벨-숄더-프레스' },
      ]},
      Wed: { part: 'Lower (하체)', exercises: [
        { name: '고블릿 스쿼트', sets: 4, reps: '12-15', burnfitId: '덤벨-고블릿-스쿼트' },
        { name: '덤벨 런지', sets: 3, reps: '12', burnfitId: '덤벨-런지' },
        { name: '덤벨 데드리프트', sets: 3, reps: '10-12', burnfitId: '덤벨-스티프-레그-데드리프트' },
      ]},
      Fri: { part: 'Full Body', exercises: [
        { name: '덤벨 플로어 프레스', sets: 3, reps: '10-12', note: '벤치 없이 바닥에서' },
        { name: '덤벨 스쿼트', sets: 3, reps: '12-15', burnfitId: '덤벨-스쿼트' },
        { name: '덤벨 컬', sets: 3, reps: '12-15', burnfitId: '덤벨-컬' },
      ]},
    },
  },

  // ==========================================
  // 다이어트 프로그램
  // ==========================================
  {
    programId: 'DIET_3_GYM_BEGINNER',
    targetGoal: 'DIET',
    frequency: 3,
    level: 'beginner',
    hasGymAccess: true,
    description: '체지방 연소를 위한 서킷 트레이닝',
    routines: {
      Mon: { part: 'Full Body Circuit A', exercises: [
        { name: '스쿼트', sets: 3, reps: '15', burnfitId: '바벨-백스쿼트' },
        { name: '벤치프레스 (가볍게)', sets: 3, reps: '12-15', burnfitId: '벤치프레스' },
        { name: '렛풀다운', sets: 3, reps: '12-15', burnfitId: '랫풀다운' },
        { name: '버피', sets: 3, reps: '10', burnfitId: '버피' },
      ]},
      Wed: { part: 'Full Body Circuit B', exercises: [
        { name: '케틀벨 스윙', sets: 4, reps: '20', burnfitId: '케틀벨-스윙' },
        { name: '런지', sets: 3, reps: '15', burnfitId: '런지' },
        { name: '푸시업', sets: 3, reps: 'MAX', burnfitId: '푸시업' },
        { name: '마운틴 클라이머', sets: 3, reps: '30초', burnfitId: '마운틴-클라이머' },
      ]},
      Fri: { part: 'Full Body Circuit C', exercises: [
        { name: '점핑 스쿼트', sets: 3, reps: '15', burnfitId: '점프-스쿼트' },
        { name: '덤벨 로우', sets: 3, reps: '12', burnfitId: '덤벨-로우' },
        { name: '플랭크', sets: 3, reps: '45초', burnfitId: '플랭크' },
        { name: '유산소', sets: 1, reps: '20분', note: '트레드밀 or 바이크' },
      ]},
    },
  },
  {
    programId: 'DIET_4_GYM_INTERMEDIATE',
    targetGoal: 'DIET',
    frequency: 4,
    level: 'intermediate',
    hasGymAccess: true,
    description: '근손실 최소화 다이어트 프로그램',
    routines: {
      Mon: { part: 'Upper + Cardio', exercises: [
        { name: '벤치프레스', sets: 4, reps: '8-10', burnfitId: '벤치프레스' },
        { name: '바벨 로우', sets: 4, reps: '8-10', burnfitId: '바벨-로우' },
        { name: 'HIIT 인터벌', sets: 1, reps: '15분', note: '30초 전력질주 / 30초 휴식' },
      ]},
      Tue: { part: 'Lower + Core', exercises: [
        { name: '스쿼트', sets: 4, reps: '8-10', burnfitId: '바벨-백스쿼트' },
        { name: '레그 컬', sets: 3, reps: '12-15', burnfitId: '레그-컬' },
        { name: '크런치', sets: 3, reps: '20', burnfitId: '크런치' },
        { name: '스테이디 카디오', sets: 1, reps: '20분', note: '심박수 130-140 유지' },
      ]},
      Thu: { part: 'Upper + Cardio', exercises: [
        { name: '오버헤드 프레스', sets: 4, reps: '8-10', burnfitId: '오버헤드-프레스' },
        { name: '렛풀다운', sets: 4, reps: '10-12', burnfitId: '랫풀다운' },
        { name: 'HIIT 인터벌', sets: 1, reps: '15분' },
      ]},
      Fri: { part: 'Lower + Core', exercises: [
        { name: '루마니안 데드리프트', sets: 4, reps: '8-10', burnfitId: '루마니안-데드리프트' },
        { name: '레그 프레스', sets: 3, reps: '12-15', burnfitId: '레그-프레스' },
        { name: '행잉 레그 레이즈', sets: 3, reps: '15', burnfitId: '행잉-레그-레이즈' },
      ]},
    },
  },

  // ==========================================
  // 유지 프로그램
  // ==========================================
  {
    programId: 'MAINTENANCE_3_GYM_BEGINNER',
    targetGoal: 'MAINTENANCE',
    frequency: 3,
    level: 'beginner',
    hasGymAccess: true,
    description: '건강 유지를 위한 균형 잡힌 운동',
    routines: {
      Mon: { part: 'Push', exercises: [
        { name: '벤치프레스', sets: 3, reps: '10-12', burnfitId: '벤치프레스' },
        { name: '숄더 프레스', sets: 3, reps: '10-12', burnfitId: '오버헤드-프레스' },
        { name: '트라이셉스 푸시다운', sets: 3, reps: '12-15', burnfitId: '케이블-푸시-다운' },
      ]},
      Wed: { part: 'Pull', exercises: [
        { name: '렛풀다운', sets: 3, reps: '10-12', burnfitId: '랫풀다운' },
        { name: '시티드 로우', sets: 3, reps: '10-12', burnfitId: '시티드-케이블-로우' },
        { name: '바이셉스 컬', sets: 3, reps: '12-15', burnfitId: '덤벨-컬' },
      ]},
      Fri: { part: 'Legs', exercises: [
        { name: '스쿼트', sets: 3, reps: '10-12', burnfitId: '바벨-백스쿼트' },
        { name: '레그 프레스', sets: 3, reps: '12-15', burnfitId: '레그-프레스' },
        { name: '레그 컬', sets: 3, reps: '12-15', burnfitId: '레그-컬' },
      ]},
    },
  },
  {
    programId: 'MAINTENANCE_4_HOME',
    targetGoal: 'MAINTENANCE',
    frequency: 4,
    level: 'beginner',
    hasGymAccess: false,
    description: '직장인을 위한 홈트레이닝 유지 프로그램',
    routines: {
      Mon: { part: 'Upper Body', exercises: [
        { name: '푸시업', sets: 4, reps: '15-20', burnfitId: '푸시업' },
        { name: '덤벨 로우', sets: 3, reps: '12', burnfitId: '덤벨-로우' },
        { name: '덤벨 숄더 프레스', sets: 3, reps: '12', burnfitId: '덤벨-숄더-프레스' },
      ]},
      Tue: { part: 'Lower Body', exercises: [
        { name: '고블릿 스쿼트', sets: 4, reps: '15', burnfitId: '덤벨-고블릿-스쿼트' },
        { name: '런지', sets: 3, reps: '12', burnfitId: '런지' },
        { name: '글루트 브릿지', sets: 3, reps: '15', burnfitId: '글루트-브릿지' },
      ]},
      Thu: { part: 'Core & Cardio', exercises: [
        { name: '플랭크', sets: 3, reps: '45초', burnfitId: '플랭크' },
        { name: '마운틴 클라이머', sets: 3, reps: '30초', burnfitId: '마운틴-클라이머' },
        { name: '버피', sets: 3, reps: '10', burnfitId: '버피' },
      ]},
      Fri: { part: 'Full Body', exercises: [
        { name: '푸시업', sets: 3, reps: '15', burnfitId: '푸시업' },
        { name: '스쿼트', sets: 3, reps: '20', burnfitId: '에어-스쿼트' },
        { name: '덤벨 데드리프트', sets: 3, reps: '12', burnfitId: '덤벨-스티프-레그-데드리프트' },
      ]},
    },
  },
];

// ============================================
// 식단 데이터베이스
// ============================================

export const DIET_PLANS: DietPlan[] = [
  // ==========================================
  // 벌크업 식단
  // ==========================================
  {
    planId: 'BULK_UP_3000_STANDARD',
    targetCalories: 3000,
    targetGoal: 'BULK_UP',
    tags: ['hardgainer', 'high_protein'],
    lactoseFree: false,
    vegetarian: false,
    description: '벌크업을 위한 고칼로리 식단',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '계란 3개 + 식빵 3장 + 우유 300ml', calories: 650, emoji: '🍳' },
      lunch: { name: '점심 식사', detail: '밥 300g + 닭가슴살 150g + 반찬', calories: 750, emoji: '🍱' },
      snack: { name: '간식', detail: '바나나 2개 + 견과류 50g + 프로틴바', calories: 450, emoji: '🍌' },
      dinner: { name: '저녁 식사', detail: '밥 300g + 고기 200g + 반찬', calories: 800, emoji: '🥩' },
      supplement: { name: '보충제', detail: '프로틴 쉐이크 (우유 베이스)', calories: 350, emoji: '🥤' },
    },
  },
  {
    planId: 'BULK_UP_3000_LACTO_FREE',
    targetCalories: 3000,
    targetGoal: 'BULK_UP',
    tags: ['hardgainer', 'lactose_free'],
    lactoseFree: true,
    vegetarian: false,
    description: '유당불내증을 위한 벌크업 식단',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '계란 3개 + 식빵 3장 + 두유 300ml', calories: 620, emoji: '🍳' },
      lunch: { name: '점심 식사', detail: '밥 300g + 제육볶음 + 계란찜', calories: 750, emoji: '🍱' },
      snack: { name: '간식', detail: '고구마 200g + 바나나 2개 + 떡', calories: 480, emoji: '🍠' },
      dinner: { name: '저녁 식사', detail: '소고기 덮밥 + 닭가슴살 100g', calories: 800, emoji: '🥩' },
      supplement: { name: '보충제', detail: 'WPI 분리유청 + 물 (유당 최소화)', calories: 300, emoji: '🥤' },
    },
  },
  {
    planId: 'BULK_UP_2500_BEGINNER',
    targetCalories: 2500,
    targetGoal: 'BULK_UP',
    tags: ['beginner', 'moderate'],
    lactoseFree: false,
    vegetarian: false,
    description: '점진적 벌크업 식단 (초보자용)',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '계란 2개 + 식빵 2장 + 우유 200ml', calories: 450, emoji: '🍳' },
      lunch: { name: '점심 식사', detail: '밥 250g + 단백질 반찬 + 국', calories: 650, emoji: '🍱' },
      snack: { name: '간식', detail: '바나나 1개 + 프로틴바', calories: 300, emoji: '🍌' },
      dinner: { name: '저녁 식사', detail: '밥 250g + 고기 150g + 야채', calories: 700, emoji: '🥩' },
      supplement: { name: '보충제', detail: '프로틴 쉐이크', calories: 300, emoji: '🥤' },
    },
  },

  // ==========================================
  // 다이어트 식단
  // ==========================================
  {
    planId: 'DIET_1500_LOW_CARB',
    targetCalories: 1500,
    targetGoal: 'DIET',
    tags: ['weight_loss', 'low_carb'],
    lactoseFree: false,
    vegetarian: false,
    description: '체지방 감량을 위한 저탄수화물 식단',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '그릭요거트 150g + 블루베리', calories: 200, emoji: '🥣' },
      lunch: { name: '점심 식사', detail: '현미밥 100g + 닭가슴살 샐러드', calories: 400, emoji: '🥗' },
      snack: { name: '간식', detail: '아몬드 15알 + 삶은 계란 1개', calories: 200, emoji: '🥜' },
      dinner: { name: '저녁 식사', detail: '삶은 계란 2개 + 고구마 100g + 야채', calories: 350, emoji: '🥚' },
      supplement: { name: '보충제', detail: '종합비타민 + 오메가3', calories: 0, emoji: '💊' },
    },
  },
  {
    planId: 'DIET_1800_BALANCED',
    targetCalories: 1800,
    targetGoal: 'DIET',
    tags: ['weight_loss', 'balanced'],
    lactoseFree: false,
    vegetarian: false,
    description: '균형 잡힌 감량 식단',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '오트밀 50g + 우유 + 견과류', calories: 350, emoji: '🥣' },
      lunch: { name: '점심 식사', detail: '현미밥 150g + 생선구이 + 나물', calories: 450, emoji: '🐟' },
      snack: { name: '간식', detail: '사과 1개 + 프로틴바', calories: 250, emoji: '🍎' },
      dinner: { name: '저녁 식사', detail: '닭가슴살 150g + 야채볶음', calories: 400, emoji: '🥗' },
      supplement: { name: '보충제', detail: '프로틴 쉐이크 (물 베이스)', calories: 150, emoji: '🥤' },
    },
  },

  // ==========================================
  // 유지 식단
  // ==========================================
  {
    planId: 'MAINTENANCE_2000_BALANCED',
    targetCalories: 2000,
    targetGoal: 'MAINTENANCE',
    tags: ['office_worker', 'healthy'],
    lactoseFree: false,
    vegetarian: false,
    description: '직장인을 위한 건강 유지 식단',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '식빵 2장 + 계란 1개 + 사과', calories: 350, emoji: '🍞' },
      lunch: { name: '점심 식사', detail: '회사 일반식 (국물 적게)', calories: 600, emoji: '🍱' },
      snack: { name: '간식', detail: '그릭요거트 + 견과류', calories: 200, emoji: '🥜' },
      dinner: { name: '저녁 식사', detail: '현미밥 200g + 생선 + 야채', calories: 550, emoji: '🐟' },
      supplement: { name: '보충제', detail: '종합비타민 + 오메가3', calories: 0, emoji: '💊' },
    },
  },
  {
    planId: 'MAINTENANCE_2200_ACTIVE',
    targetCalories: 2200,
    targetGoal: 'MAINTENANCE',
    tags: ['active', 'moderate_protein'],
    lactoseFree: false,
    vegetarian: false,
    description: '활동적인 생활을 위한 유지 식단',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '오트밀 + 바나나 + 우유', calories: 400, emoji: '🥣' },
      lunch: { name: '점심 식사', detail: '밥 + 고기 반찬 + 국', calories: 650, emoji: '🍱' },
      snack: { name: '간식', detail: '과일 + 프로틴바', calories: 300, emoji: '🍎' },
      dinner: { name: '저녁 식사', detail: '밥 + 닭가슴살 + 야채', calories: 600, emoji: '🥗' },
      supplement: { name: '보충제', detail: '프로틴 쉐이크', calories: 250, emoji: '🥤' },
    },
  },

  // ==========================================
  // 채식 식단
  // ==========================================
  {
    planId: 'VEGETARIAN_2000',
    targetCalories: 2000,
    targetGoal: 'MAINTENANCE',
    tags: ['vegetarian', 'plant_based'],
    lactoseFree: false,
    vegetarian: true,
    description: '채식주의자를 위한 균형 식단',
    menuGuide: {
      breakfast: { name: '아침 식사', detail: '두부 스크램블 + 통밀빵 + 과일', calories: 400, emoji: '🥗' },
      lunch: { name: '점심 식사', detail: '현미밥 + 콩고기 + 나물', calories: 550, emoji: '🍱' },
      snack: { name: '간식', detail: '견과류 + 두유 + 과일', calories: 300, emoji: '🥜' },
      dinner: { name: '저녁 식사', detail: '퀴노아 샐러드 + 두부 스테이크', calories: 500, emoji: '🥗' },
      supplement: { name: '보충제', detail: '비건 프로틴 + B12', calories: 250, emoji: '🌱' },
    },
  },
];

// ============================================
// 프로그램 매칭 알고리즘
// ============================================

export interface MatchedProgram {
  workout: WorkoutProgram | null;
  diet: DietPlan | null;
  calorieInfo: CalorieCalculation;
  goalType: GoalType;
  matchScore: number;
  recommendations: string[];
}

export function matchProgramToUser(profile: UserProfile): MatchedProgram {
  // 1. BMI 계산 및 목표 분류
  const bmi = calculateBMI(profile.currentWeight, profile.height);
  const goalType = classifyGoalByBMI(bmi, profile.goalType);
  
  // 2. 칼로리 계산
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : 25;
  const activityMultiplier = getActivityMultiplier(
    profile.workoutDaysPerWeek,
    profile.lifestyle
  );
  const calorieInfo = calculateCalories(
    profile.currentWeight,
    profile.height,
    age,
    profile.gender || 'male',
    activityMultiplier,
    goalType
  );
  
  // 3. 운동 프로그램 매칭
  const matchedWorkout = findBestWorkoutProgram(
    goalType,
    profile.workoutDaysPerWeek,
    profile.experienceLevel,
    profile.hasGymAccess
  );
  
  // 4. 식단 매칭
  const matchedDiet = findBestDietPlan(
    goalType,
    calorieInfo.targetCalories,
    profile.lactoseIntolerance,
    profile.vegetarian
  );
  
  // 5. 추천사항 생성
  const recommendations = generateRecommendations(profile, goalType, bmi);
  
  return {
    workout: matchedWorkout,
    diet: matchedDiet,
    calorieInfo,
    goalType,
    matchScore: calculateMatchScore(matchedWorkout, matchedDiet, profile),
    recommendations,
  };
}

function findBestWorkoutProgram(
  goal: GoalType,
  frequency: number,
  level: ExperienceLevel,
  hasGymAccess: boolean
): WorkoutProgram | null {
  // 우선순위: 목표 > 빈도 > 헬스장 > 레벨
  let candidates = WORKOUT_PROGRAMS.filter(p => p.targetGoal === goal);
  
  if (candidates.length === 0) {
    candidates = WORKOUT_PROGRAMS.filter(p => p.targetGoal === 'MAINTENANCE');
  }
  
  // 빈도 매칭 (정확히 일치하거나 가장 가까운 것)
  const exactMatch = candidates.find(p => 
    p.frequency === frequency && p.hasGymAccess === hasGymAccess
  );
  if (exactMatch) return exactMatch;
  
  // 헬스장 접근성 우선
  const gymMatch = candidates.filter(p => p.hasGymAccess === hasGymAccess);
  if (gymMatch.length > 0) {
    // 빈도가 가장 가까운 것
    return gymMatch.reduce((prev, curr) => 
      Math.abs(curr.frequency - frequency) < Math.abs(prev.frequency - frequency) 
        ? curr : prev
    );
  }
  
  // 아무거나 반환
  return candidates[0] || null;
}

function findBestDietPlan(
  goal: GoalType,
  targetCalories: number,
  lactoseIntolerance: boolean,
  vegetarian: boolean
): DietPlan | null {
  let candidates = DIET_PLANS.filter(p => p.targetGoal === goal);
  
  if (candidates.length === 0) {
    candidates = DIET_PLANS.filter(p => p.targetGoal === 'MAINTENANCE');
  }
  
  // 채식 필터
  if (vegetarian) {
    const vegCandidates = candidates.filter(p => p.vegetarian);
    if (vegCandidates.length > 0) candidates = vegCandidates;
  }
  
  // 유당 불내증 필터
  if (lactoseIntolerance) {
    const lactoseFreeCandidates = candidates.filter(p => p.lactoseFree);
    if (lactoseFreeCandidates.length > 0) candidates = lactoseFreeCandidates;
  }
  
  // 칼로리가 가장 가까운 것
  return candidates.reduce((prev, curr) => 
    Math.abs(curr.targetCalories - targetCalories) < Math.abs(prev.targetCalories - targetCalories)
      ? curr : prev
  );
}

function calculateMatchScore(
  workout: WorkoutProgram | null,
  diet: DietPlan | null,
  profile: UserProfile
): number {
  let score = 0;
  
  if (workout) {
    if (workout.frequency === profile.workoutDaysPerWeek) score += 30;
    if (workout.hasGymAccess === profile.hasGymAccess) score += 20;
    if (workout.level === profile.experienceLevel) score += 15;
    score += 15; // 목표 매칭
  }
  
  if (diet) {
    if (diet.lactoseFree === profile.lactoseIntolerance) score += 10;
    if (diet.vegetarian === profile.vegetarian) score += 10;
  }
  
  return score;
}

function generateRecommendations(
  profile: UserProfile,
  goal: GoalType,
  bmi: number
): string[] {
  const recommendations: string[] = [];
  
  if (goal === 'BULK_UP') {
    recommendations.push('💪 체중 증가를 위해 매끼 단백질을 챙기세요');
    recommendations.push('🍚 탄수화물 섭취를 두려워하지 마세요');
    if (bmi < 17) {
      recommendations.push('⚠️ BMI가 매우 낮습니다. 의사 상담을 권장합니다');
    }
  } else if (goal === 'DIET') {
    recommendations.push('🥗 야채를 먼저 먹어 포만감을 높이세요');
    recommendations.push('💧 충분한 수분 섭취가 중요합니다');
    if (bmi > 30) {
      recommendations.push('⚠️ 비만 기준입니다. 전문가 상담을 권장합니다');
    }
  } else {
    recommendations.push('⚖️ 균형 잡힌 식단과 규칙적인 운동을 유지하세요');
  }
  
  if (profile.lactoseIntolerance) {
    recommendations.push('🥛 WPI 분리유청 프로틴을 선택하세요');
  }
  
  if (profile.workoutDaysPerWeek >= 5) {
    recommendations.push('😴 충분한 수면(7-8시간)이 회복에 필수입니다');
  }
  
  return recommendations;
}

// ============================================
// 헬퍼 함수들
// ============================================

export function getBurnfitUrl(burnfitId: string): string {
  const encodedName = encodeURIComponent(burnfitId);
  return `https://burnfit.io/라이브러리/${encodedName}/`;
}

export function getGoalTypeLabel(goal: GoalType): string {
  switch (goal) {
    case 'BULK_UP': return '벌크업 💪';
    case 'DIET': return '다이어트 🔥';
    case 'MAINTENANCE': return '유지 ⚖️';
  }
}

export function formatCalories(calories: number): string {
  return `${calories.toLocaleString()}kcal`;
}

