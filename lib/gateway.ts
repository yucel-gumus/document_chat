/**
 * Server-side proxy to python_backend (Gemini Gateway).
 * Keys must never be exposed to the browser — use only in Route Handlers.
 */

const DEFAULT_GATEWAY_URL = 'https://api.yucelgumus.dev';

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
    '';
  if (!key) {
    throw new Error(
      'GATEWAY_CLIENT_API_KEY (or CLIENT_API_KEY) is not configured on the server.',
    );
  }
  return key;
}

export function getGatewayAdminApiKey(): string {
  const key =
    process.env.GATEWAY_ADMIN_API_KEY ||
    process.env.ADMIN_API_KEY ||
    '';
  if (!key) {
    throw new Error(
      'GATEWAY_ADMIN_API_KEY (or ADMIN_API_KEY) is not configured on the server.',
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