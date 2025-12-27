import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/firebase/firestore';
import type { ActionType } from '@/lib/ai/deepseek';

interface ActionRequest {
  userId: string;
  actionType: ActionType;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ActionRequest = await request.json();
    const { userId, actionType, data } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let resultMessage = '';

    switch (actionType) {
      case 'update_target_weight':
        if (typeof data.targetWeight !== 'number') {
          return NextResponse.json(
            { success: false, error: '유효한 목표 체중이 필요합니다.' },
            { status: 400 }
          );
        }
        updateData = { targetWeight: data.targetWeight };
        resultMessage = `목표 체중이 ${data.targetWeight}kg으로 변경되었습니다! 💪`;
        break;

      case 'update_workout_days':
        if (typeof data.workoutDaysPerWeek !== 'number' || 
            data.workoutDaysPerWeek < 1 || 
            data.workoutDaysPerWeek > 7) {
          return NextResponse.json(
            { success: false, error: '유효한 운동 횟수가 필요합니다. (1-7)' },
            { status: 400 }
          );
        }
        updateData = { workoutDaysPerWeek: data.workoutDaysPerWeek };
        resultMessage = `주당 운동 횟수가 ${data.workoutDaysPerWeek}회로 변경되었습니다! 🏋️`;
        break;

      case 'update_goal_type':
        if (!['bulk', 'cut', 'maintain'].includes(data.goalType as string)) {
          return NextResponse.json(
            { success: false, error: '유효한 목표 유형이 필요합니다.' },
            { status: 400 }
          );
        }
        updateData = { goalType: data.goalType };
        const goalLabels = { bulk: '벌크업 💪', cut: '다이어트 🔥', maintain: '유지 ⚖️' };
        resultMessage = `목표가 ${goalLabels[data.goalType as keyof typeof goalLabels]}으로 변경되었습니다!`;
        break;

      case 'add_rest_day':
        // 휴식일 권장은 메모로 처리 (알림 목적)
        resultMessage = `휴식의 중요성을 기억하세요! 😴 ${data.reason || ''}`;
        break;

      case 'increase_protein':
        // 단백질 섭취 증가는 메모로 처리
        resultMessage = `단백질 섭취를 늘려보세요! 🥩 ${data.amount || ''}`;
        break;

      case 'suggest_routine_change':
        // 루틴 변경 제안은 메모로 처리
        resultMessage = `새로운 루틴을 시도해보세요! 🔄 ${data.suggestion || ''}`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션 타입입니다.' },
          { status: 400 }
        );
    }

    // DB 업데이트가 필요한 경우 실행
    if (Object.keys(updateData).length > 0) {
      await updateUserProfile(userId, updateData);
    }

    return NextResponse.json({
      success: true,
      message: resultMessage,
      updated: Object.keys(updateData).length > 0,
      data: updateData,
    });
  } catch (error) {
    console.error('Action API Error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

