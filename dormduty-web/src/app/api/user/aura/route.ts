import { assertMembership } from "@/app/api/_utils/membership";
import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

/**
 * PATCH /api/user/aura
 * Update user's aura points
 * Body: { userId, roomId, auraChange, reason }
 */
export async function PATCH(req: Request) {
  const { userId, roomId, auraChange, reason } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (typeof auraChange !== "number") {
    return NextResponse.json({ error: "auraChange must be a number" }, { status: 400 });
  }

  // Verify user is in the room
  const membership = await assertMembership(userId, roomId);

  if (membership instanceof NextResponse) {
    return membership;
  }

  // Get current user data
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("id, aura_points, name")
    .eq("id", userId)
    .single();

  if (fetchError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate new aura points (ensure it doesn't go below 0)
  const currentAura = userData.aura_points || 0;
  const newAura = Math.max(0, currentAura + auraChange);

  // Update user's aura points
  const { data, error } = await supabase
    .from("users")
    .update({ aura_points: newAura })
    .eq("id", userId)
    .select("id, aura_points")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the aura change
  console.log(
    `✅ Aura points updated for ${userData.name || userId}: ${auraChange > 0 ? '+' : ''}${auraChange} (Total: ${newAura})`
  );
  if (reason) {
    console.log(`   Reason: ${reason}`);
  }

  return NextResponse.json({
    data: {
      userId: data.id,
      aura_points: data.aura_points,
      change: auraChange,
    },
  });
}
