import { NextResponse } from 'next/server';

/**
 * Oturum bazlı: global Pinecone istatistiği döndürülmez (çoklu kullanıcı gizliliği).
 * Parça sayısı istemci tarafında yüklenen dosyalardan hesaplanır.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    hasData: false,
    totalChunks: 0,
    message: 'Sohbet için önce bu oturumda döküman yükleyin.',
    error: null,
  });
}