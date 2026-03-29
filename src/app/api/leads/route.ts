// === GET /api/leads ===
// Returns all conversations with lead scoring data

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    const { searchParams } = new URL(request.url);
    const score = searchParams.get('score');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('conversations')
      .select('id, visitor_id, visitor_name, visitor_email, visitor_company, lead_score, lead_signals, started_at, ended_at, calendly_booked, status, page_url, summary')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (score && score !== 'all') {
      query = query.eq('lead_score', score);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      leads: data,
      total: count,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
