import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/concerts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artistName = searchParams.get('artist');
    const artistId = searchParams.get('artist_id');

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
