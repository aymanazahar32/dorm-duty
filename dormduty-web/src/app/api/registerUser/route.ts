import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";
import { addCorsHeaders, handleCorsOptions } from "../_utils/cors";

export async function OPTIONS(req: Request) {
  return handleCorsOptions(req);
}

type RegisterPayload = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    roomId?: string | null;
  };
  userId?: string;
  email?: string;
  name?: string;
  roomId?: string | null;
};

export async function POST(req: Request) {
  try {
    const body: RegisterPayload = await req.json();

    const payload = body.user ?? body;
    const id = payload.userId ?? payload.id;
    const email = payload.email;
    const name = payload.name;
    const roomId = payload.roomId ?? null;

    if (!id || !email) {
      const response = NextResponse.json({ error: "userId and email are required" }, { status: 400 });
      return addCorsHeaders(response, req);
    }

    const normalizedName = (name ?? email.split("@")[0] ?? "Roommate").trim();

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id,
          email,
          name: normalizedName,
          aura_points: 0,
          room_id: roomId,
        },
        {
          onConflict: "id",
        }
      )
      .select("id, email, name, room_id, aura_points")
      .single();

    if (error) {
      console.error("registerUser error", error);
      const response = NextResponse.json({ error: error.message }, { status: 500 });
      return addCorsHeaders(response, req);
    }

    const response = NextResponse.json({ user: data });
    return addCorsHeaders(response, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const response = NextResponse.json({ error: message }, { status: 500 });
    return addCorsHeaders(response, req);
  }
}
