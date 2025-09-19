import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Vercel 환경변수에서 Supabase 설정 가져오기
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 설정이 환경변수에 없습니다.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      supabase_url: supabaseUrl,
      supabase_anon_key: supabaseAnonKey
    });

  } catch (error) {
    console.error('Supabase 설정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: String(error)
    }, { status: 500 });
  }
}
