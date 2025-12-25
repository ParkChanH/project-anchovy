import { WorkoutPart } from '@/types';

// 요일 타입
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// 요일 한글 매핑
export const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: '월요일',
  Tue: '화요일',
  Wed: '수요일',
  Thu: '목요일',
  Fri: '금요일',
  Sat: '토요일',
  Sun: '일요일',
};

// 운동 종목 타입 (번핏 URL 추가)
export interface ExerciseData {
  name: string;
  sets: number;
  reps: string;
  note: string;
  completedSets?: number;
  burnfitId?: string; // 번핏 라이브러리 URL ID
}

// 일일 루틴 타입
export interface DailyRoutine {
  type: WorkoutPart;
  focus: string;
  exercises: ExerciseData[];
}

// 번핏 라이브러리 URL 생성
export function getBurnfitUrl(burnfitId: string): string {
  return `https://burnfit.io/라이브러리/${burnfitId}/`;
}

// ============================================
// 🏋️ 주간 운동 루틴 (3분할: Push-Pull-Legs)
// 번핏 라이브러리 ID 포함
// ============================================
export const WEEKLY_ROUTINE: Record<DayOfWeek, DailyRoutine> = {
  Mon: {
    type: 'Push',
    focus: '가슴/어깨/삼두',
    exercises: [
      { 
        name: '벤치 프레스', 
        sets: 4, 
        reps: '8-10', 
        note: '메인 운동, 중량 욕심내기',
        burnfitId: '벤치프레스'
      },
      { 
        name: '오버헤드 프레스', 
        sets: 4, 
        reps: '8-12', 
        note: '서서 수행, 코어 힘주기',
        burnfitId: '오버헤드-프레스'
      },
      { 
        name: '인클라인 덤벨 프레스', 
        sets: 3, 
        reps: '10-12', 
        note: '윗가슴 타겟',
        burnfitId: '인클라인-덤벨-벤치프레스'
      },
      { 
        name: '사이드 레터럴 레이즈', 
        sets: 4, 
        reps: '15-20', 
        note: '가벼운 무게로 자극 위주',
        burnfitId: '덤벨-레터럴-레이즈'
      },
      { 
        name: '케이블 푸쉬 다운', 
        sets: 3, 
        reps: '12-15', 
        note: '삼두 마무리',
        burnfitId: '케이블-푸시-다운'
      },
    ],
  },
  Tue: {
    type: 'Pull',
    focus: '등/이두',
    exercises: [
      { 
        name: '풀업 (턱걸이)', 
        sets: 4, 
        reps: 'MAX', 
        note: '주특기! 자세 집중',
        burnfitId: '풀업'
      },
      { 
        name: '랫 풀 다운', 
        sets: 4, 
        reps: '10-12', 
        note: '광배근 늘려주기',
        burnfitId: '랫풀다운'
      },
      { 
        name: '시티드 케이블 로우', 
        sets: 3, 
        reps: '10-12', 
        note: '등 안쪽 두께감',
        burnfitId: '시티드-케이블-로우'
      },
      { 
        name: '바벨 컬', 
        sets: 4, 
        reps: '10-12', 
        note: '이두근 메인',
        burnfitId: '바벨-컬'
      },
      { 
        name: '해머 컬', 
        sets: 3, 
        reps: '10-12', 
        note: '전완근/이두 바깥쪽',
        burnfitId: '덤벨-해머-컬'
      },
    ],
  },
  Wed: {
    type: 'Legs',
    focus: '하체 전체',
    exercises: [
      { 
        name: '스쿼트', 
        sets: 5, 
        reps: '8-10', 
        note: '★벌크업 필수★ 가장 힘들게',
        burnfitId: '바벨-백스쿼트'
      },
      { 
        name: '레그 프레스', 
        sets: 4, 
        reps: '12-15', 
        note: '발 위치 중간, 깊게 내리기',
        burnfitId: '레그-프레스'
      },
      { 
        name: '레그 익스텐션', 
        sets: 3, 
        reps: '15', 
        note: '허벅지 앞쪽 쥐어짜기',
        burnfitId: '레그-익스텐션'
      },
      { 
        name: '레그 컬', 
        sets: 3, 
        reps: '12-15', 
        note: '허벅지 뒤쪽',
        burnfitId: '레그-컬'
      },
      { 
        name: '플랭크', 
        sets: 3, 
        reps: '1분', 
        note: '코어 강화',
        burnfitId: '플랭크'
      },
    ],
  },
  Thu: {
    type: 'Push',
    focus: '가슴/어깨/삼두 (반복)',
    exercises: [
      { 
        name: '벤치 프레스', 
        sets: 4, 
        reps: '8-10', 
        note: '월요일보다 1kg라도 더!',
        burnfitId: '벤치프레스'
      },
      { 
        name: '덤벨 숄더 프레스', 
        sets: 4, 
        reps: '10-12', 
        note: '앉아서 고립',
        burnfitId: '시티드-덤벨-숄더-프레스'
      },
      { 
        name: '딥스', 
        sets: 3, 
        reps: 'MAX', 
        note: '아랫가슴/삼두',
        burnfitId: '딥스'
      },
      { 
        name: '팩 덱 플라이', 
        sets: 3, 
        reps: '15', 
        note: '가슴 모아주기',
        burnfitId: '펙덱-플라이-머신'
      },
      { 
        name: '트라이셉스 익스텐션', 
        sets: 3, 
        reps: '12', 
        note: '머리 뒤로 넘기기',
        burnfitId: '덤벨-트라이셉-익스텐션'
      },
    ],
  },
  Fri: {
    type: 'Pull',
    focus: '등/이두 (반복)',
    exercises: [
      { 
        name: '풀업', 
        sets: 3, 
        reps: 'MAX', 
        note: '중량 풀업 도전?',
        burnfitId: '풀업'
      },
      { 
        name: '바벨 로우', 
        sets: 4, 
        reps: '8-10', 
        note: '허리 조심, 등 전체 타격',
        burnfitId: '바벨-로우'
      },
      { 
        name: '암 풀 다운', 
        sets: 3, 
        reps: '15', 
        note: '광배근 고립',
        burnfitId: '케이블-암-풀다운'
      },
      { 
        name: '덤벨 컬', 
        sets: 4, 
        reps: '12', 
        note: '한 팔씩 집중',
        burnfitId: '덤벨-컬'
      },
    ],
  },
  Sat: {
    type: 'Rest',
    focus: '적극적 휴식',
    exercises: [
      { 
        name: '가벼운 산책', 
        sets: 1, 
        reps: '30분', 
        note: '소화 촉진',
        burnfitId: '걷기'
      },
    ],
  },
  Sun: {
    type: 'Rest',
    focus: '완전 휴식',
    exercises: [
      { 
        name: '폼롤러 스트레칭', 
        sets: 1, 
        reps: '20분', 
        note: '다음 주 준비'
      },
    ],
  },
};

