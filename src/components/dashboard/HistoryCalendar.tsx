'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getMonthlyLogs, DailyLog } from '@/lib/firebase/firestore';
import { useDailyLog } from '@/hooks/useDailyLog';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HistoryCalendar() {
  const { user, isOffline } = useAuth();
  const { completedMeals, completedExercises } = useDailyLog(); // 오늘 기록
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // 기록 불러오기 (월별)
  useEffect(() => {
    const fetchLogs = async () => {
      if (!user || isOffline) return;
      
      setLoading(true);
      try {
        const monthlyLogs = await getMonthlyLogs(
          user.uid, 
          currentMonth.getFullYear(), 
          currentMonth.getMonth()
        );
        setLogs(monthlyLogs);
      } catch (error) {
        console.error('기록 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user, isOffline, currentMonth]);

  // 해당 날짜의 기록 찾기
  const getLogForDate = (date: Date): DailyLog | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // 오늘이면 실시간 데이터 사용
    if (isToday(date)) {
      return {
        id: 'today',
        oderId: user?.uid || 'local',
        userId: user?.uid || 'local',
        date: dateStr,
        dietScore: completedMeals.length,
        completedMeals: completedMeals,
        workoutPart: '',
        completedExercises: completedExercises,
        createdAt: null as any,
        updatedAt: null as any,
      } as DailyLog;
    }
    
    return logs.find(log => log.date === dateStr);
  };

  // 달력 날짜 생성
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // 첫 주 시작 요일까지 빈 칸 추가
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // 선택된 날짜의 기록
  const selectedLog = selectedDate ? getLogForDate(selectedDate) : null;

  return (
    <section className="bg-gradient-to-br from-[#1e1e1e] to-[#252525] p-5 rounded-3xl border border-white/5 shadow-xl animate-slide-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-10 rounded-full bg-purple-500" />
          <div>
            <h3 className="text-lg font-bold text-white">기록 캘린더</h3>
            <p className="text-gray-400 text-sm">지난 기록 확인</p>
          </div>
        </div>
        
        {/* 월 네비게이션 */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ←
          </button>
          <span className="text-white font-medium min-w-[80px] text-center">
            {format(currentMonth, 'yyyy.MM', { locale: ko })}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div 
            key={day} 
            className={`text-center text-xs font-medium py-2 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 빈 칸 */}
        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        
        {/* 날짜 */}
        {days.map((day) => {
          const log = getLogForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasLog = log && (log.completedMeals.length > 0 || log.completedExercises.length > 0);
          const mealScore = log?.completedMeals.length || 0;
          const exerciseCount = log?.completedExercises.length || 0;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center
                transition-all duration-200 relative
                ${isToday(day) ? 'ring-2 ring-[#C6FF00]' : ''}
                ${isSelected ? 'bg-purple-500/30 scale-105' : 'hover:bg-white/10'}
                ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
              `}
            >
              <span className={`text-sm ${isToday(day) ? 'text-[#C6FF00] font-bold' : 'text-white'}`}>
                {format(day, 'd')}
              </span>
              
              {/* 기록 표시 */}
              {hasLog && (
                <div className="flex gap-0.5 mt-0.5">
                  {mealScore >= 3 && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  {exerciseCount >= 3 && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-white/5 rounded-xl animate-fade-in">
          <p className="text-white font-medium mb-2">
            {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
          </p>
          
          {selectedLog ? (
            <div className="space-y-2">
              {/* 식단 */}
              <div className="flex items-center gap-2">
                <span className="text-orange-400">🍽️</span>
                <span className="text-gray-400 text-sm">
                  식단 {selectedLog.completedMeals.length}/5 완료
                </span>
                {selectedLog.completedMeals.length >= 4 && (
                  <span className="text-green-400 text-xs">✓ 훌륭해요!</span>
                )}
              </div>
              
              {/* 운동 */}
              <div className="flex items-center gap-2">
                <span className="text-green-400">💪</span>
                <span className="text-gray-400 text-sm">
                  운동 {selectedLog.completedExercises.length}개 완료
                </span>
              </div>
              
              {/* 체중 */}
              {selectedLog.weightMeasured && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">⚖️</span>
                  <span className="text-gray-400 text-sm">
                    체중 {selectedLog.weightMeasured}kg
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">기록이 없습니다</p>
          )}
        </div>
      )}

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-gray-500 text-xs">식단 3끼+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-500 text-xs">운동 3개+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C6FF00]" />
          <span className="text-gray-500 text-xs">오늘</span>
        </div>
      </div>
    </section>
  );
}

