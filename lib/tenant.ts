import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const DOC_TENANT_COOKIE = 'doc_tenant_id';

const TENANT_RE = /^[a-f0-9-]{36}$/i;

export function getOrCreateTenantId(request: NextRequest): { tenantId: string; isNew: boolean } {
  const existing = request.cookies.get(DOC_TENANT_COOKIE)?.value?.trim();
  if (existing && TENANT_RE.test(existing)) {
    return { tenantId: existing, isNew: false };
  }
  return { tenantId: randomUUID(), isNew: true };
}

export function attachTenantCookie(response: NextResponse, tenantId: string): void {
  response.cookies.set(DOC_TENANT_COOKIE, tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function requireTenantId(request: NextRequest): string | null {
  const tid = request.cookies.get(DOC_TENANT_COOKIE)?.value?.trim();
  if (!tid || !TENANT_RE.test(tid)) return null;
  return tid;
}