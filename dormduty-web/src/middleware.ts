import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8000',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Allow any Vercel deployment or configured origins
  const isVercelDeployment = origin?.includes('.vercel.app');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
  const allowedOrigin = (isVercelDeployment || isAllowedOrigin) ? (origin || ALLOWED_ORIGINS[0]) : ALLOWED_ORIGINS[0];

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Handle actual requests
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: '/api/:path*',
};
