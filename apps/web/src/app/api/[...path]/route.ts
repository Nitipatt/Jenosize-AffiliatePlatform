import { NextRequest, NextResponse } from 'next/server';

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || 'http://localhost:8080';

/**
 * Catch-all API proxy route handler.
 * Forwards requests to the NestJS backend and properly handles
 * Set-Cookie headers, which Vercel rewrites may not forward reliably.
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const apiPath = path.join('/');
  const url = new URL(request.url);
  const targetUrl = `${API_BACKEND_URL}/api/${apiPath}${url.search}`;

  // Build headers — forward everything except hop-by-hop headers
  const headers = new Headers();
  const skipRequestHeaders = new Set([
    'host',
    'connection',
    'transfer-encoding',
  ]);

  request.headers.forEach((value, key) => {
    if (!skipRequestHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  // Forward body for non-GET/HEAD requests
  if (!['GET', 'HEAD'].includes(request.method)) {
    fetchOptions.body = await request.arrayBuffer();
  }

  try {
    const backendRes = await fetch(targetUrl, fetchOptions);
    const resBody = await backendRes.arrayBuffer();

    const response = new NextResponse(
      resBody.byteLength > 0 ? resBody : null,
      {
        status: backendRes.status,
        statusText: backendRes.statusText,
      },
    );

    // Forward response headers, skipping hop-by-hop and cookie (handled separately)
    const skipResponseHeaders = new Set([
      'transfer-encoding',
      'connection',
      'keep-alive',
      'content-encoding',
      'content-length',
      'set-cookie',
    ]);

    backendRes.headers.forEach((value, key) => {
      if (!skipResponseHeaders.has(key.toLowerCase())) {
        response.headers.set(key, value);
      }
    });

    // Forward Set-Cookie headers properly (there may be multiple)
    const setCookies = backendRes.headers.getSetCookie?.();
    if (setCookies) {
      for (const cookie of setCookies) {
        response.headers.append('set-cookie', cookie);
      }
    }

    return response;
  } catch (error) {
    console.error('[API Proxy] Error forwarding to:', targetUrl, error);
    return NextResponse.json(
      { message: 'Backend service unavailable' },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