// ============================================
// 🍽️ 요일별 식단 가이드 (유당불내증 고려)
// ============================================
export interface MealData {
  name: string;
  detail: string;
  calories?: number;
  emoji: string;
}

export interface DailyMealPlan {
  breakfast: MealData;
  lunch: MealData;
  snack: MealData;
  dinner: MealData;
  supplement: MealData;
}

export const WEEKLY_MEAL_PLAN: Record<DayOfWeek, DailyMealPlan> = {
  Mon: {
    breakfast: { name: '미숫가루 라떼', detail: '미숫가루+두유+꿀 2스푼', calories: 400, emoji: '🥛' },
    lunch: { name: '회사 점심', detail: '밥 1.5공기 필수 + 단백질 반찬', calories: 700, emoji: '🍚' },
    snack: { name: '바나나 + 두유', detail: '바나나 2개 + 두유 1팩', calories: 350, emoji: '🍌' },
    dinner: { name: '돼지 목살 구이', detail: '목살 + 밥 + 쌈채소', calories: 800, emoji: '🥩' },
    supplement: { name: 'WPI 프로틴', detail: '분리유청 1스쿱 + 물', calories: 120, emoji: '💪' },
  },
  Tue: {
    breakfast: { name: '에너지 토스트', detail: '식빵 2장 + 땅콩버터/잼', calories: 450, emoji: '🍞' },
    lunch: { name: '회사 점심', detail: '밥 1.5공기 필수 + 단백질 반찬', calories: 700, emoji: '🍚' },
    snack: { name: '편의점 떡', detail: '인절미/경단 (소화 잘됨)', calories: 300, emoji: '🍡' },
    dinner: { name: '찜닭/닭볶음탕', detail: '당면 많이 + 밥 비벼먹기', calories: 850, emoji: '🍗' },
    supplement: { name: 'WPI 프로틴', detail: '분리유청 1스쿱 + 두유', calories: 200, emoji: '💪' },
  },
  Wed: {
    breakfast: { name: '미숫가루 라떼', detail: '미숫가루+두유+꿀 2스푼', calories: 400, emoji: '🥛' },
    lunch: { name: '회사 점심', detail: '밥 1.5공기 필수 + 단백질 반찬', calories: 700, emoji: '🍚' },
    snack: { name: '양갱/에너지바', detail: '달달한 간식으로 에너지 충전', calories: 250, emoji: '🍫' },
    dinner: { name: '🎉 특식: 햄버거', detail: '치킨버거 세트 (콜라→물)', calories: 900, emoji: '🍔' },
    supplement: { name: 'WPI 프로틴', detail: '하체 운동 후 필수!', calories: 120, emoji: '💪' },
  },
  Thu: {
    breakfast: { name: '시리얼', detail: '그래놀라 + 락토프리 우유', calories: 380, emoji: '🥣' },
    lunch: { name: '회사 점심', detail: '밥 1.5공기 필수 + 단백질 반찬', calories: 700, emoji: '🍚' },
    snack: { name: '반숙란 + 바나나', detail: '편의점 반숙란 2개 + 바나나', calories: 300, emoji: '🥚' },
    dinner: { name: '제육볶음', detail: '제육 + 밥 + 계란후라이', calories: 800, emoji: '🍳' },
    supplement: { name: 'WPI 프로틴', detail: '분리유청 1스쿱 + 물', calories: 120, emoji: '💪' },
  },
  Fri: {
    breakfast: { name: '바나나 + 아몬드', detail: '바나나 2개 + 아몬드 한줌', calories: 350, emoji: '🍌' },
    lunch: { name: '회사 점심', detail: '밥 1.5공기 필수 + 단백질 반찬', calories: 700, emoji: '🍚' },
    snack: { name: '초코파이/오예스', detail: '당 충전! 2개까지 OK', calories: 300, emoji: '🍪' },
    dinner: { name: '생선구이', detail: '고등어/삼치 + 된장찌개', calories: 650, emoji: '🐟' },
    supplement: { name: 'WPI 프로틴', detail: '분리유청 1스쿱 + 두유', calories: 200, emoji: '💪' },
  },
  Sat: {
    breakfast: { name: '브런치: 볶음밥', detail: '늦잠 후 볶음밥 + 계란 2개', calories: 600, emoji: '🍳' },
    lunch: { name: '자유식', detail: '원하는 메뉴로!', calories: 700, emoji: '🍽️' },
    snack: { name: '샌드위치', detail: '에그/햄 샌드위치', calories: 400, emoji: '🥪' },
    dinner: { name: '🎉 치팅데이', detail: '피자/치킨 등 먹고싶은 것!', calories: 1000, emoji: '🍕' },
    supplement: { name: '휴식', detail: '오늘은 쉬어도 OK', calories: 0, emoji: '😴' },
  },
  Sun: {
    breakfast: { name: '떡국/죽', detail: '속 편하게 따뜻한 국물', calories: 400, emoji: '🍜' },
    lunch: { name: '자유식', detail: '원하는 메뉴로!', calories: 700, emoji: '🍽️' },
    snack: { name: '고구마 + 두유', detail: '고구마/감자 + 두유', calories: 350, emoji: '🍠' },
    dinner: { name: '수육/보쌈', detail: '다음 주 위해 속 편한 고기', calories: 700, emoji: '🥓' },
    supplement: { name: '휴식', detail: '내일 운동 준비!', calories: 0, emoji: '😴' },
  },
};

// 프로젝트 시작일
export const PROJECT_START_DATE = new Date('2025-12-25');

// 목표 설정
export const GOALS = {
  targetWeight: 60.0,
  startWeight: 53.0,
  weeklyWorkoutTarget: 5,
  dailyMealTarget: 5,
  dailyCalorieTarget: 2800, // 벌크업 목표 칼로리
};

// 유당 경고 키워드
export const LACTOSE_KEYWORDS = [
  '우유', '밀크', 'milk', '라떼', 'latte', '크림', 'cream',
  '치즈', 'cheese', '요거트', 'yogurt', '아이스크림',
];

// 락토프리 대안 제품
export const LACTOSE_FREE_ALTERNATIVES = [
  '매일두유 99.89',
  '아몬드브리즈',
  '소화가 잘되는 우유',
  '오트밀크',
  'WPI 분리유청 프로틴',
];
