'use client';

import { useState } from 'react';
import { useDailyLog } from '@/hooks/useDailyLog';
import { getTodayRoutine, triggerHaptic } from '@/lib/utils';
import { getBurnfitUrl } from '@/lib/constants';
import type { ExerciseData } from '@/lib/constants';

// 운동 파트별 한글 설명
const WORKOUT_INFO: Record<string, { name: string; muscles: string }> = {
  Push: { name: '푸시', muscles: '가슴 / 어깨 / 삼두' },
  Pull: { name: '풀', muscles: '등 / 이두' },
  Legs: { name: '하체', muscles: '허벅지 / 둔근 / 종아리' },
  Rest: { name: '휴식', muscles: '회복의 날' },
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

  const handleToggleExercise = async (exerciseName: string) => {
    triggerHaptic(30);
    await toggleExercise(exerciseName);
  };

  return (
    <section className="bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] p-5 rounded-3xl border border-white/5 shadow-xl animate-slide-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-10 rounded-full ${isRestDay ? 'bg-blue-500' : 'bg-[#2E7D32]'}`} />
          <div>
            <h3 className="text-lg font-bold text-white">오늘의 루틴</h3>
            <p className="text-gray-400 text-sm">{focus}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-1 ${
          isRestDay 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
            : 'bg-[#2E7D32]/20 text-[#4CAF50] border border-[#2E7D32]/30'
        }`}>
          {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          {partInfo.name}
        </div>
      </div>

      {/* 운동 목록 */}
      {isRestDay ? (
        <RestDayContent exercises={exercises} />
      ) : (
        <div className="space-y-2">
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
        </div>
      )}

      {/* 진행 상황 (휴식일 제외) */}
      {!isRestDay && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">오늘 진행률</span>
            <span className={`font-bold text-sm ${
              completedCount === totalCount ? 'text-[#C6FF00]' : 'text-[#4CAF50]'
            }`}>
              {completedCount === totalCount ? '🎉 완료!' : `${completedCount}/${totalCount}`}
            </span>
          </div>
          {/* 미니 프로그레스 바 */}
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#2E7D32] to-[#C6FF00] transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function RestDayContent({ exercises }: { exercises: ExerciseData[] }) {
  return (
    <div className="text-center py-6">
      <div className="text-5xl mb-3 animate-float">😴</div>
      <p className="text-gray-300 font-medium">오늘은 휴식일입니다</p>
      <p className="text-gray-500 text-sm mt-1 mb-4">근육이 성장하는 시간이에요!</p>
      
      {exercises.length > 0 && (
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <p className="text-blue-400 text-sm">
            💡 {exercises[0].name} ({exercises[0].reps}) 추천
          </p>
        </div>
      )}
    </div>
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
  // 임시 지난 기록 (나중에 DB에서 가져올 예정)
  const previousWeight = 30 + index * 5;
  const previousReps = exercise.reps;

  // 번핏 페이지 열기
  const openBurnfit = () => {
    if (exercise.burnfitId) {
      const url = getBurnfitUrl(exercise.burnfitId);
      window.open(url, '_blank', 'noopener,noreferrer');
      triggerHaptic(30);
    }
  };
  
  return (
    <div 
      className={`
        rounded-2xl transition-all duration-300 overflow-hidden
        ${isCompleted 
          ? 'bg-[#2E7D32]/20 border border-[#2E7D32]/30' 
          : 'bg-white/5 border border-transparent hover:bg-white/10'
        }
      `}
    >
      {/* 메인 행 */}
      <div 
        className="flex items-center p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* 체크박스 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          aria-pressed={isCompleted}
          aria-label={`${exercise.name} ${isCompleted ? '완료됨' : ''}`}
          className={`
            w-8 h-8 rounded-lg mr-3 flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${isCompleted 
              ? 'bg-[#2E7D32] text-white' 
              : 'bg-white/10 text-gray-500 hover:bg-white/20'
            }
          `}
        >
          {isCompleted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </button>
        
        {/* 운동 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
              {exercise.name}
            </p>
            {isCompleted && (
              <span className="text-green-400 text-xs">✓</span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            {exercise.sets}세트 × {exercise.reps}
          </p>
        </div>
        
        {/* 화살표 */}
        <svg 
          className={`w-5 h-5 text-gray-600 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* 확장 패널 */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          {/* 노트 */}
          <div className="p-3 bg-black/20 rounded-xl mb-3">
            <p className="text-gray-400 text-sm">💡 {exercise.note}</p>
          </div>
          
          {/* 버튼 그룹 */}
          <div className="flex gap-2 mb-3">
            {/* 운동 방법 보기 버튼 */}
            {exercise.burnfitId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openBurnfit();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 
                           bg-gradient-to-r from-purple-600/20 to-pink-600/20 
                           text-purple-300 rounded-xl text-sm font-medium
                           border border-purple-500/30
                           hover:from-purple-600/30 hover:to-pink-600/30 
                           active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                운동 방법 보기
              </button>
            )}
          </div>
          
          {/* 지난 기록 */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <p className="text-gray-500 text-xs mb-1">지난 기록</p>
              <p className="text-gray-300 font-medium">{previousWeight}kg × {previousReps}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic(30);
                alert(`${previousWeight}kg 복사됨! 오늘은 ${previousWeight + 2.5}kg 도전?`);
              }}
              className="px-3 py-2 text-xs font-bold bg-[#C6FF00]/20 text-[#C6FF00] rounded-lg 
                         hover:bg-[#C6FF00]/30 active:scale-95 transition-all
                         border border-[#C6FF00]/30"
            >
              +2.5kg 💪
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
