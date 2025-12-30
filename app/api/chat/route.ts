import { NextRequest, NextResponse } from 'next/server';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { soru, dosyaId } = body;

    console.log('Chat API proxy çağrıldı:', {
      soru: soru?.substring(0, 50) + '...',
      dosyaId,
      targetUrl: `${AI_API_URL}/api/chat`
    });

    if (!soru?.trim()) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Soru boş olamaz.',
      }, { status: 400 });
    }

    const response = await fetch(`${AI_API_URL}/api/dokuman-chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'AI API hatası' };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (hata) {
    console.error('Chat API proxy hatası:', hata);

    return NextResponse.json({
      success: false,
      data: null,
      error: hata instanceof Error ? hata.message : 'AI API bağlantı hatası',
    }, { status: 500 });
  }
}

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