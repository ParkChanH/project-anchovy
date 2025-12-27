// 사용자 프로필 타입 (확장됨 - 다중 사용자 지원)
export interface UserProfile {
  id: string;
  // 기본 정보
  nickname?: string;
  email?: string;
  photoUrl?: string;
  
  // 신체 정보
  height: number;
  currentWeight: number;
  targetWeight: number;
  startWeight: number;
  gender?: 'male' | 'female';
  birthYear?: number;
  
  // 목표 설정
  goalType: 'bulk' | 'cut' | 'maintain'; // 벌크업/다이어트/유지
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'; // 운동 경험
  workoutDaysPerWeek: number; // 주 운동 횟수 (3~6)
  
  // 식이 제한
  lactoseIntolerance: boolean;
  vegetarian: boolean;
  allergies: string[]; // 알레르기 목록
  
  // 생활 패턴
  lifestyle: 'office' | 'active' | 'student'; // 직장인/활동적/학생
  preferredWorkoutTime: 'morning' | 'afternoon' | 'evening'; // 선호 운동 시간
  hasGymAccess: boolean; // 헬스장 접근 가능
  
  // 시스템 정보
  startDate: Date;
  onboardingCompleted: boolean; // 온보딩 완료 여부
  createdAt?: Date;
  updatedAt?: Date;
}

// 온보딩 단계 타입
export interface OnboardingData {
  step: number;
  nickname: string;
  gender: 'male' | 'female';
  birthYear: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  goalType: 'bulk' | 'cut' | 'maintain';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutDaysPerWeek: number;
  lactoseIntolerance: boolean;
  vegetarian: boolean;
  allergies: string[];
  lifestyle: 'office' | 'active' | 'student';
  preferredWorkoutTime: 'morning' | 'afternoon' | 'evening';
  hasGymAccess: boolean;
}

// 일일 기록 타입 (트레이너 피드백 반영)
export interface DailyLog {
  id: string;
  userId: string;
  date: Date;
  weightMeasured?: number;
  dietScore: number; // 0~5 끼니 점수 (Enum에서 변경)
  workoutPart: WorkoutPart;
  bodyPhotoUrl?: string; // 눈바디 사진 URL
  conditionNote?: string; // 컨디션 메모
  createdAt: Date;
}

// 운동 파트 타입
export type WorkoutPart = 'Push' | 'Pull' | 'Legs' | 'Rest';

// 운동 기록 타입 (PR 추가)
export interface WorkoutRecord {
  id: string;
  logId: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  isPR: boolean; // Personal Record 달성 여부
  createdAt: Date;
}

// 지난 운동 기록 타입 (점진적 과부하용)
export interface PreviousRecord {
  date: Date;
  weight: number;
  reps: number;
  isPR: boolean;
}

// 식단 슬롯 타입
export interface MealSlot {
  id: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supplement';
  label: string;
  icon: string;
  completed: boolean;
  time?: string;
  calories?: number; // 예상 칼로리
}

// 운동 종목 타입 (지난 기록 추가)
export interface Exercise {
  name: string;
  sets: number;
  completedSets: number;
  previousRecord?: PreviousRecord; // 지난주 기록
}

// 눈바디 사진 타입
export interface BodyPhoto {
  id: string;
  userId: string;
  date: Date;
  photoUrl: string;
  weight?: number;
  note?: string;
}

// 식단 점수 레벨
export type DietScoreLevel = {
  score: number;
  label: string;
  color: string;
  emoji: string;
};

export const DIET_SCORE_LEVELS: DietScoreLevel[] = [
  { score: 0, label: '시작이 반!', color: '#ef4444', emoji: '😢' },
  { score: 1, label: '조금 더!', color: '#f97316', emoji: '😕' },
  { score: 2, label: '절반 왔어요', color: '#eab308', emoji: '😐' },
  { score: 3, label: '좋아요!', color: '#84cc16', emoji: '🙂' },
  { score: 4, label: '거의 완벽!', color: '#22c55e', emoji: '😊' },
  { score: 5, label: '퍼펙트! 💪', color: '#C6FF00', emoji: '🔥' },
];

// 주간 분석 리포트 타입
export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  totalWorkouts: number;
  totalMeals: number;
  avgDietScore: number;
  weightChange: number;
  completionRate: number; // 목표 달성률
  prCount: number; // PR 달성 수
  recommendations: string[]; // 다음 주 추천사항
}
