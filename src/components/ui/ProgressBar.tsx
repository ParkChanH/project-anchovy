'use client';

interface ProgressBarProps {
  progress: number;
  height?: string;
  showGlow?: boolean;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  height = 'h-4',
  showGlow = true,
  animated = true,
}: ProgressBarProps) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`w-full bg-gray-800/80 ${height} rounded-full overflow-hidden backdrop-blur-sm`}>
      <div
        className={`
          h-full rounded-full
          bg-gradient-to-r from-[#2E7D32] via-[#4CAF50] to-[#C6FF00]
          ${animated ? 'transition-all duration-1000 ease-out' : ''}
          ${showGlow ? 'shadow-[0_0_20px_rgba(198,255,0,0.4)]' : ''}
        `}
        style={{ width: `${Math.max(safeProgress, 3)}%` }}
      >
        {/* 반짝이는 효과 */}
        <div className="w-full h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}


