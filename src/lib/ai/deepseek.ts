// ============================================
// DeepSeek AI 서비스 (액션 지원 버전)
// ============================================

import { UserProfile } from '@/lib/firebase/firestore';
import { DailyLog } from '@/lib/firebase/firestore';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 액션 타입 정의
export type ActionType = 
  | 'update_target_weight'
  | 'update_workout_days'
  | 'update_goal_type'
  | 'update_calorie_target'
  | 'suggest_routine_change'
  | 'add_rest_day'
  | 'increase_protein'
  | 'none';

export interface AIAction {
  type: ActionType;
  label: string;
  description: string;
  data: Record<string, unknown>;
  confirmMessage: string;
}

export interface AIResponseWithActions {
  success: boolean;
  message: string;
  actions?: AIAction[];
  error?: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}

// 시스템 프롬프트 생성 (액션 지원)
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
- 시작 체중: ${profile.startWeight}kg
- 목표: ${goalTypeKorean[profile.goalType] || profile.goalType}
- 운동 경험: ${experienceKorean[profile.experienceLevel] || profile.experienceLevel}
- 주당 운동 횟수: ${profile.workoutDaysPerWeek}회
- 유당불내증: ${profile.lactoseIntolerance ? '있음' : '없음'}
- 채식주의: ${profile.vegetarian ? '예' : '아니오'}
- 헬스장 이용: ${profile.hasGymAccess ? '가능' : '불가능 (홈트레이닝)'}
- 생활 패턴: ${profile.lifestyle === 'office' ? '직장인' : profile.lifestyle === 'student' ? '학생' : '활동적'}
`;
  }

  // 최근 기록 분석
  let recentActivity = '';
  let analysisData = '';
  
  if (recentLogs && recentLogs.length > 0) {
    const totalDays = recentLogs.length;
    const avgMealScore = recentLogs.reduce((sum, log) => sum + (log.completedMeals?.length || 0), 0) / totalDays;
    const avgExercise = recentLogs.reduce((sum, log) => sum + (log.completedExercises?.length || 0), 0) / totalDays;
    const workoutDays = recentLogs.filter(log => (log.completedExercises?.length || 0) > 0).length;
    
    const logSummary = recentLogs.slice(0, 7).map(log => {
      const mealScore = log.completedMeals?.length || 0;
      const exerciseCount = log.completedExercises?.length || 0;
      return `- ${log.date}: 식사 ${mealScore}/5끼, 운동 ${exerciseCount}개`;
    }).join('\n');
    
    recentActivity = `
## 최근 기록 (${totalDays}일)
${logSummary}

## 분석 데이터
- 평균 식사 점수: ${avgMealScore.toFixed(1)}/5
- 평균 운동 완료: ${avgExercise.toFixed(1)}개
- 운동한 날: ${workoutDays}일 / ${totalDays}일
- 운동 달성률: ${((workoutDays / Math.min(totalDays, profile?.workoutDaysPerWeek || 3)) * 100).toFixed(0)}%
`;

    analysisData = `
## 개선 필요 사항 분석
${avgMealScore < 3 ? '- ⚠️ 식사 점수가 낮습니다 (평균 ' + avgMealScore.toFixed(1) + '/5)' : ''}
${workoutDays < (profile?.workoutDaysPerWeek || 3) * 0.7 ? '- ⚠️ 운동 빈도가 목표보다 낮습니다' : ''}
${avgMealScore >= 4 && workoutDays >= (profile?.workoutDaysPerWeek || 3) ? '- ✅ 전반적으로 잘하고 있습니다!' : ''}
`;
  }

  return `당신은 "멸치탈출" 앱의 전문 AI 트레이너입니다.

## 핵심 역할
1. 사용자의 기록을 분석하여 맞춤 조언 제공
2. 필요시 프로필/목표 변경을 제안
3. 제안 시 반드시 JSON 형식의 액션을 포함

## 응답 형식
일반 대화: 그냥 친근하게 답변
제안이 필요한 경우: 답변 마지막에 다음 형식으로 액션 추가

[ACTION_START]
{
  "actions": [
    {
      "type": "update_target_weight",
      "label": "목표 체중 변경",
      "description": "목표 체중을 62kg으로 조정",
      "data": { "targetWeight": 62 },
      "confirmMessage": "목표 체중을 62kg으로 변경할까요?"
    }
  ]
}
[ACTION_END]

## 사용 가능한 액션 타입
- update_target_weight: 목표 체중 변경 (data: { targetWeight: number })
- update_workout_days: 주당 운동 횟수 변경 (data: { workoutDaysPerWeek: number })
- update_goal_type: 목표 유형 변경 (data: { goalType: "bulk" | "cut" | "maintain" })
- add_rest_day: 휴식일 추가 권장 (data: { reason: string })
- increase_protein: 단백질 섭취 증가 권장 (data: { amount: string })

