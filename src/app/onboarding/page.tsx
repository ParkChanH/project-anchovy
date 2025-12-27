'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { completeOnboarding, UserProfile } from '@/lib/firebase/firestore';
import { 
  matchProgramToUser, 
  calculateBMI, 
  getGoalTypeLabel,
  formatCalories,
  MatchedProgram 
} from '@/lib/programDatabase';

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

const TOTAL_STEPS = 6;

const STEP_INFO = [
  { emoji: '👋', title: '안녕하세요!', subtitle: '먼저 기본 정보를 알려주세요' },
  { emoji: '📏', title: '신체 정보', subtitle: '정확한 목표 설정을 위해 필요해요' },
  { emoji: '🎯', title: '운동 목표', subtitle: '목표에 맞는 루틴을 추천해드릴게요' },
  { emoji: '🥗', title: '식이 제한', subtitle: '맞춤 식단을 위해 알려주세요' },
  { emoji: '⏰', title: '생활 패턴', subtitle: '일상에 맞는 프로그램을 찾아볼게요' },
  { emoji: '✨', title: '맞춤 프로그램', subtitle: '당신만을 위한 프로그램이에요!' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  
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

  // 프로그램 매칭 계산
  const matchedProgram: MatchedProgram = useMemo(() => {
    const tempProfile: UserProfile = {
      id: 'temp',
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
      gender: data.gender,
      birthYear: data.birthYear,
      startDate: null as unknown as import('firebase/firestore').Timestamp,
      onboardingCompleted: false,
      createdAt: null as unknown as import('firebase/firestore').Timestamp,
      updatedAt: null as unknown as import('firebase/firestore').Timestamp,
    };
    return matchProgramToUser(tempProfile);
  }, [data]);

  const bmi = useMemo(() => calculateBMI(data.currentWeight, data.height), [data.currentWeight, data.height]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
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

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const renderStep = () => {
    const currentStep = STEP_INFO[step - 1];
    
    const stepContent = () => {
      switch (step) {
        case 1:
          return (
            <div className="space-y-5">
              <InputField
                label="닉네임"
                value={data.nickname}
                onChange={(v) => updateData('nickname', v)}
                placeholder="닉네임을 입력하세요"
              />
              
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">성별</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as const).map((g) => (
                    <OptionButton
                      key={g}
                      selected={data.gender === g}
                      onClick={() => updateData('gender', g)}
                    >
                      <span className="text-2xl mb-1">{g === 'male' ? '👨' : '👩'}</span>
                      <span>{g === 'male' ? '남성' : '여성'}</span>
                    </OptionButton>
                  ))}
                </div>
              </div>
              
              <NumberInput
                label="출생년도"
                value={data.birthYear}
                onChange={(v) => updateData('birthYear', v)}
                min={1950}
                max={2010}
              />
            </div>
          );
          
        case 2:
          return (
            <div className="space-y-5">
              <NumberInput
                label="키 (cm)"
                value={data.height}
                onChange={(v) => updateData('height', v)}
                large
              />
              
              <NumberInput
                label="현재 체중 (kg)"
                value={data.currentWeight}
                onChange={(v) => updateData('currentWeight', v)}
                step={0.1}
                large
              />
              
              <div>
                <NumberInput
                  label="목표 체중 (kg)"
                  value={data.targetWeight}
                  onChange={(v) => updateData('targetWeight', v)}
                  step={0.1}
                  large
                />
                <motion.p 
                  className={`text-center text-sm mt-3 font-medium ${
                    data.targetWeight > data.currentWeight ? 'text-[#C6FF00]' : 
                    data.targetWeight < data.currentWeight ? 'text-orange-400' : 'text-gray-400'
                  }`}
                  key={data.targetWeight}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {data.targetWeight > data.currentWeight 
                    ? `↑ +${(data.targetWeight - data.currentWeight).toFixed(1)}kg 증량 목표` 
                    : data.targetWeight < data.currentWeight 
                      ? `↓ ${(data.currentWeight - data.targetWeight).toFixed(1)}kg 감량 목표`
                      : '⚖️ 체중 유지 목표'}
                </motion.p>
              </div>
            </div>
          );
          
        case 3:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">목표 유형</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'bulk', label: '벌크업', emoji: '💪', color: 'from-green-500 to-emerald-600' },
                    { value: 'cut', label: '다이어트', emoji: '🔥', color: 'from-orange-500 to-red-500' },
                    { value: 'maintain', label: '유지', emoji: '⚖️', color: 'from-blue-500 to-cyan-500' },
                  ].map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={data.goalType === option.value}
                      onClick={() => updateData('goalType', option.value as 'bulk' | 'cut' | 'maintain')}
                      gradient={option.color}
                    >
                      <span className="text-2xl mb-1">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </OptionButton>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">운동 경험</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'beginner', label: '초급', desc: '~6개월' },
                    { value: 'intermediate', label: '중급', desc: '6개월~2년' },
                    { value: 'advanced', label: '고급', desc: '2년+' },
                  ].map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={data.experienceLevel === option.value}
                      onClick={() => updateData('experienceLevel', option.value as 'beginner' | 'intermediate' | 'advanced')}
                    >
                      <span className="text-sm font-bold">{option.label}</span>
                      <span className="text-xs text-gray-400">{option.desc}</span>
                    </OptionButton>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">주 운동 횟수</label>
                <div className="flex items-center justify-center gap-6 py-4">
                  <motion.button
                    onClick={() => updateData('workoutDaysPerWeek', Math.max(2, data.workoutDaysPerWeek - 1))}
                    className="w-14 h-14 rounded-2xl bg-white/5 text-white text-2xl border border-white/10 hover:bg-white/10"
                    whileTap={{ scale: 0.9 }}
                  >
                    −
                  </motion.button>
                  <motion.span 
                    className="text-5xl font-black text-[#C6FF00] w-16 text-center"
                    key={data.workoutDaysPerWeek}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {data.workoutDaysPerWeek}
                  </motion.span>
                  <motion.button
                    onClick={() => updateData('workoutDaysPerWeek', Math.min(7, data.workoutDaysPerWeek + 1))}
                    className="w-14 h-14 rounded-2xl bg-white/5 text-white text-2xl border border-white/10 hover:bg-white/10"
                    whileTap={{ scale: 0.9 }}
                  >
                    +
                  </motion.button>
                </div>
                <p className="text-center text-sm text-gray-500 font-medium">일/주</p>
              </div>
            </div>
          );
          
        case 4:
          return (
            <div className="space-y-4">
              {[
                { key: 'lactoseIntolerance', label: '유당불내증', emoji: '🥛', desc: '우유 소화가 어려워요' },
                { key: 'vegetarian', label: '채식주의', emoji: '🥬', desc: '육류를 먹지 않아요' },
                { key: 'hasGymAccess', label: '헬스장 이용', emoji: '🏋️', desc: '헬스장에 다니고 있어요' },
              ].map((option, index) => (
                <motion.button
                  key={option.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => updateData(option.key as keyof OnboardingData, !data[option.key as keyof OnboardingData])}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all border-2 ${
                    data[option.key as keyof OnboardingData]
                      ? 'bg-[#C6FF00]/10 border-[#C6FF00]/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-white">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.desc}</div>
                  </div>
                  <motion.div 
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                      data[option.key as keyof OnboardingData]
                        ? 'bg-[#C6FF00] border-[#C6FF00]'
                        : 'border-gray-500'
                    }`}
                    animate={{ scale: data[option.key as keyof OnboardingData] ? [1, 1.2, 1] : 1 }}
                  >
                    {data[option.key as keyof OnboardingData] && (
                      <motion.svg 
                        className="w-4 h-4 text-black" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </motion.div>
                </motion.button>
              ))}
            </div>
          );
          
        case 5:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">직업/생활</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'office', label: '직장인', emoji: '💼' },
                    { value: 'student', label: '학생', emoji: '📚' },
                    { value: 'active', label: '활동적', emoji: '🏃' },
                  ].map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={data.lifestyle === option.value}
                      onClick={() => updateData('lifestyle', option.value as 'office' | 'active' | 'student')}
                    >
                      <span className="text-2xl mb-1">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </OptionButton>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">선호 운동 시간</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'morning', label: '아침', emoji: '🌅', time: '6-12시' },
                    { value: 'afternoon', label: '오후', emoji: '☀️', time: '12-18시' },
                    { value: 'evening', label: '저녁', emoji: '🌙', time: '18-24시' },
                  ].map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={data.preferredWorkoutTime === option.value}
                      onClick={() => updateData('preferredWorkoutTime', option.value as 'morning' | 'afternoon' | 'evening')}
                    >
                      <span className="text-2xl mb-1">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-gray-400">{option.time}</span>
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          );

        case 6:
          return (
            <div className="space-y-6">
              {/* BMI & 목표 분석 */}
              <motion.div 
                className="bg-gradient-to-br from-[#C6FF00]/10 to-[#9EF01A]/5 rounded-2xl p-5 border border-[#C6FF00]/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">당신의 BMI</p>
                    <p className="text-3xl font-black text-white">{bmi.toFixed(1)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">추천 목표</p>
                    <p className="text-xl font-bold text-[#C6FF00]">{getGoalTypeLabel(matchedProgram.goalType)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className={`py-2 rounded-lg ${bmi < 18.5 ? 'bg-[#C6FF00]/20 text-[#C6FF00]' : 'bg-white/5 text-gray-500'}`}>
                    저체중 &lt;18.5
                  </div>
                  <div className={`py-2 rounded-lg ${bmi >= 18.5 && bmi <= 23 ? 'bg-[#C6FF00]/20 text-[#C6FF00]' : 'bg-white/5 text-gray-500'}`}>
                    정상 18.5-23
                  </div>
                  <div className={`py-2 rounded-lg ${bmi > 23 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500'}`}>
                    과체중 &gt;23
                  </div>
                </div>
              </motion.div>

              {/* 칼로리 정보 */}
              <motion.div 
                className="bg-white/5 rounded-2xl p-5 border border-white/10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-sm text-gray-400 mb-3 font-medium">🔥 일일 권장 칼로리</h3>
                <div className="text-center py-3">
                  <motion.p 
                    className="text-4xl font-black text-[#C6FF00]"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {formatCalories(matchedProgram.calorieInfo.targetCalories)}
                  </motion.p>
                  <p className="text-gray-400 text-sm mt-2">
                    기초대사량 {formatCalories(matchedProgram.calorieInfo.bmr)} × 활동계수 
                    {matchedProgram.calorieInfo.surplus > 0 && ` + ${matchedProgram.calorieInfo.surplus}kcal`}
                    {matchedProgram.calorieInfo.surplus < 0 && ` ${matchedProgram.calorieInfo.surplus}kcal`}
                  </p>
                </div>
              </motion.div>

              {/* 매칭된 운동 프로그램 */}
              {matchedProgram.workout && (
                <motion.div 
                  className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-5 border border-purple-500/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🏋️</span>
                    <h3 className="text-white font-bold">운동 프로그램</h3>
                  </div>
                  <p className="text-[#C6FF00] font-bold mb-2">{matchedProgram.workout.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-white/10 rounded-full text-gray-300">
                      주 {matchedProgram.workout.frequency}일
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded-full text-gray-300">
                      {matchedProgram.workout.hasGymAccess ? '🏢 헬스장' : '🏠 홈트'}
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded-full text-gray-300">
                      {matchedProgram.workout.level === 'beginner' ? '초급' : matchedProgram.workout.level === 'intermediate' ? '중급' : '고급'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* 매칭된 식단 */}
              {matchedProgram.diet && (
                <motion.div 
                  className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl p-5 border border-orange-500/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🥗</span>
                    <h3 className="text-white font-bold">식단 플랜</h3>
                  </div>
                  <p className="text-orange-400 font-bold mb-2">{matchedProgram.diet.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-white/10 rounded-full text-gray-300">
                      {formatCalories(matchedProgram.diet.targetCalories)}
                    </span>
                    {matchedProgram.diet.lactoseFree && (
                      <span className="px-2 py-1 bg-blue-500/20 rounded-full text-blue-300">🥛 유당프리</span>
                    )}
                    {matchedProgram.diet.vegetarian && (
                      <span className="px-2 py-1 bg-green-500/20 rounded-full text-green-300">🥬 채식</span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 추천사항 */}
              {matchedProgram.recommendations.length > 0 && (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm text-gray-400 font-medium">💡 맞춤 조언</h3>
                  {matchedProgram.recommendations.map((rec, i) => (
                    <motion.p 
                      key={i}
                      className="text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      {rec}
                    </motion.p>
                  ))}
                </motion.div>
              )}

              {/* 매칭 점수 */}
              <motion.div 
                className="text-center pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-gray-500 text-sm">프로그램 매칭 적합도</p>
                <p className="text-2xl font-bold text-[#C6FF00]">{matchedProgram.matchScore}%</p>
              </motion.div>
            </div>
          );
      }
    };

    return (
      <div>
        {/* 헤더 */}
        <motion.div 
          className="text-center mb-8"
          key={step}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className="text-6xl mb-4 inline-block"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {currentStep.emoji}
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-2">{currentStep.title}</h2>
          <p className="text-gray-400 font-medium">{currentStep.subtitle}</p>
        </motion.div>

        {stepContent()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#C6FF00]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      {/* 진행률 바 */}
      <div className="relative z-10 p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400 text-sm font-medium">Step {step} / {TOTAL_STEPS}</span>
          {step > 1 && (
            <motion.button 
              onClick={handleBack} 
              className="text-gray-400 text-sm font-medium hover:text-white transition-colors"
              whileHover={{ x: -3 }}
            >
              ← 이전
            </motion.button>
          )}
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 px-6 py-4 overflow-auto relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 버튼 */}
      <div className="relative z-10 p-6 bg-gradient-to-t from-[#050508] via-[#050508]/80 to-transparent pt-12">
        {step < TOTAL_STEPS ? (
          <motion.button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] text-black font-bold py-4 rounded-2xl text-lg shadow-lg shadow-[#C6FF00]/20"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            다음
          </motion.button>
        ) : (
          <motion.button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#C6FF00] via-[#9EF01A] to-[#70E000] text-black font-bold py-4 rounded-2xl text-lg shadow-lg shadow-[#C6FF00]/30 disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            animate={{ boxShadow: loading ? "none" : ["0 10px 40px rgba(198, 255, 0, 0.2)", "0 10px 60px rgba(198, 255, 0, 0.4)", "0 10px 40px rgba(198, 255, 0, 0.2)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span 
                  className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                저장 중...
              </span>
            ) : (
              '🚀 시작하기'
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// 공통 컴포넌트들
function InputField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2 font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C6FF00]/50 focus:bg-white/10 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1, large }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  large?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2 font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-center focus:outline-none focus:border-[#C6FF00]/50 focus:bg-white/10 transition-all ${
          large ? 'text-2xl font-bold' : ''
        }`}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function OptionButton({ children, selected, onClick, gradient }: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  gradient?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`py-4 rounded-xl font-medium transition-all flex flex-col items-center justify-center relative overflow-hidden ${
        selected
          ? 'text-black'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {selected && (
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${gradient || 'from-[#C6FF00] to-[#9EF01A]'}`}
          layoutId="selectedOption"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex flex-col items-center">{children}</span>
    </motion.button>
  );
}

