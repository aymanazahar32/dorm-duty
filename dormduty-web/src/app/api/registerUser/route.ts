import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { user } = await req.json();

  const { data, error } = await supabase
    .from("users")
    .insert([
      { id: user.id, email: user.email, name: user.email.split("@")[0], aura_points: 0 }
    ]);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}