## 대화 스타일
- 친근하고 격려하는 톤 사용
- 이모지 적절히 사용
- 구체적이고 실행 가능한 조언
- 답변은 200자 내외로 간결하게

${userContext}
${recentActivity}
${analysisData}

## 주의사항
- 의료적 조언은 피하고, 심각한 건강 문제는 전문가 상담 권유
- 사용자의 제한 사항(유당불내증, 채식 등)을 항상 고려
- 무리한 운동이나 극단적인 식단은 권장하지 않음
- 액션은 정말 필요한 경우에만 제안 (매번 제안하지 않음)`;
}

// AI 응답에서 액션 파싱
function parseActionsFromResponse(content: string): { message: string; actions?: AIAction[] } {
  const actionMatch = content.match(/\[ACTION_START\]([\s\S]*?)\[ACTION_END\]/);
  
  if (!actionMatch) {
    return { message: content.trim() };
  }

  try {
    const actionJson = JSON.parse(actionMatch[1].trim());
    const message = content.replace(/\[ACTION_START\][\s\S]*?\[ACTION_END\]/, '').trim();
    
    return {
      message,
      actions: actionJson.actions,
    };
  } catch (e) {
    console.error('액션 파싱 실패:', e);
    return { message: content.replace(/\[ACTION_START\][\s\S]*?\[ACTION_END\]/, '').trim() };
  }
}

// DeepSeek API 호출 (액션 포함)
export async function callDeepSeekAPI(
  messages: ChatMessage[],
  apiKey: string
): Promise<AIResponseWithActions> {
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
        max_tokens: 1500,
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
    const aiContent = data.choices?.[0]?.message?.content || '';
    
    // 액션 파싱
    const parsed = parseActionsFromResponse(aiContent);

    return {
      success: true,
      message: parsed.message,
      actions: parsed.actions,
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
export function getQuickReplies(context: 'greeting' | 'workout' | 'diet' | 'general' | 'analysis'): string[] {
  const replies: Record<string, string[]> = {
    greeting: [
      '이번 주 기록 분석해줘',
      '오늘 뭐 먹을까?',
      '목표 조정이 필요할까?',
      '동기부여 해줘!',
    ],
    workout: [
      '무게를 얼마나 올려야 할까?',
      '운동 횟수를 늘려야 할까?',
      '세트 수를 늘려야 할까?',
      '휴식이 더 필요할까?',
    ],
    diet: [
      '단백질 섭취량 늘려야 할까?',
      '칼로리를 더 먹어야 할까?',
      '식단 개선 방법 알려줘',
      '보충제 추천해줘',
    ],
    general: [
      '목표까지 얼마나 남았어?',
      '다음 주 계획 세워줘',
      '슬럼프가 왔어 😞',
      '진행 상황 평가해줘',
    ],
    analysis: [
      '목표 체중 조정해줘',
      '운동 횟수 변경하고 싶어',
      '이대로 계속 가도 될까?',
      '더 빠르게 성장하려면?',
    ],
  };

  return replies[context] || replies.general;
}

// 초기 인사말 생성
export function getInitialGreeting(profile: UserProfile | null, recentLogs?: DailyLog[]): string {
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

  // 최근 기록 분석
  let analysisHint = '';
  if (recentLogs && recentLogs.length > 0) {
    const avgMealScore = recentLogs.reduce((sum, log) => sum + (log.completedMeals?.length || 0), 0) / recentLogs.length;
    const workoutDays = recentLogs.filter(log => (log.completedExercises?.length || 0) > 0).length;
    
    if (avgMealScore < 3) {
      analysisHint = '\n\n💡 최근 식사 기록이 조금 부족해요. 제가 도와드릴까요?';
    } else if (workoutDays < recentLogs.length * 0.5) {
      analysisHint = '\n\n💡 운동 빈도가 목표보다 낮네요. 계획을 조정해볼까요?';
    }
  }

  if (remaining > 0 && profile) {
    return `안녕하세요 ${nickname}님! 💪 저는 당신의 AI 트레이너예요.\n\n${goalText} 목표까지 ${remaining.toFixed(1)}kg ${goal === 'cut' ? '감량' : '증량'}이 남았네요!${analysisHint}\n\n기록을 분석하고 계획을 세워드릴 수 있어요. 무엇이든 물어보세요!`;
  }

  return `안녕하세요 ${nickname}님! 💪 저는 당신의 AI 트레이너예요.\n\n운동, 식단, 또는 목표에 대해 궁금한 게 있으시면 편하게 물어보세요! 기록을 분석하고 맞춤 계획을 세워드릴 수 있어요.`;
}
