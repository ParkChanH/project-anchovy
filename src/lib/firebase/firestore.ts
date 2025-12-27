import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// 컬렉션 이름
// ============================================
export const COLLECTIONS = {
  USERS: 'users',
  DAILY_LOGS: 'dailyLogs',
  WORKOUT_RECORDS: 'workoutRecords',
  BODY_PHOTOS: 'bodyPhotos',
};

// ============================================
// 사용자 프로필 (확장됨)
// ============================================
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
  goalType: 'bulk' | 'cut' | 'maintain';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutDaysPerWeek: number;
  
  // 식이 제한
  lactoseIntolerance: boolean;
  vegetarian: boolean;
  allergies: string[];
  
  // 생활 패턴
  lifestyle: 'office' | 'active' | 'student';
  preferredWorkoutTime: 'morning' | 'afternoon' | 'evening';
  hasGymAccess: boolean;
  
  // 시스템 정보
  startDate: Timestamp;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 기본 프로필 값
const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'startDate'> = {
  height: 170,
  currentWeight: 60,
  targetWeight: 65,
  startWeight: 60,
  goalType: 'bulk',
  experienceLevel: 'beginner',
  workoutDaysPerWeek: 3,
  lactoseIntolerance: false,
  vegetarian: false,
  allergies: [],
  lifestyle: 'office',
  preferredWorkoutTime: 'evening',
  hasGymAccess: true,
  onboardingCompleted: false,
};

// undefined 값을 제거하는 유틸리티 함수
function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function createUserProfile(userId: string, data: Partial<UserProfile>) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const cleanData = removeUndefined(data);
  await setDoc(userRef, {
    ...DEFAULT_PROFILE,
    ...cleanData,
    startDate: Timestamp.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as UserProfile;
  }
  return null;
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const cleanData = removeUndefined(data);
  await updateDoc(userRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserWeight(userId: string, weight: number) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    currentWeight: weight,
    updatedAt: serverTimestamp(),
  });
}

