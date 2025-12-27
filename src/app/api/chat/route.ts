import { NextRequest, NextResponse } from 'next/server';
import { callDeepSeekAPI, generateSystemPrompt, ChatMessage } from '@/lib/ai/deepseek';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, profile, recentLogs } = body;

    // API 키 확인
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 시스템 프롬프트 생성
    const systemPrompt = generateSystemPrompt(profile, recentLogs);

    // 메시지 배열 구성
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // DeepSeek API 호출
    const response = await callDeepSeekAPI(fullMessages, apiKey);

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 500 }
      );
    }

    // 액션이 있으면 함께 반환
    return NextResponse.json({
      success: true,
      message: response.message,
      actions: response.actions,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

