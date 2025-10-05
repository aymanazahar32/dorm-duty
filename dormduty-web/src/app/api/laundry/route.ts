import { assertMembership } from "@/app/api/_utils/membership";
import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

type MaybeString = string | null | undefined;

type LaundryUpdates = {
  washerUserId?: MaybeString;
  dryerUserId?: MaybeString;
  washerTimerEnd?: MaybeString;
  dryerTimerEnd?: MaybeString;
};

function validateIsoTimestamp(value: string, field: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${field} must be a valid ISO 8601 timestamp`);
  }
}

function mapLaundryUpdates(updates: LaundryUpdates) {
  const payload: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(updates, "washerUserId")) {
    payload.washer_user = updates.washerUserId ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "dryerUserId")) {
    payload.dryer_user = updates.dryerUserId ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "washerTimerEnd")) {
    const value = updates.washerTimerEnd;
    if (typeof value === "string") {
      validateIsoTimestamp(value, "washerTimerEnd");
    }
    payload.washer_timer_end = value ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "dryerTimerEnd")) {
    const value = updates.dryerTimerEnd;
    if (typeof value === "string") {
      validateIsoTimestamp(value, "dryerTimerEnd");
    }
    payload.dryer_timer_end = value ?? null;
  }

  return payload;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const requestedRoomId = searchParams.get("roomId");

  const membership = await assertMembership(userId, requestedRoomId);

  if (membership instanceof NextResponse) {
    return membership;
  }

  const { data, error } = await supabase
    .from("laundry")
    .select("*")
    .eq("room_id", membership)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const { userId, roomId, updates } = await req.json();

  const membership = await assertMembership(userId, roomId);

  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "updates payload is required" }, { status: 400 });
  }

  let updatePayload: Record<string, unknown>;

  try {
    updatePayload = mapLaundryUpdates(updates as LaundryUpdates);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("laundry")
    .select("*")
    .eq("room_id", membership)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    const insertPayload = {
      room_id: membership,
      ...updatePayload,
    };

    const { data, error } = await supabase
      .from("laundry")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("laundry")
    .update(updatePayload)
    .eq("room_id", membership)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