export async function completeOnboarding(userId: string, data: Partial<UserProfile>) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const cleanData = removeUndefined(data);
  await updateDoc(userRef, {
    ...cleanData,
    onboardingCompleted: true,
    startDate: Timestamp.now(),
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// 일일 기록 (Daily Logs)
// ============================================
export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD 형식
  weightMeasured?: number;
  dietScore: number; // 0~5
  completedMeals: string[]; // ['breakfast', 'lunch', ...]
  workoutPart: string; // 'Push', 'Pull', 'Legs', 'Rest'
  completedExercises: string[]; // 완료한 운동 이름 배열
  conditionNote?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 오늘 날짜 문자열 생성
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// 일일 기록 ID 생성 (userId_date)
export function getDailyLogId(userId: string, date: string): string {
  return `${userId}_${date}`;
}

// 일일 기록 가져오기 또는 생성
export async function getOrCreateDailyLog(userId: string, date: string = getTodayDateString()): Promise<DailyLog> {
  const logId = getDailyLogId(userId, date);
  const logRef = doc(db, COLLECTIONS.DAILY_LOGS, logId);
  const snapshot = await getDoc(logRef);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as DailyLog;
  }

  // 새로운 일일 기록 생성
  const newLog: Omit<DailyLog, 'id'> = {
    userId: userId,
    date,
    dietScore: 0,
    completedMeals: [],
    workoutPart: '',
    completedExercises: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(logRef, newLog);
  return { id: logId, ...newLog } as DailyLog;
}

// 식단 완료 토글
export async function toggleMealComplete(userId: string, mealType: string): Promise<string[]> {
  const date = getTodayDateString();
  const log = await getOrCreateDailyLog(userId, date);
  const logRef = doc(db, COLLECTIONS.DAILY_LOGS, log.id);

  let completedMeals = [...log.completedMeals];
  
  if (completedMeals.includes(mealType)) {
    completedMeals = completedMeals.filter(m => m !== mealType);
  } else {
    completedMeals.push(mealType);
  }

  await updateDoc(logRef, {
    completedMeals,
    dietScore: completedMeals.length,
    updatedAt: serverTimestamp(),
  });

  return completedMeals;
}

// 운동 완료 토글
export async function toggleExerciseComplete(userId: string, exerciseName: string): Promise<string[]> {
  const date = getTodayDateString();
  const log = await getOrCreateDailyLog(userId, date);
  const logRef = doc(db, COLLECTIONS.DAILY_LOGS, log.id);

  let completedExercises = [...log.completedExercises];
  
  if (completedExercises.includes(exerciseName)) {
    completedExercises = completedExercises.filter(e => e !== exerciseName);
  } else {
    completedExercises.push(exerciseName);
  }

  await updateDoc(logRef, {
    completedExercises,
    updatedAt: serverTimestamp(),
  });

  return completedExercises;
}

// 오늘 체중 기록
export async function logTodayWeight(userId: string, weight: number) {
  const date = getTodayDateString();
  const log = await getOrCreateDailyLog(userId, date);
  const logRef = doc(db, COLLECTIONS.DAILY_LOGS, log.id);

  await updateDoc(logRef, {
    weightMeasured: weight,
    updatedAt: serverTimestamp(),
  });

  // 사용자 프로필의 현재 체중도 업데이트
  await updateUserWeight(userId, weight);
}

// ============================================
// 운동 세부 기록 (Workout Records)
// ============================================
export interface WorkoutRecord {
  id: string;
  userId: string;
  date: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  isPR: boolean;
  createdAt: Timestamp;
}

// 운동 세트 기록 추가
export async function addWorkoutRecord(
  userId: string,
  exerciseName: string,
  setNumber: number,
  weight: number,
  reps: number
): Promise<WorkoutRecord> {
  const date = getTodayDateString();
  const recordId = `${userId}_${date}_${exerciseName}_${setNumber}`;
  const recordRef = doc(db, COLLECTIONS.WORKOUT_RECORDS, recordId);

  // PR 체크: 같은 운동의 이전 최고 기록과 비교
  const isPR = await checkIfPR(userId, exerciseName, weight, reps);

  const record: Omit<WorkoutRecord, 'id'> = {
    userId: userId,
    date,
    exerciseName,
    setNumber,
    weight,
    reps,
    isPR,
    createdAt: Timestamp.now(),
  };

  await setDoc(recordRef, record);
  return { id: recordId, ...record };
}

// PR 체크
async function checkIfPR(userId: string, exerciseName: string, weight: number, reps: number): Promise<boolean> {
  const recordsRef = collection(db, COLLECTIONS.WORKOUT_RECORDS);
  const q = query(
    recordsRef,
    where('userId', '==', userId),
    where('exerciseName', '==', exerciseName),
    orderBy('weight', 'desc')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return true; // 첫 기록이면 PR

  const maxWeight = snapshot.docs[0].data().weight;
  return weight > maxWeight;
}

// 특정 운동의 최근 기록 가져오기
export async function getLastWorkoutRecord(
  userId: string,
  exerciseName: string
): Promise<WorkoutRecord | null> {
  const recordsRef = collection(db, COLLECTIONS.WORKOUT_RECORDS);
  const q = query(
    recordsRef,
    where('userId', '==', userId),
    where('exerciseName', '==', exerciseName),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as WorkoutRecord;
}

// ============================================
// 월간 기록 조회 (인덱스 불필요한 버전)
// ============================================
export async function getMonthlyLogs(userId: string, year: number, month: number): Promise<DailyLog[]> {
  // 해당 월의 모든 기록을 가져옴 (문서 ID로 직접 조회)
  const logsRef = collection(db, COLLECTIONS.DAILY_LOGS);
  const q = query(
    logsRef,
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyLog));
  
  // 클라이언트에서 월별 필터링
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  return allLogs.filter(log => log.date.startsWith(monthStr));
}

// 주간 기록 조회
export async function getWeeklyLogs(userId: string): Promise<DailyLog[]> {
  const logsRef = collection(db, COLLECTIONS.DAILY_LOGS);
  const q = query(
    logsRef,
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyLog));
  
  // 클라이언트에서 최근 7일 필터링
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  
  return allLogs.filter(log => log.date >= weekAgoStr).sort((a, b) => b.date.localeCompare(a.date));
}

// ============================================
// 주간 분석 데이터 생성
// ============================================
export interface WeeklyStats {
  totalWorkouts: number;
  totalMeals: number;
  avgDietScore: number;
  weightChange: number;
  completionRate: number;
  logs: DailyLog[];
}

export async function getWeeklyStats(userId: string): Promise<WeeklyStats> {
  const logs = await getWeeklyLogs(userId);
  const profile = await getUserProfile(userId);
  
  const totalWorkouts = logs.filter(log => log.completedExercises.length > 0).length;
  const totalMeals = logs.reduce((sum, log) => sum + log.completedMeals.length, 0);
  const avgDietScore = logs.length > 0 
    ? logs.reduce((sum, log) => sum + log.dietScore, 0) / logs.length 
    : 0;
  
  // 체중 변화 계산
  const logsWithWeight = logs.filter(log => log.weightMeasured);
  let weightChange = 0;
  if (logsWithWeight.length >= 2) {
    const sortedLogs = logsWithWeight.sort((a, b) => a.date.localeCompare(b.date));
    const firstWeight = sortedLogs[0].weightMeasured!;
    const lastWeight = sortedLogs[sortedLogs.length - 1].weightMeasured!;
    weightChange = lastWeight - firstWeight;
  }
  
  // 완료율 계산 (주 목표 일수 기준)
  const targetDays = profile?.workoutDaysPerWeek || 5;
  const completionRate = (totalWorkouts / targetDays) * 100;
  
  return {
    totalWorkouts,
    totalMeals,
    avgDietScore,
    weightChange,
    completionRate: Math.min(completionRate, 100),
    logs,
  };
}
