import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/scraped-concerts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const processed = searchParams.get('processed'); // true/false

    let query = supabaseAdmin
      .from('concert_scrape_staging')
      .select('*')
      .order('date', { ascending: false }) // 콘서트 날짜 내림차순 정렬
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // 처리 상태 필터링
    if (processed !== null) {
      const isProcessed = processed === 'true';
      query = query.eq('processed', isProcessed);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concerts: data || [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/scraped-concerts (새 스크래핑 데이터 추가)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { data, error } = await supabaseAdmin
      .from('concert_scrape_staging')
      .insert([{
        title: body.title,
        date: body.date,
        city: body.city,
        ticket_url: body.ticket_url,
        source: body.source || 'manual',
        processed: false
      }])
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concert: data?.[0] });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// PUT /api/scraped-concerts (처리 상태 업데이트)
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const body = await req.json();
    
    const { data, error } = await supabaseAdmin
      .from('concert_scrape_staging')
      .update({ processed: body.processed })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concert: data?.[0] });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// DELETE /api/scraped-concerts
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('concert_scrape_staging')
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
