// ============================================
// DeepSeek AI 서비스
// ============================================

import { UserProfile } from '@/lib/firebase/firestore';
import { DailyLog } from '@/lib/firebase/firestore';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}

// 시스템 프롬프트 생성
export function generateSystemPrompt(
  profile: UserProfile | null,
  recentLogs?: DailyLog[]
): string {
  const goalTypeKorean = {
    bulk: '벌크업 (체중 증가)',
    cut: '다이어트 (체중 감량)',
    maintain: '체중 유지',
  };

  const experienceKorean = {
    beginner: '초급자 (6개월 미만)',
    intermediate: '중급자 (6개월~2년)',
    advanced: '고급자 (2년 이상)',
  };

  let userContext = '';
  
  if (profile) {
    userContext = `
## 사용자 정보
- 닉네임: ${profile.nickname || '회원'}
- 키: ${profile.height}cm
- 현재 체중: ${profile.currentWeight}kg
- 목표 체중: ${profile.targetWeight}kg
- 목표: ${goalTypeKorean[profile.goalType] || profile.goalType}
- 운동 경험: ${experienceKorean[profile.experienceLevel] || profile.experienceLevel}
- 주당 운동 횟수: ${profile.workoutDaysPerWeek}회
- 유당불내증: ${profile.lactoseIntolerance ? '있음' : '없음'}
- 채식주의: ${profile.vegetarian ? '예' : '아니오'}
- 헬스장 이용: ${profile.hasGymAccess ? '가능' : '불가능 (홈트레이닝)'}
- 생활 패턴: ${profile.lifestyle === 'office' ? '직장인' : profile.lifestyle === 'student' ? '학생' : '활동적'}
`;
  }

  let recentActivity = '';
  if (recentLogs && recentLogs.length > 0) {
    const logSummary = recentLogs.slice(0, 7).map(log => {
      const mealScore = log.completedMeals?.length || 0;
      const exerciseCount = log.completedExercises?.length || 0;
      return `- ${log.date}: 식사 ${mealScore}/5끼, 운동 ${exerciseCount}개 완료`;
    }).join('\n');
    
    recentActivity = `
## 최근 7일 활동 기록
${logSummary}
`;
  }

  return `당신은 "멸치탈출" 앱의 전문 AI 트레이너입니다. 친근하고 동기부여가 되는 방식으로 대화해주세요.

## 역할
- 운동과 식단에 대한 전문적인 조언 제공
- 사용자의 목표 달성을 위한 맞춤형 가이드
- 동기부여와 격려
- 한국어로 자연스럽게 대화

## 대화 스타일
- 친근하고 격려하는 톤 사용
- 이모지를 적절히 사용하여 친근감 표현
- 구체적이고 실행 가능한 조언 제공
- 답변은 간결하게 (200자 내외)
- 필요시 더 자세한 설명 제공

${userContext}
${recentActivity}

## 주의사항
- 의료적 조언은 피하고, 심각한 건강 문제는 전문가 상담 권유
- 사용자의 제한 사항(유당불내증, 채식 등)을 항상 고려
- 무리한 운동이나 극단적인 식단은 권장하지 않음
- 점진적인 발전을 강조`;
}

// DeepSeek API 호출
export async function callDeepSeekAPI(
  messages: ChatMessage[],
  apiKey: string
): Promise<AIResponse> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek API Error:', errorData);
      return {
        success: false,
        message: '',
        error: `API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`,
      };
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      message: aiMessage.trim(),
    };
  } catch (error) {
    console.error('DeepSeek API Call Failed:', error);
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
    };
  }
}

// 빠른 응답 제안 생성
export function getQuickReplies(context: 'greeting' | 'workout' | 'diet' | 'general'): string[] {
  const replies: Record<string, string[]> = {
    greeting: [
      '오늘 운동 뭐 해야 해?',
      '오늘 뭐 먹을까?',
      '체중이 안 늘어요 😢',
      '동기부여 해줘!',
    ],
    workout: [
      '무게를 얼마나 올려야 할까?',
      '근육통이 있는데 운동해도 돼?',
      '세트 수를 늘려야 할까?',
      '유산소는 언제 해야 해?',
    ],
    diet: [
      '단백질 보충제 추천해줘',
      '야식 먹어도 돼?',
      '벌크업 간식 추천해줘',
      '회식 있을 때 어떻게 해?',
    ],
    general: [
      '이번 주 잘하고 있어?',
      '목표까지 얼마나 남았어?',
      '다음 주 계획 세워줘',
      '슬럼프가 왔어 😞',
    ],
  };

  return replies[context] || replies.general;
}

// 초기 인사말 생성
export function getInitialGreeting(profile: UserProfile | null): string {
  const nickname = profile?.nickname || '회원';
  const goal = profile?.goalType;
  
  let goalText = '';
  if (goal === 'bulk') {
    goalText = '벌크업';
  } else if (goal === 'cut') {
    goalText = '다이어트';
  } else {
    goalText = '건강 관리';
  }

  const currentWeight = profile?.currentWeight || 0;
  const targetWeight = profile?.targetWeight || 0;
  const remaining = Math.abs(targetWeight - currentWeight);

  if (remaining > 0 && profile) {
    return `안녕하세요 ${nickname}님! 💪 저는 당신의 AI 트레이너예요.\n\n${goalText} 목표까지 ${remaining.toFixed(1)}kg ${goal === 'cut' ? '감량' : '증량'}이 남았네요! 오늘도 화이팅! 🔥\n\n무엇이든 물어보세요!`;
  }

  return `안녕하세요 ${nickname}님! 💪 저는 당신의 AI 트레이너예요.\n\n운동, 식단, 또는 목표에 대해 궁금한 게 있으시면 편하게 물어보세요!`;
}

