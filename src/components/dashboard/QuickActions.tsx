'use client';

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-in">
      <ActionButton
        icon="🍚"
        label="식단 기록"
        variant="secondary"
        onClick={() => console.log('식단 기록')}
      />
      <ActionButton
        icon="💪"
        label="운동 시작"
        variant="primary"
        onClick={() => console.log('운동 시작')}
      />
    </div>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

function ActionButton({ icon, label, variant, onClick }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden group
        flex items-center justify-center gap-3
        py-5 rounded-2xl font-bold text-lg
        transition-all duration-300
        active:scale-95 shadow-lg
        ${isPrimary 
          ? 'bg-gradient-to-r from-[#C6FF00] to-[#9EFF00] text-black hover:shadow-[0_0_30px_rgba(198,255,0,0.4)]' 
          : 'bg-gradient-to-r from-[#2E7D32] to-[#388E3C] text-white hover:shadow-[0_0_30px_rgba(46,125,50,0.4)]'
        }
      `}
    >
      {/* 호버 효과 */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${isPrimary 
          ? 'bg-gradient-to-r from-[#D4FF33] to-[#AFFF33]' 
          : 'bg-gradient-to-r from-[#388E3C] to-[#43A047]'
        }
      `} />
      
      {/* 컨텐츠 */}
      <span className="relative z-10 text-2xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

