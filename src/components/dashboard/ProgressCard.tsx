'use client';

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
    <section className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in">
      {/* 배경 장식 */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C6FF00]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#2E7D32]/20 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        {/* 상단: 현재 vs 목표 */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">현재 체중</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {currentWeight}
              </h2>
              <span className="text-2xl text-gray-400 font-light">kg</span>
            </div>
            <p className={`text-sm mt-1 font-medium ${Number(weightChange) >= 0 ? 'text-[#C6FF00]' : 'text-red-400'}`}>
              {weightChange}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">목표</p>
            <p className="text-3xl font-bold text-[#C6FF00]">{targetWeight}<span className="text-lg">kg</span></p>
            <p className="text-gray-500 text-sm mt-1">
              {remaining > 0 ? `${remaining.toFixed(1)}kg 남음` : '🎉 목표 달성!'}
            </p>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="mb-3">
          <ProgressBar progress={progress} height="h-5" />
        </div>
        
        {/* 하단: 진행률 표시 */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{startWeight}kg</span>
          <span className="text-sm font-bold text-[#C6FF00]">{Math.round(progress)}% 달성</span>
          <span className="text-xs text-gray-500">{targetWeight}kg</span>
        </div>
      </div>
    </section>
  );
}

