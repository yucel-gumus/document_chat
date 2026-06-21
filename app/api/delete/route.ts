import { NextRequest, NextResponse } from 'next/server';
import { gatewayFetch } from '@/lib/gateway';

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { dosyaId } = body;

    if (!dosyaId?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Dosya ID boş olamaz.',
      }, { status: 400 });
    }

    const response = await gatewayFetch('/api/dokuman-sil', {
      method: 'DELETE',
      admin: true,
      body: JSON.stringify({ dosyaId }),
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

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: data.message || 'Döküman başarıyla silindi',
    });
  } catch (hata) {
    console.error('Delete API proxy hatası:', hata);

    return NextResponse.json({
      success: false,
      error: hata instanceof Error ? hata.message : 'Silme işlemi başarısız',
    }, { status: 500 });
  }
}