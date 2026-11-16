import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  IApiYaniti,
  IDosyaYuklemeYaniti,
  desteklenenDosyaTuruMu,
} from '@/lib/types';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB_LABEL,
  UPLOAD_CONCURRENCY_LIMIT,
  SUPPORTED_FILE_TYPES_LABEL,
} from '@/lib/constants';
import {
  dosyadanMetinCikar,
  metniChunklereBol,
} from '@/lib/document-parser';

import { gatewayFetch } from '@/lib/gateway';
import { attachTenantCookie, getOrCreateTenantId } from '@/lib/tenant';

export const maxDuration = 60;

async function chunkiPythonAPIyeGonder(
  chunkId: string,
  metin: string,
  dosyaId: string,
  tenantId: string,
): Promise<void> {
  const response = await gatewayFetch('/api/dokuman-upsert', {
    method: 'POST',
    admin: true,
    body: JSON.stringify({
      id: chunkId,
      metin: metin,
      dosyaId: dosyaId,
      tenantId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Python API hatası: ${response.status}`);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<IApiYaniti<IDosyaYuklemeYaniti>>> {
  try {
    const { tenantId, isNew } = getOrCreateTenantId(req);

    const formData = await req.formData();
    const dosya = formData.get('file') as File;

    if (!dosya) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Dosya bulunamadı.',
      }, { status: 400 });
    }

    if (!desteklenenDosyaTuruMu(dosya.type, dosya.name)) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Desteklenmeyen dosya türü. Sadece ${SUPPORTED_FILE_TYPES_LABEL} kabul edilir.`,
      }, { status: 400 });
    }

    if (dosya.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Dosya çok büyük. Maksimum ${MAX_FILE_SIZE_MB_LABEL} boyutunda dosya yükleyebilirsiniz.`,
      }, { status: 400 });
    }

    const dosyaId = uuidv4();
    const arrayBuffer = await dosya.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metin = await dosyadanMetinCikar(buffer, dosya.type, dosya.name);

    if (!metin.trim()) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Dosyadan metin çıkarılamadı veya dosya boş.',
      }, { status: 400 });
    }

    const chunks = metniChunklereBol(metin);

    if (chunks.length === 0) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Metin chunklara bölünemedi.',
      }, { status: 400 });
    }

    for (let i = 0; i < chunks.length; i += UPLOAD_CONCURRENCY_LIMIT) {
      const batch = chunks.slice(i, i + UPLOAD_CONCURRENCY_LIMIT);
      await Promise.all(
        batch.map((chunk, batchIndex) => {
          const index = i + batchIndex;
          const chunkId = `${dosyaId}_chunk_${index}`;
          return chunkiPythonAPIyeGonder(chunkId, chunk, dosyaId, tenantId);
        }),
      );
    }

    const response = {
      success: true,
      data: {
        dosyaId,
        ad: dosya.name || 'Bilinmeyen Dosya',
        boyut: dosya.size,
        metinParcacigiSayisi: chunks.length,
      },
      error: null,
    };

    const res = NextResponse.json(response);
    if (isNew) attachTenantCookie(res, tenantId);
    return res;

  } catch (hata) {
    console.error('Dosya yükleme hatası:', hata);

    return NextResponse.json({
      success: false,
      data: null,
      error: hata instanceof Error ? hata.message : 'Dosya yüklenirken bir hata oluştu.',
    }, { status: 500 });
  }
}