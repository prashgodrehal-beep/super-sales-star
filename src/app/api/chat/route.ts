// === POST /api/chat ===
// Main conversation endpoint — processes each visitor message

import { NextRequest, NextResponse } from 'next/server';
import { processMessage } from '@/lib/conversation-engine';
import type { ChatRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.visitor_id || !body.message) {
      return NextResponse.json(
        { error: 'visitor_id and message are required' },
        { status: 400 }
      );
    }

    // Process the message through Kshama's brain
    const response = await processMessage({
      conversation_id: body.conversation_id,
      visitor_id: body.visitor_id,
      message: body.message,
      page_url: body.page_url || '/',
      prompt_version: body.prompt_version || 'sales_os',
      metadata: body.metadata || {},
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// CORS headers for widget embedding
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
