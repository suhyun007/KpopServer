import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/concerts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const artistId = searchParams.get('artist_id');
    const artistName = searchParams.get('artist');

    // 특정 콘서트 ID로 조회
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('concerts')
        .select(`
          *,
          artists (
            id,
            artist_name_en,
            artist_name_kr,
            fandom_name,
            agency
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, concert: data });
    }

    let query = supabaseAdmin
      .from('concerts')
      .select(`
        *,
        artists (
          id,
          artist_name_en,
          artist_name_kr,
          fandom_name,
          agency
        )
      `)
      .order('start_date', { ascending: true });

    if (artistId) {
      query = query.eq('artist_id', artistId);
    } else if (artistName) {
      query = query.eq('artists.artist_name_en', artistName);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concerts: data ?? [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/concerts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('concerts')
      .insert(body)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concert: data });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// PUT /api/concerts?id=123
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'id parameter is required' 
      }, { status: 400 });
    }

    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('concerts')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        artists (
          id,
          artist_name_en,
          artist_name_kr,
          fandom_name,
          agency
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concert: data });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// DELETE /api/concerts?id=123
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'id parameter is required' 
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('concerts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
