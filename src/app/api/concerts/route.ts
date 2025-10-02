import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DateTime } from 'luxon';

// GET /api/concerts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const artistId = searchParams.get('artist_id');
    const artistName = searchParams.get('artist');
    const timezone = searchParams.get('timezone');
    const showAll = searchParams.get('show_all'); // 관리자용 파라미터

    // 특정 콘서트 ID로 조회
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('concerts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, concert: data });
    }

    let query = supabaseAdmin
      .from('concerts')
      .select('*');

    // 관리자 요청이 아니고 timezone이 있을 때만 필터링 적용
    if (!showAll && timezone) {
      try {
        // timezone 변환 (약어 -> 표준 형식)
        let targetTimezone = timezone;
        if (timezone === 'KST' || timezone === 'JST') {
          targetTimezone = 'Asia/Seoul';
        } else if (timezone === 'PST' || timezone === 'PDT') {
          targetTimezone = 'America/Los_Angeles';
        } else if (timezone === 'EST' || timezone === 'EDT') {
          targetTimezone = 'America/New_York';
        } else if (timezone === 'CST' || timezone === 'CDT') {
          targetTimezone = 'America/Chicago';
        } else if (timezone === 'MST' || timezone === 'MDT') {
          targetTimezone = 'America/Denver';
        } else if (timezone === 'GMT' || timezone === 'BST') {
          targetTimezone = 'Europe/London';
        } else if (timezone === 'CET' || timezone === 'CEST') {
          targetTimezone = 'Europe/Paris';
        } else if (timezone === 'JST') {
          targetTimezone = 'Asia/Tokyo';
        } else if (timezone === 'CST_CN' || timezone === 'CST_CHINA') {
          targetTimezone = 'Asia/Shanghai';
        } else if (timezone === 'IST') {
          targetTimezone = 'Asia/Kolkata';
        } else if (timezone === 'AEST' || timezone === 'AEDT') {
          targetTimezone = 'Australia/Sydney';
        } else if (timezone === 'NZST' || timezone === 'NZDT') {
          targetTimezone = 'Pacific/Auckland';
        } else if (timezone === 'HKT') {
          targetTimezone = 'Asia/Hong_Kong';
        } else if (timezone === 'SGT') {
          targetTimezone = 'Asia/Singapore';
        } else if (timezone === 'BKK' || timezone === 'ICT') {
          targetTimezone = 'Asia/Bangkok';
        } else if (timezone === 'WIB') {
          targetTimezone = 'Asia/Jakarta';
        } else if (timezone === 'PHT') {
          targetTimezone = 'Asia/Manila';
        } else if (timezone === 'MYT') {
          targetTimezone = 'Asia/Kuala_Lumpur';
        } else if (timezone === 'TST') {
          targetTimezone = 'Asia/Taipei';
        } else if (timezone === 'MOP') {
          targetTimezone = 'Asia/Macau';
        } else if (timezone === 'GST') {
          targetTimezone = 'Asia/Dubai';
        } else if (timezone === 'MSK') {
          targetTimezone = 'Europe/Moscow';
        } else if (timezone === 'CET') {
          targetTimezone = 'Europe/Berlin';
        } else if (timezone === 'EET' || timezone === 'EEST') {
          targetTimezone = 'Europe/Athens';
        } else if (timezone === 'UTC') {
          targetTimezone = 'UTC';
        }
        
        // 현재 시간 + 오늘 00:00 현지 시간
        const now = DateTime.now().setZone(targetTimezone);
        const todayStart = now.startOf('day');
        
        // UTC로 변환
        const utcTodayStart = todayStart.toUTC().toISO();
        
        query = query.gte('start_date', utcTodayStart);
      } catch (e) {
        // timezone 파싱 실패 시 UTC 기준으로 fallback
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        query = query.gte('start_date', today.toISOString());
      }
    }

    query = query.order('start_date', { ascending: true });

    if (artistId) {
      query = query.eq('artist_id', artistId);
    } else if (artistName) {
      query = query.eq('artist_name_en', artistName);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 필요 시 현지 시간 변환 후 반환
    const concertsWithLocalTime = (data ?? []).map((concert: any) => {
      if (concert.timezone && concert.start_date) {
        try {
          const localTime = DateTime.fromISO(concert.start_date).setZone(concert.timezone);
          return { 
            ...concert, 
            local_start_date: localTime.toISO(),
            local_start_date_formatted: localTime.toFormat('yyyy-MM-dd HH:mm')
          };
        } catch (e) {
          return concert;
        }
      }
      return concert;
    });

    return NextResponse.json({ success: true, concerts: concertsWithLocalTime });
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
