import { NextResponse } from "next/server";
import { verifyAuth } from "../../../_utils/auth";
import { handleCorsOptions, addCorsHeaders } from "../../../_utils/cors";

/**
 * Handle CORS preflight
 */
export async function OPTIONS(req: Request) {
  return handleCorsOptions(req);
}

/**
 * PUT /api/user/[userId]/room
 * Update a user's room assignment
 */
export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId: authenticatedUserId, supabase } = authResult;

  try {
    const { userId } = params;
    const body = await req.json();
    const { roomId } = body;

    if (!userId) {
      const response = NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // Verify the authenticated user is updating their own room
    if (userId !== authenticatedUserId) {
      const response = NextResponse.json(
        { error: "Cannot update another user's room" },
        { status: 403 }
      );
      return addCorsHeaders(response, req);
    }

    if (!roomId) {
      const response = NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
      return addCorsHeaders(response, req);
    }

    // Verify room exists
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      const response = NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
      return addCorsHeaders(response, req);
    }

    // Update user's room_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .update({ room_id: roomId })
      .eq("id", userId)
      .select()
      .single();

    if (userError) {
      console.error("Error updating user room:", userError);
      const response = NextResponse.json(
        { error: "Failed to update user room", details: userError.message },
        { status: 500 }
      );
      return addCorsHeaders(response, req);
    }

    const response = NextResponse.json({
      success: true,
      user: user,
    });
    return addCorsHeaders(response, req);
  } catch (err: unknown) {
    console.error("User room update error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorResponse = NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}
