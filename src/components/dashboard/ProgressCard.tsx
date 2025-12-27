'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBar from '@/components/ui/ProgressBar';
import { calculateProgress, calculateWeightChange, triggerHaptic } from '@/lib/utils';
import { GOALS } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { logTodayWeight } from '@/lib/firebase/firestore';

interface ProgressCardProps {
  currentWeight: number;
  targetWeight?: number;
  startWeight?: number;
}

export default function ProgressCard({
  currentWeight,
  targetWeight = GOALS.targetWeight,
  startWeight = GOALS.startWeight,
}: ProgressCardProps) {
  const { user, refreshProfile } = useAuth();
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInput, setWeightInput] = useState(currentWeight.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = calculateProgress(currentWeight, startWeight, targetWeight);
  const weightChange = calculateWeightChange(currentWeight, startWeight);
  const remaining = targetWeight - currentWeight;

  const handleOpenWeightInput = () => {
    setWeightInput(currentWeight.toString());
    setShowWeightInput(true);
    triggerHaptic('light');
  };

  const handleSaveWeight = async () => {
    if (!user || isSubmitting) return;

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight < 20 || weight > 200) {
      alert('올바른 체중을 입력해주세요 (20-200kg)');
      return;
    }

    setIsSubmitting(true);
    try {
      await logTodayWeight(user.uid, weight);
      await refreshProfile();
      setShowWeightInput(false);
      triggerHaptic('success');
    } catch (error) {
      console.error('체중 저장 실패:', error);
      alert('체중 저장에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weightInput) || currentWeight;
    const newWeight = Math.max(20, Math.min(200, current + delta));
    setWeightInput(newWeight.toFixed(1));
    triggerHaptic('light');
  };

  return (
    <>
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
      >
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]" />
        
        {/* 장식 요소들 */}
        <motion.div 
          className="absolute -top-20 -right-20 w-40 h-40 bg-[#C6FF00]/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2] 
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-20 -left-20 w-32 h-32 bg-[#2E7D32]/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.4, 0.3] 
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 p-6">
          {/* 상단: 현재 vs 목표 */}
          <div className="flex justify-between items-start mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-medium">현재 체중</p>
              <motion.button
                onClick={handleOpenWeightInput}
                className="group flex items-baseline gap-2 cursor-pointer hover:bg-white/5 rounded-xl -ml-2 px-2 py-1 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.h2 
                  className="text-6xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                  key={currentWeight}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {currentWeight}
                </motion.h2>
                <span className="text-2xl text-gray-500 font-light">kg</span>
                <motion.span 
                  className="text-xs text-gray-500 group-hover:text-[#C6FF00] transition-colors ml-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✏️
                </motion.span>
              </motion.button>
              <motion.p 
                className={`text-sm mt-2 font-bold flex items-center gap-1 ${
                  Number(weightChange) >= 0 ? 'text-[#C6FF00]' : 'text-red-400'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {Number(weightChange) >= 0 ? '↑' : '↓'} {weightChange}
              </motion.p>
            </motion.div>
            
            <motion.div 
              className="text-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-medium">목표</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] bg-clip-text text-transparent">
                {targetWeight}
                <span className="text-lg text-[#C6FF00]/60 ml-1">kg</span>
              </p>
              <p className="text-gray-500 text-sm mt-2 font-medium">
                {remaining > 0 ? (
                  <span>{remaining.toFixed(1)}kg 남음</span>
                ) : (
                  <motion.span 
                    className="text-[#C6FF00]"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    🎉 목표 달성!
                  </motion.span>
                )}
              </p>
            </motion.div>
          </div>

          {/* 프로그레스 바 */}
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <ProgressBar progress={progress} height="h-6" />
          </motion.div>
          
          {/* 하단: 진행률 표시 */}
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-xs text-gray-500 font-medium">{startWeight}kg</span>
            <motion.span 
              className="px-4 py-1.5 rounded-full bg-[#C6FF00]/20 text-[#C6FF00] text-sm font-bold border border-[#C6FF00]/30"
              animate={{ 
                boxShadow: ["0 0 0 0 rgba(198, 255, 0, 0)", "0 0 0 10px rgba(198, 255, 0, 0)"]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {Math.round(progress)}% 달성
            </motion.span>
            <span className="text-xs text-gray-500 font-medium">{targetWeight}kg</span>
          </motion.div>

          {/* 오늘 체중 기록하기 버튼 */}
          <motion.button
            onClick={handleOpenWeightInput}
            className="w-full mt-5 py-3 rounded-xl bg-white/5 text-gray-300 text-sm font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-lg">⚖️</span>
            오늘 체중 기록하기
          </motion.button>
        </div>
      </motion.section>

      {/* 체중 입력 모달 */}
      <AnimatePresence>
        {showWeightInput && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 배경 오버레이 */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeightInput(false)}
            />

            {/* 모달 컨텐츠 */}
            <motion.div
              className="relative bg-[#0d0d12] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowWeightInput(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>

              <div className="text-center mb-6">
                <motion.div 
                  className="text-5xl mb-3"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚖️
                </motion.div>
                <h3 className="text-xl font-bold text-white">오늘의 체중</h3>
                <p className="text-gray-400 text-sm mt-1">매일 아침 공복에 측정하세요</p>
              </div>

              {/* 체중 입력 */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => adjustWeight(-0.1)}
                    className="w-14 h-14 rounded-2xl bg-white/5 text-white text-2xl border border-white/10 hover:bg-white/10 active:bg-white/20"
                    whileTap={{ scale: 0.9 }}
                  >
                    −
                  </motion.button>

                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-28 h-20 text-center text-4xl font-black bg-white/5 border-2 border-[#C6FF00]/30 rounded-2xl text-white focus:outline-none focus:border-[#C6FF00] transition-colors"
                    step="0.1"
                    min="20"
                    max="200"
                  />

                  <motion.button
                    onClick={() => adjustWeight(0.1)}
                    className="w-14 h-14 rounded-2xl bg-white/5 text-white text-2xl border border-white/10 hover:bg-white/10 active:bg-white/20"
                    whileTap={{ scale: 0.9 }}
                  >
                    +
                  </motion.button>
                </div>
                <span className="text-gray-400 font-medium text-lg">kg</span>
              </div>

              {/* 변화량 표시 */}
              {parseFloat(weightInput) !== currentWeight && (
                <motion.div
                  className="text-center mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className={`text-lg font-bold ${
                    parseFloat(weightInput) > currentWeight ? 'text-[#C6FF00]' : 'text-orange-400'
                  }`}>
                    {parseFloat(weightInput) > currentWeight ? '↑' : '↓'}{' '}
                    {Math.abs(parseFloat(weightInput) - currentWeight).toFixed(1)}kg
                    {parseFloat(weightInput) > currentWeight ? ' 증가' : ' 감소'}
                  </span>
                </motion.div>
              )}

              {/* 저장 버튼 */}
              <motion.button
                onClick={handleSaveWeight}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] text-black font-bold text-lg shadow-lg shadow-[#C6FF00]/20 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <motion.span className="flex items-center justify-center gap-2">
                    <motion.span 
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    저장 중...
                  </motion.span>
                ) : (
                  '💾 체중 기록하기'
                )}
              </motion.button>

              {/* 팁 */}
              <p className="text-center text-gray-500 text-xs mt-4">
                💡 일관된 시간에 측정하면 더 정확해요
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
