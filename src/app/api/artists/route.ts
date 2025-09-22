import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/artists
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    // ID로 특정 아티스트 조회
    if (id) {
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
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        artists: data ? [data] : []
      });
    }

    // 이름으로 특정 아티스트 조회
    if (name) {
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
        .eq('artist_name_en', name)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        artists: data ? [data] : []
      });
    }

    // 전체 개수 조회
    const { count, error: countError } = await supabaseAdmin
      .from('artists')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 });
    }

    // 페이징된 데이터 조회 (번역 정보 포함)
    let query = supabaseAdmin
      .from('artists')
      .select(`
        *,
        artist_translations (
          id,
          lang,
          description
        )
      `);

    // 검색용 정렬 (artist_name_en) vs 일반 정렬 (rank)
    if (search === 'true') {
      query = query.order('artist_name_en', { ascending: true });
    } else {
      query = query.order('rank', { ascending: true });
    }

    const offset = (page - 1) * limit;
    const { data, error } = await query.range(offset, offset + limit - 1);

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
