import { NextRequest, NextResponse } from 'next/server';
import { gatewayFetch } from '@/lib/gateway';
import { requireTenantId } from '@/lib/tenant';

function resolveDosyaIds(body: {
  dosyaId?: string;
  dosyaIds?: string[];
}): string[] {
  const ids = new Set<string>();
  if (body.dosyaId?.trim()) {
    ids.add(body.dosyaId.trim());
  }
  if (Array.isArray(body.dosyaIds)) {
    for (const id of body.dosyaIds) {
      if (typeof id === 'string' && id.trim()) {
        ids.add(id.trim());
      }
    }
  }
  return [...ids];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { soru } = body;
    const dosyaIds = resolveDosyaIds(body);

    if (!soru?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Soru boş olamaz.',
      }, { status: 400 });
    }

    if (dosyaIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Sohbet için önce döküman yükleyin (dosyaId gerekli).',
      }, { status: 400 });
    }

    const tenantId = requireTenantId(req);
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Oturum gerekli. Sayfayı yenileyin.',
      }, { status: 401 });
    }

    const response = await gatewayFetch('/api/dokuman-chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        soru,
        dosyaIds,
        tenantId,
      }),
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
      error: hata instanceof Error ? hata.message : 'Gateway bağlantı hatası',
    }, { status: 500 });
  }
}