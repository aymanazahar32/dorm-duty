import { NextResponse } from "next/server";
import { verifyAuth, getSupabaseAdmin } from "../_utils/auth";
import { handleCorsOptions, addCorsHeaders } from "../_utils/cors";

/**
 * Handle CORS preflight
 */
export async function OPTIONS(req: Request) {
  return handleCorsOptions(req);
}

/**
 * GET /api/rooms
 * Fetch room(s) by roomId query parameter or all rooms
 */
export async function GET(req: Request) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { supabase } = authResult;

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  try {
    if (roomId) {
      // Fetch specific room
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) {
        const response = NextResponse.json(
          { error: "Room not found", details: error.message },
          { status: 404 }
        );
        return addCorsHeaders(response, req);
      }

      const response = NextResponse.json({ room: data });
      return addCorsHeaders(response, req);
    } else {
      // Fetch all rooms
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const response = NextResponse.json(
          { error: "Failed to fetch rooms", details: error.message },
          { status: 500 }
        );
        return addCorsHeaders(response, req);
      }

      const response = NextResponse.json({ rooms: data });
      return addCorsHeaders(response, req);
    }
  } catch (err: any) {
    const response = NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * POST /api/rooms
 * Create a new room
 */
export async function POST(req: Request) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  try {
    const body = await req.json();
    const { name, createdBy } = body;

    console.log("🔵 POST /api/rooms - userId:", userId);
    console.log("🔵 POST /api/rooms - name:", name);
    console.log("🔵 POST /api/rooms - createdBy:", createdBy);

    if (!name || !name.trim()) {
      const response = NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // Verify the authenticated user matches the createdBy field
    if (createdBy && createdBy !== userId) {
      const response = NextResponse.json(
        { error: "Cannot create room for another user" },
        { status: 403 }
      );
      return addCorsHeaders(response, req);
    }

    // Use admin client to bypass RLS for room creation
    const adminSupabase = getSupabaseAdmin();

    // Create the room (using authenticated user's ID)
    console.log("🔵 Attempting to insert room with created_by:", userId);
    const { data: room, error: roomError } = await adminSupabase
      .from("rooms")
      .insert([
        {
          name: name.trim(),
          created_by: userId,
        },
      ])
      .select()
      .single();
    
    console.log("🔵 Room insert result:", room);
    console.log("🔵 Room insert error:", roomError);

    if (roomError) {
      console.error("Error creating room:", roomError);
      const response = NextResponse.json(
        { error: "Failed to create room", details: roomError.message },
        { status: 500 }
      );
      return addCorsHeaders(response, req);
    }

    // Update the creator's room_id (also using admin client)
    const { error: userError } = await adminSupabase
      .from("users")
      .update({ room_id: room.id })
      .eq("id", userId);

    if (userError) {
      console.error("Error updating user room:", userError);
      // Room is created but user update failed - log it but don't fail
      console.warn("Room created but failed to update user:", userError.message);
    }

    const response = NextResponse.json(
      {
        success: true,
        roomId: room.id,
        name: room.name,
        room: room,
      },
      { status: 201 }
    );
    return addCorsHeaders(response, req);
  } catch (err: any) {
    console.error("Room creation error:", err);
    const response = NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

/**
 * PUT /api/rooms (for future room updates)
 */
export async function PUT(req: Request) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { supabase } = authResult;

  try {
    const body = await req.json();
    const { roomId, updates } = body;

    if (!roomId) {
      const response = NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      const response = NextResponse.json(
        { error: "Failed to update room", details: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response, req);
    }

    const response = NextResponse.json({ room: data });
    return addCorsHeaders(response, req);
  } catch (err: any) {
    const response = NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}
