import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { addCorsHeaders } from "./cors";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Creates a Supabase admin client that bypasses RLS
 * Use this for admin operations like creating rooms
 */
export function getSupabaseAdmin() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates an authenticated Supabase client using the JWT from the Authorization header
 * This ensures RLS policies are enforced with the correct user context
 */
export function getAuthenticatedSupabase(req: Request) {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  // Create a Supabase client with the user's access token
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return { supabase, token };
}

/**
 * Verifies the user is authenticated and returns their user ID
 */
export async function verifyAuth(req: Request): Promise<{ userId: string; supabase: SupabaseClient } | NextResponse> {
  const auth = getAuthenticatedSupabase(req);
  
  if (!auth) {
    const response = NextResponse.json(
      { error: "Unauthorized - No valid authentication token" },
      { status: 401 }
    );
    return addCorsHeaders(response, req);
  }

  const { supabase, token } = auth;

  // Verify the token and get user info
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    const response = NextResponse.json(
      { error: "Unauthorized - Invalid or expired token" },
      { status: 401 }
    );
    return addCorsHeaders(response, req);
  }

  return { userId: user.id, supabase };
}
