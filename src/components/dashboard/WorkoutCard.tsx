'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useAuth } from '@/context/AuthContext';
import { getTodayRoutine, triggerHaptic } from '@/lib/utils';
import { getBurnfitUrl } from '@/lib/constants';
import { getLastWorkoutRecord } from '@/lib/firebase/firestore';
import type { ExerciseData } from '@/lib/constants';

// 운동 파트별 한글 설명
const WORKOUT_INFO: Record<string, { name: string; muscles: string; gradient: string }> = {
  Push: { name: '푸시', muscles: '가슴 / 어깨 / 삼두', gradient: 'from-rose-600 to-orange-500' },
  Pull: { name: '풀', muscles: '등 / 이두', gradient: 'from-blue-600 to-cyan-500' },
  Legs: { name: '하체', muscles: '허벅지 / 둔근 / 종아리', gradient: 'from-purple-600 to-pink-500' },
  Rest: { name: '휴식', muscles: '회복의 날', gradient: 'from-slate-600 to-slate-500' },
};

export default function WorkoutCard() {
  const { completedExercises: completedExercisesArray, toggleExercise, loading } = useDailyLog();
  const todayRoutine = getTodayRoutine();
  const { type, focus, exercises } = todayRoutine;
  const partInfo = WORKOUT_INFO[type];
  const isRestDay = type === 'Rest';

  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // 완료 상태 사용
  const completedExercises = new Set(completedExercisesArray);
  const completedCount = completedExercises.size;
  const totalCount = exercises.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggleExercise = async (exerciseName: string) => {
    triggerHaptic(30);
    await toggleExercise(exerciseName);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
    >
      {/* 배경 그라디언트 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${partInfo.gradient} opacity-10`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      <div className="relative p-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <motion.div 
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${partInfo.gradient} flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">
                {isRestDay ? '😴' : type === 'Push' ? '💪' : type === 'Pull' ? '🏋️' : '🦵'}
              </span>
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white">오늘의 루틴</h3>
              <p className="text-gray-400 text-sm">{focus}</p>
            </div>
          </div>
          
          <motion.div 
            className={`px-4 py-2 rounded-2xl font-bold text-sm bg-gradient-to-r ${partInfo.gradient} text-white shadow-lg`}
            whileHover={{ scale: 1.05 }}
          >
            {loading && (
              <motion.span 
                className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}
            {partInfo.name}
          </motion.div>
        </div>

        {/* 운동 목록 */}
        {isRestDay ? (
          <RestDayContent exercises={exercises} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {exercises.map((exercise, index) => (
                <ExerciseItem 
                  key={exercise.name} 
                  exercise={exercise} 
                  index={index}
                  isCompleted={completedExercises.has(exercise.name)}
                  isExpanded={expandedExercise === exercise.name}
                  onToggleComplete={() => handleToggleExercise(exercise.name)}
                  onToggleExpand={() => setExpandedExercise(
                    expandedExercise === exercise.name ? null : exercise.name
                  )}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 진행 상황 (휴식일 제외) */}
        {!isRestDay && (
          <motion.div 
            className="mt-5 pt-4 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-sm font-medium">오늘 진행률</span>
              <motion.span 
                className={`font-bold text-lg ${
                  completedCount === totalCount ? 'text-[#C6FF00]' : 'text-white'
                }`}
                key={completedCount}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {completedCount === totalCount ? '🎉 완료!' : `${completedCount}/${totalCount}`}
              </motion.span>
            </div>
            
            {/* 프로그레스 바 */}
            <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#2E7D32] via-[#4CAF50] to-[#C6FF00] rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {progress > 0 && (
                  <motion.div 
                    className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

function RestDayContent({ exercises }: { exercises: ExerciseData[] }) {
  return (
    <motion.div 
      className="text-center py-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div 
        className="text-6xl mb-4"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        😴
      </motion.div>
      <p className="text-white text-lg font-medium">오늘은 휴식일입니다</p>
      <p className="text-gray-400 text-sm mt-1 mb-5">근육이 성장하는 시간이에요!</p>
      
      {exercises.length > 0 && (
        <motion.div 
          className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-blue-300 text-sm font-medium">
            💡 추천: {exercises[0].name} ({exercises[0].reps})
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

interface ExerciseItemProps {
  exercise: ExerciseData;
  index: number;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleComplete: () => void;
  onToggleExpand: () => void;
}

function ExerciseItem({ 
  exercise, 
  index, 
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpand,
}: ExerciseItemProps) {
  const { user, isOffline } = useAuth();
  const [previousRecord, setPreviousRecord] = useState<{ weight: number; reps: string } | null>(null);

  // 지난 기록 불러오기 (실제 DB에서)
  useEffect(() => {
    const loadPreviousRecord = async () => {
      if (!user || isOffline) return;
      
      try {
        const record = await getLastWorkoutRecord(user.uid, exercise.name);
        if (record) {
          setPreviousRecord({ weight: record.weight, reps: `${record.reps}회` });
        }
      } catch (error) {
        console.debug('지난 기록 로드 실패:', error);
      }
    };

    if (isExpanded) {
      loadPreviousRecord();
    }
  }, [user, isOffline, exercise.name, isExpanded]);

  // 번핏 페이지 열기
  const openBurnfit = () => {
    if (exercise.burnfitId) {
      const url = getBurnfitUrl(exercise.burnfitId);
      window.open(url, '_blank', 'noopener,noreferrer');
      triggerHaptic(30);
    }
  };
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        rounded-2xl overflow-hidden backdrop-blur transition-all duration-300
        ${isCompleted 
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30' 
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
          aria-label={`${exercise.name} ${isCompleted ? '완료됨' : ''}`}
          className={`
            w-10 h-10 rounded-xl mr-4 flex items-center justify-center
            transition-all duration-200 flex-shrink-0 shadow-lg
            ${isCompleted 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }
          `}
        >
          {isCompleted ? (
            <motion.svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </motion.button>
        
        {/* 운동 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium truncate ${isCompleted ? 'text-green-300' : 'text-white'}`}>
              {exercise.name}
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
          <p className="text-gray-500 text-sm mt-0.5">
            {exercise.sets}세트 × {exercise.reps}
          </p>
        </div>
        
        {/* 화살표 */}
        <motion.svg 
          className="w-5 h-5 text-gray-500 flex-shrink-0"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
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
            <div className="px-4 pb-4 space-y-3">
              {/* 노트 */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-gray-300 text-sm">💡 {exercise.note}</p>
              </div>
              
              {/* 버튼 그룹 */}
              <div className="flex gap-2">
                {/* 운동 방법 보기 버튼 */}
                {exercise.burnfitId && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      openBurnfit();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                               bg-gradient-to-r from-violet-600/30 to-purple-600/30 
                               text-violet-300 rounded-xl text-sm font-medium
                               border border-violet-500/30 backdrop-blur
                               hover:from-violet-600/40 hover:to-purple-600/40"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    운동 방법 보기
                  </motion.button>
                )}
              </div>
              
              {/* 지난 기록 */}
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <p className="text-amber-400/70 text-xs mb-1">📊 지난 기록</p>
                  {previousRecord ? (
                    <p className="text-amber-200 font-bold text-lg">
                      {previousRecord.weight}kg × {previousRecord.reps}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">기록 없음 - 첫 도전!</p>
                  )}
                </div>
                {previousRecord && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(30);
                      alert(`${previousRecord.weight}kg 복사됨! 오늘은 ${previousRecord.weight + 2.5}kg 도전?`);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] 
                               text-black rounded-xl shadow-lg shadow-[#C6FF00]/20"
                  >
                    +2.5kg 💪
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
