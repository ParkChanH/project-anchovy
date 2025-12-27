'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getMonthlyLogs, DailyLog } from '@/lib/firebase/firestore';
import { useDailyLog } from '@/hooks/useDailyLog';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HistoryCalendar() {
  const { user, isOffline } = useAuth();
  const { completedMeals, completedExercises } = useDailyLog();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [, setLoading] = useState(false);

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

  const getLogForDate = (date: Date): DailyLog | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (isToday(date)) {
      return {
        id: 'today',
        userId: user?.uid || 'local',
        date: dateStr,
        dietScore: completedMeals.length,
        completedMeals: completedMeals,
        workoutPart: '',
        completedExercises: completedExercises,
        createdAt: null as unknown as import('firebase/firestore').Timestamp,
        updatedAt: null as unknown as import('firebase/firestore').Timestamp,
      } as DailyLog;
    }
    
    return logs.find(log => log.date === dateStr);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const selectedLog = selectedDate ? getLogForDate(selectedDate) : null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
    >
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-fuchsia-600/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      <div className="relative p-3 sm:p-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.div 
              className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <span className="text-lg sm:text-2xl">📅</span>
            </motion.div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-white">기록 캘린더</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm">지난 기록 확인</p>
            </div>
          </div>
          
          {/* 월 네비게이션 */}
          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              onClick={prevMonth}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white text-sm sm:text-base"
            >
              ←
            </motion.button>
            <span className="text-white font-bold min-w-[70px] sm:min-w-[100px] text-center text-xs sm:text-lg">
              {format(currentMonth, 'yyyy.MM', { locale: ko })}
            </span>
            <motion.button
              onClick={nextMonth}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white text-sm sm:text-base"
            >
              →
            </motion.button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-3">
          {WEEKDAYS.map((day, i) => (
            <div 
              key={day} 
              className={`text-center text-[10px] sm:text-xs font-bold py-1 sm:py-2 rounded-md sm:rounded-lg ${
                i === 0 ? 'text-red-400 bg-red-500/10' : 
                i === 6 ? 'text-blue-400 bg-blue-500/10' : 
                'text-gray-400 bg-white/5'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          
          {days.map((day, index) => {
            const log = getLogForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasLog = log && (log.completedMeals.length > 0 || log.completedExercises.length > 0);
            const mealScore = log?.completedMeals.length || 0;
            const exerciseCount = log?.completedExercises.length || 0;
            const isPerfect = mealScore >= 4 && exerciseCount >= 3;
            
            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center
                  transition-all duration-200 relative backdrop-blur min-w-0
                  ${isToday(day) ? 'ring-1 sm:ring-2 ring-[#C6FF00] shadow-lg shadow-[#C6FF00]/20' : ''}
                  ${isSelected ? 'bg-violet-500/40 scale-105' : 'hover:bg-white/10'}
                  ${isPerfect ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20' : ''}
                  ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                `}
              >
                <span className={`text-[11px] sm:text-sm font-medium leading-none ${
                  isToday(day) ? 'text-[#C6FF00] font-bold' : 
                  isPerfect ? 'text-yellow-300' :
                  'text-white'
                }`}>
                  {format(day, 'd')}
                </span>
                
                {hasLog && (
                  <div className="flex gap-0.5 mt-0.5 sm:mt-1">
                    {mealScore >= 3 && (
                      <motion.span 
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                    {exerciseCount >= 3 && (
                      <motion.span 
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </div>
                )}
                
                {isPerfect && (
                  <motion.span 
                    className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-[8px] sm:text-xs"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    ⭐
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 선택된 날짜 상세 */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur">
                <p className="text-white font-bold mb-3 text-lg">
                  {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
                </p>
                
                {selectedLog ? (
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-xl"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <span className="text-2xl">🍽️</span>
                      <div className="flex-1">
                        <p className="text-orange-300 font-medium">식단</p>
                        <p className="text-gray-400 text-sm">
                          {selectedLog.completedMeals.length}/5 완료
                        </p>
                      </div>
                      {selectedLog.completedMeals.length >= 4 && (
                        <span className="text-green-400 text-sm font-medium">✓ 훌륭!</span>
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <span className="text-2xl">💪</span>
                      <div className="flex-1">
                        <p className="text-green-300 font-medium">운동</p>
                        <p className="text-gray-400 text-sm">
                          {selectedLog.completedExercises.length}개 완료
                        </p>
                      </div>
                    </motion.div>
                    
                    {selectedLog.weightMeasured && (
                      <motion.div 
                        className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="text-2xl">⚖️</span>
                        <div className="flex-1">
                          <p className="text-blue-300 font-medium">체중</p>
                          <p className="text-gray-400 text-sm">
                            {selectedLog.weightMeasured}kg
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">📭 기록이 없습니다</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-orange-400" />
            <span className="text-gray-400 text-[9px] sm:text-xs font-medium whitespace-nowrap">식단 3끼+</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400" />
            <span className="text-gray-400 text-[9px] sm:text-xs font-medium whitespace-nowrap">운동 3개+</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-sm">⭐</span>
            <span className="text-gray-400 text-[9px] sm:text-xs font-medium whitespace-nowrap">완벽한 날</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
