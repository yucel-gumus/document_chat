import { NextResponse } from 'next/server';

/**
 * Server-side proxy to python_backend (Gemini Gateway).
 * Keys must never be exposed to the browser — use only in Route Handlers.
 */

const DEFAULT_GATEWAY_URL = 'https://python-backend-270384591051.europe-west3.run.app';

export function getGatewayBaseUrl(): string {
  const url =
    process.env.AI_API_URL ||
    process.env.GEMINI_GATEWAY_URL ||
    DEFAULT_GATEWAY_URL;
  return url.replace(/\/$/, '');
}

export function getGatewayClientApiKey(): string {
  const key =
    process.env.GATEWAY_CLIENT_API_KEY ||
    process.env.CLIENT_API_KEY ||
    process.env.GATEWAY_ADMIN_API_KEY ||
    process.env.ADMIN_API_KEY ||
    '';
  if (!key) {
    throw new Error(
      'GATEWAY_CLIENT_API_KEY (veya GATEWAY_ADMIN_API_KEY) sunucuda tanımlı değil.',
    );
  }
  return key;
}

export function getGatewayAdminApiKey(): string {
  const key =
    process.env.GATEWAY_ADMIN_API_KEY ||
    process.env.ADMIN_API_KEY ||
    process.env.GATEWAY_CLIENT_API_KEY ||
    process.env.CLIENT_API_KEY ||
    '';
  if (!key) {
    throw new Error(
      'GATEWAY_ADMIN_API_KEY (veya GATEWAY_CLIENT_API_KEY) sunucuda tanımlı değil.',
    );
  }
  return key;
}

export function gatewayJsonHeaders(options?: { admin?: boolean }): HeadersInit {
  const apiKey = options?.admin
    ? getGatewayAdminApiKey()
    : getGatewayClientApiKey();

  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };
}

export async function gatewayFetch(
  path: string,
  init: RequestInit & { admin?: boolean } = {},
): Promise<Response> {
  const { admin, ...fetchInit } = init;
  const base = getGatewayBaseUrl();
  const headers = new Headers(fetchInit.headers);
  const apiKey = admin ? getGatewayAdminApiKey() : getGatewayClientApiKey();
  if (!headers.has('Content-Type') && fetchInit.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-API-Key', apiKey);

  return fetch(`${base}${path}`, {
    ...fetchInit,
    headers,
  });
}

/**
 * API route handlers için ortak gateway hata yanıtı ayrıştırıcısı (DRY helper)
 */
export async function handleGatewayErrorResponse(response: Response): Promise<NextResponse> {
  let errorData: Record<string, unknown>;
  try {
    errorData = await response.json();
  } catch {
    errorData = { error: 'Gateway hatası' };
  }
  return NextResponse.json(errorData, { status: response.status });
}