import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/artist-translations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artistId = searchParams.get('artist_id');
    const lang = searchParams.get('lang');

    let query = supabaseAdmin
      .from('artist_translations')
      .select('*');

    if (artistId) {
      query = query.eq('artist_id', artistId);
    }
    if (lang) {
      query = query.eq('lang', lang);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, translations: data ?? [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/artist-translations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artist_id, lang, description } = body;

    if (!artist_id || !lang || !description) {
      return NextResponse.json({ 
        success: false, 
        error: 'artist_id, lang, description are required' 
      }, { status: 400 });
    }

    // 기존 번역이 있는지 확인
    const { data: existing } = await supabaseAdmin
      .from('artist_translations')
      .select('id')
      .eq('artist_id', artist_id)
      .eq('lang', lang)
      .single();

    let result;
    if (existing) {
      // 기존 번역 업데이트
      const { data, error } = await supabaseAdmin
        .from('artist_translations')
        .update({ description })
        .eq('id', existing.id)
        .select('*')
        .single();
      result = { data, error };
    } else {
      // 새 번역 생성
      const { data, error } = await supabaseAdmin
        .from('artist_translations')
        .insert({ artist_id, lang, description })
        .select('*')
        .single();
      result = { data, error };
    }

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, translation: result.data });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

