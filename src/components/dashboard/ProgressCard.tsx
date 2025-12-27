'use client';

import { motion } from 'framer-motion';
import ProgressBar from '@/components/ui/ProgressBar';
import { calculateProgress, calculateWeightChange } from '@/lib/utils';
import { GOALS } from '@/lib/constants';

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
  const progress = calculateProgress(currentWeight, startWeight, targetWeight);
  const weightChange = calculateWeightChange(currentWeight, startWeight);
  const remaining = targetWeight - currentWeight;

  return (
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
            <div className="flex items-baseline gap-2">
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
            </div>
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
      </div>
    </motion.section>
  );
}
