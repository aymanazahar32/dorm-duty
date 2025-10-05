import { NextResponse } from "next/server";

/**
 * CORS configuration for API routes
 * Allows requests from the React frontend running on a different port
 * Supports both local development and production deployments
 */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8000",
  // Add production frontend URL from environment variable
  process.env.NEXT_PUBLIC_FRONTEND_URL,
].filter(Boolean) as string[];

export function corsHeaders(origin?: string | null) {
  // Allow any Vercel preview/production deployment
  const isVercelDeployment = origin?.includes(".vercel.app");
  
  const allowedOrigin = origin && (ALLOWED_ORIGINS.includes(origin) || isVercelDeployment)
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsOptions(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: NextResponse, req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
