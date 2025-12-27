'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { completeOnboarding } from '@/lib/firebase/firestore';

interface OnboardingData {
  nickname: string;
  gender: 'male' | 'female';
  birthYear: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  goalType: 'bulk' | 'cut' | 'maintain';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutDaysPerWeek: number;
  lactoseIntolerance: boolean;
  vegetarian: boolean;
  lifestyle: 'office' | 'active' | 'student';
  preferredWorkoutTime: 'morning' | 'afternoon' | 'evening';
  hasGymAccess: boolean;
}

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    nickname: profile?.nickname || '',
    gender: 'male',
    birthYear: 1995,
    height: 170,
    currentWeight: 60,
    targetWeight: 65,
    goalType: 'bulk',
    experienceLevel: 'beginner',
    workoutDaysPerWeek: 3,
    lactoseIntolerance: false,
    vegetarian: false,
    lifestyle: 'office',
    preferredWorkoutTime: 'evening',
    hasGymAccess: true,
  });

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await completeOnboarding(user.uid, {
        nickname: data.nickname,
        gender: data.gender,
        birthYear: data.birthYear,
        height: data.height,
        currentWeight: data.currentWeight,
        targetWeight: data.targetWeight,
        startWeight: data.currentWeight,
        goalType: data.goalType,
        experienceLevel: data.experienceLevel,
        workoutDaysPerWeek: data.workoutDaysPerWeek,
        lactoseIntolerance: data.lactoseIntolerance,
        vegetarian: data.vegetarian,
        allergies: [],
        lifestyle: data.lifestyle,
        preferredWorkoutTime: data.preferredWorkoutTime,
        hasGymAccess: data.hasGymAccess,
      });
      
      await refreshProfile();
      router.push('/');
    } catch (error) {
      console.error('온보딩 완료 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-white mb-2">안녕하세요!</h2>
              <p className="text-gray-400">먼저 기본 정보를 알려주세요</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">닉네임</label>
              <input
                type="text"
                value={data.nickname}
                onChange={(e) => updateData('nickname', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)]"
                placeholder="닉네임을 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">성별</label>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => updateData('gender', g)}
                    className={`py-4 rounded-lg font-medium transition-all ${
                      data.gender === g
                        ? 'bg-[var(--primary)] text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {g === 'male' ? '👨 남성' : '👩 여성'}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">출생년도</label>
              <input
                type="number"
                value={data.birthYear}
                onChange={(e) => updateData('birthYear', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)]"
                min={1950}
                max={2010}
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">📏</div>
              <h2 className="text-2xl font-bold text-white mb-2">신체 정보</h2>
              <p className="text-gray-400">정확한 목표 설정을 위해 필요해요</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">키 (cm)</label>
              <input
                type="number"
                value={data.height}
                onChange={(e) => updateData('height', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">현재 체중 (kg)</label>
              <input
                type="number"
                value={data.currentWeight}
                onChange={(e) => updateData('currentWeight', parseFloat(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-[var(--primary)]"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">목표 체중 (kg)</label>
              <input
                type="number"
                value={data.targetWeight}
                onChange={(e) => updateData('targetWeight', parseFloat(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-[var(--primary)]"
                step="0.1"
              />
              <p className="text-center text-sm text-gray-500 mt-2">
                {data.targetWeight > data.currentWeight 
                  ? `+${(data.targetWeight - data.currentWeight).toFixed(1)}kg 증량 목표` 
                  : data.targetWeight < data.currentWeight 
                    ? `${(data.currentWeight - data.targetWeight).toFixed(1)}kg 감량 목표`
                    : '체중 유지 목표'}
              </p>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-white mb-2">운동 목표</h2>
              <p className="text-gray-400">목표에 맞는 루틴을 추천해드릴게요</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">목표 유형</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'bulk', label: '벌크업', emoji: '💪' },
                  { value: 'cut', label: '다이어트', emoji: '🔥' },
                  { value: 'maintain', label: '유지', emoji: '⚖️' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateData('goalType', option.value as 'bulk' | 'cut' | 'maintain')}
                    className={`py-4 rounded-lg font-medium transition-all flex flex-col items-center ${
                      data.goalType === option.value
                        ? 'bg-[var(--primary)] text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">운동 경험</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'beginner', label: '초급', desc: '~6개월' },
                  { value: 'intermediate', label: '중급', desc: '6개월~2년' },
                  { value: 'advanced', label: '고급', desc: '2년+' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateData('experienceLevel', option.value as 'beginner' | 'intermediate' | 'advanced')}
                    className={`py-4 rounded-lg font-medium transition-all flex flex-col items-center ${
                      data.experienceLevel === option.value
                        ? 'bg-[var(--primary)] text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-sm font-bold">{option.label}</span>
                    <span className="text-xs opacity-70">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">주 운동 횟수</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => updateData('workoutDaysPerWeek', Math.max(2, data.workoutDaysPerWeek - 1))}
                  className="w-12 h-12 rounded-full bg-gray-800 text-white text-xl hover:bg-gray-700"
                >
                  -
                </button>
                <span className="text-4xl font-bold text-[var(--primary)]">
                  {data.workoutDaysPerWeek}
                </span>
                <button
                  onClick={() => updateData('workoutDaysPerWeek', Math.min(7, data.workoutDaysPerWeek + 1))}
                  className="w-12 h-12 rounded-full bg-gray-800 text-white text-xl hover:bg-gray-700"
                >
                  +
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">일/주</p>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🥗</div>
              <h2 className="text-2xl font-bold text-white mb-2">식이 제한</h2>
              <p className="text-gray-400">맞춤 식단을 위해 알려주세요</p>
            </div>
            
            <div className="space-y-3">
              {[
                { key: 'lactoseIntolerance', label: '유당불내증', emoji: '🥛', desc: '우유 소화가 어려워요' },
                { key: 'vegetarian', label: '채식주의', emoji: '🥬', desc: '육류를 먹지 않아요' },
                { key: 'hasGymAccess', label: '헬스장 이용', emoji: '🏋️', desc: '헬스장에 다니고 있어요' },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => updateData(option.key as keyof OnboardingData, !data[option.key as keyof OnboardingData])}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${
                    data[option.key as keyof OnboardingData]
                      ? 'bg-[var(--primary)]/20 border-2 border-[var(--primary)]'
                      : 'bg-gray-800 border-2 border-gray-700'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.desc}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    data[option.key as keyof OnboardingData]
                      ? 'bg-[var(--primary)] border-[var(--primary)]'
                      : 'border-gray-500'
                  }`}>
                    {data[option.key as keyof OnboardingData] && (
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">⏰</div>
              <h2 className="text-2xl font-bold text-white mb-2">생활 패턴</h2>
              <p className="text-gray-400">마지막으로 일상을 알려주세요</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">직업/생활</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'office', label: '직장인', emoji: '💼' },
                  { value: 'student', label: '학생', emoji: '📚' },
                  { value: 'active', label: '활동적', emoji: '🏃' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateData('lifestyle', option.value as 'office' | 'active' | 'student')}
                    className={`py-4 rounded-lg font-medium transition-all flex flex-col items-center ${
                      data.lifestyle === option.value
                        ? 'bg-[var(--primary)] text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">선호 운동 시간</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'morning', label: '아침', emoji: '🌅', time: '6-12시' },
                  { value: 'afternoon', label: '오후', emoji: '☀️', time: '12-18시' },
                  { value: 'evening', label: '저녁', emoji: '🌙', time: '18-24시' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateData('preferredWorkoutTime', option.value as 'morning' | 'afternoon' | 'evening')}
                    className={`py-4 rounded-lg font-medium transition-all flex flex-col items-center ${
                      data.preferredWorkoutTime === option.value
                        ? 'bg-[var(--primary)] text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                    <span className="text-xs opacity-70">{option.time}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 요약 */}
            <div className="bg-gray-800/50 rounded-lg p-4 mt-6">
              <h3 className="text-sm text-gray-400 mb-3">입력 정보 요약</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">닉네임</div>
                <div className="text-white text-right">{data.nickname || '미입력'}</div>
                <div className="text-gray-400">체중 목표</div>
                <div className="text-white text-right">{data.currentWeight}kg → {data.targetWeight}kg</div>
                <div className="text-gray-400">주 운동</div>
                <div className="text-white text-right">{data.workoutDaysPerWeek}회</div>
                <div className="text-gray-400">목표</div>
                <div className="text-white text-right">
                  {data.goalType === 'bulk' ? '벌크업' : data.goalType === 'cut' ? '다이어트' : '유지'}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* 진행률 바 */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Step {step} / {TOTAL_STEPS}</span>
          {step > 1 && (
            <button onClick={handleBack} className="text-gray-400 text-sm">
              ← 이전
            </button>
          )}
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 p-6 overflow-auto">
        {renderStep()}
      </div>

      {/* 하단 버튼 */}
      <div className="p-6 bg-gradient-to-t from-[var(--background)] to-transparent">
        {step < TOTAL_STEPS ? (
          <button
            onClick={handleNext}
            className="w-full bg-[var(--primary)] text-black font-bold py-4 rounded-xl text-lg hover:bg-[var(--accent)] transition-colors"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-black font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '저장 중...' : '🚀 시작하기'}
          </button>
        )}
      </div>
    </div>
  );
}

