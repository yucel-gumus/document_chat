import { NextRequest, NextResponse } from 'next/server';
import { gatewayFetch } from '@/lib/gateway';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { soru, dosyaId } = body;

    if (!soru?.trim()) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Soru boş olamaz.',
      }, { status: 400 });
    }

    const response = await gatewayFetch('/api/dokuman-chat/stream', {
      method: 'POST',
      body: JSON.stringify({ soru, dosyaId }),
    });

    if (!response.ok) {
      let errorData: Record<string, unknown>;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'Gateway hatası' };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (hata) {
    console.error('Chat API proxy hatası:', hata);

    return NextResponse.json({
      success: false,
      data: null,
      error: hata instanceof Error ? hata.message : 'Gateway bağlantı hatası',
    }, { status: 500 });
  }
}