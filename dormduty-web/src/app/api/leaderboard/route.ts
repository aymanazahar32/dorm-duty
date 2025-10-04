import { assertMembership } from "@/app/api/_utils/membership";
import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseNumber(value: string | null, fallback: number, { min, max }: { min: number; max: number }) {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  const next = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(next, min), max);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const requestedRoomId = searchParams.get("roomId");

  const limit = parseNumber(searchParams.get("limit"), DEFAULT_LIMIT, { min: 1, max: MAX_LIMIT });
  const page = parseNumber(searchParams.get("page"), 1, { min: 1, max: Number.MAX_SAFE_INTEGER });
  const offset = (page - 1) * limit;
  const rangeEnd = offset + limit - 1;

  const membership = await assertMembership(userId, requestedRoomId);

  if (membership instanceof NextResponse) {
    return membership;
  }

  const { data, error, count } = await supabase
    .from("users")
    .select("id, name, email, aura_points", { count: "exact" })
    .eq("room_id", membership)
    .order("aura_points", { ascending: false })
    .range(offset, rangeEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leaderboard = (data ?? []).map((entry, index) => ({
    ...entry,
    rank: offset + index + 1,
  }));

  return NextResponse.json({
    data: leaderboard,
    pagination: {
      page,
      limit,
      total: count ?? leaderboard.length,
    },
  });
}
