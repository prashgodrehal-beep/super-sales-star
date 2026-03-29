// === /api/emails ===
// Manage email drafts: list, approve, edit, send, reject

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { sendApprovedEmail, createEmailDraft } from '@/lib/email-engine';

// GET - List email drafts
export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    let query = supabase
      .from('email_drafts')
      .select(`
        *,
        conversations:conversation_id (
          visitor_name, visitor_email, visitor_company, lead_score
        )
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ emails: data });
  } catch (error) {
    console.error('Emails GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

// POST - Create a new email draft or take action on existing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'generate': {
        // Generate a new email draft
        const { conversation_id, trigger } = body;
        const draftId = await createEmailDraft(conversation_id, trigger);
        if (!draftId) {
          return NextResponse.json(
            { error: 'Failed to generate email draft' },
            { status: 400 }
          );
        }
        return NextResponse.json({ draft_id: draftId });
      }

      case 'approve': {
        // Approve and send an email
        const { email_id } = body;
        const supabase = getServerSupabase();

        await supabase
          .from('email_drafts')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', email_id);

        const sent = await sendApprovedEmail(email_id);
        if (!sent) {
          return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true, status: 'sent' });
      }

      case 'edit': {
        // Save edited email (stays in pending)
        const { email_id, edited_body_html, edited_subject } = body;
        const supabase = getServerSupabase();

        const updateData: Record<string, unknown> = {
          status: 'edited',
        };
        if (edited_body_html) updateData.edited_body_html = edited_body_html;
        if (edited_subject) updateData.subject = edited_subject;

        await supabase
          .from('email_drafts')
          .update(updateData)
          .eq('id', email_id);

        return NextResponse.json({ success: true });
      }

      case 'reject': {
        const { email_id } = body;
        const supabase = getServerSupabase();

        await supabase
          .from('email_drafts')
          .update({ status: 'rejected' })
          .eq('id', email_id);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Emails POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process email action' },
      { status: 500 }
    );
  }
}
