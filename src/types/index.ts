// 사용자 프로필 타입
export interface UserProfile {
  id: string;
  height: number;
  currentWeight: number;
  targetWeight: number;
  startWeight: number;
  lactoseIntolerance: boolean;
  startDate: Date;
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
