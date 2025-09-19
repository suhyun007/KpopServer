import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    // 인기 그룹 TOP 10 조회
    const { data: artists, error } = await supabase
      .from('artists')
      .select('*')
      .eq('is_active', true)
      .order('rank')
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: '데이터베이스 오류가 발생했습니다.',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      artists: artists || [],
      count: artists?.length || 0
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: String(error)
    }, { status: 500 });
  }
}
