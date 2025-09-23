import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/artists
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 전체 개수 조회
    const { count, error: countError } = await supabaseAdmin
      .from('artists')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 });
    }

    // 페이징된 데이터 조회 (번역 정보 포함)
    const { data, error } = await supabaseAdmin
      .from('artists')
      .select(`
        *,
        artist_translations (
          id,
          lang,
          description
        )
      `)
      .order('rank', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      artists: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit)
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/artists
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('artists')
      .insert(body)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, artist: data });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
