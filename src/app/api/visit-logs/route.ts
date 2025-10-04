import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      guestId, 
      userId, 
      deviceInfo, 
      ipAddress, 
      sessionId, 
      nation 
    } = body;

    console.log('방문자 로그 저장 요청:', {
      guestId,
      userId: userId || 'guest',
      deviceInfo,
      ipAddress,
      sessionId,
      nation
    });

    // visit_kpop_logs 테이블에 방문 로그 저장
    const { data, error } = await supabase
      .from('visit_kpop_logs')
      .insert({
        guest_id: guestId,
        user_id: userId || null, // 로그인하지 않은 사용자는 null
        device_info: deviceInfo,
        ip_address: ipAddress,
        session_id: sessionId,
        nation: nation
      })
      .select();

    if (error) {
      console.error('방문자 로그 저장 실패:', error);
      return NextResponse.json(
        { error: 'Failed to save visit log' },
        { status: 500 }
      );
    }

    console.log('✅ 방문자 로그 저장 완료:', data[0]?.id);
    return NextResponse.json({ 
      success: true, 
      logId: data[0]?.id 
    });

  } catch (error) {
    console.error('방문자 로그 API 오류:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
