import { NextResponse } from "next/server";
import { handleCorsOptions, addCorsHeaders } from "../_utils/cors";
import { getSupabaseAdmin } from "../_utils/auth";

/**
 * Handle CORS preflight
 */
export async function OPTIONS(req: Request) {
  return handleCorsOptions(req);
}

export async function POST(req: Request) {
  try {
    const { email, userId, name } = await req.json();

    if (!email || !userId) {
      const response = NextResponse.json(
        { error: "Email and userId are required" },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // Use admin client to bypass RLS
    const supabase = getSupabaseAdmin();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (existingUser) {
      // User exists, return their data
      const response = NextResponse.json({
        userId: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        roomId: existingUser.room_id,
      });
      return addCorsHeaders(response, req);
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          email: email,
          name: name || email.split("@")[0],
          aura_points: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      const response = NextResponse.json(
        { error: "Failed to create user", details: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response, req);
    }

    const response = NextResponse.json({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      roomId: newUser.room_id,
    });
    return addCorsHeaders(response, req);
  } catch (err: any) {
    console.error("Register user error:", err);
    const response = NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}
