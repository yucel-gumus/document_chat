import { NextRequest, NextResponse } from 'next/server';
import { attachTenantCookie, getOrCreateTenantId } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  const { tenantId, isNew } = getOrCreateTenantId(request);
  const res = NextResponse.json({ ok: true });
  if (isNew) attachTenantCookie(res, tenantId);
  return res;
}