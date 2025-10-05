import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

type MaybeString = string | null | undefined;

export type MembershipResult = string | NextResponse;

export async function getUserRoomId(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to resolve user room");
  }

  return (data?.room_id as string | null) ?? null;
}

export async function assertMembership(userId?: MaybeString, roomId?: MaybeString): Promise<MembershipResult> {
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const userRoomId = await getUserRoomId(userId);

    if (!userRoomId) {
      return NextResponse.json({ error: "User is not assigned to a room" }, { status: 403 });
    }

    if (roomId && roomId !== userRoomId) {
      return NextResponse.json({ error: "User cannot access this room" }, { status: 403 });
    }

    return userRoomId;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
