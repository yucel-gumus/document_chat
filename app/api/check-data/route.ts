import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('Veri kontrolü başlatıldı...');

    return NextResponse.json({
      success: true,
      hasData: true,
      totalChunks: 0,
      message: 'Sohbet etmeye başlayabilirsiniz!',
      error: null,
    });

  } catch (hata) {
    console.error('Veri kontrolü hatası:', hata);

    return NextResponse.json({
      success: false,
      hasData: false,
      error: hata instanceof Error ? hata.message : 'Veri kontrolünde hata oluştu.',
    }, { status: 500 });
  }
} 