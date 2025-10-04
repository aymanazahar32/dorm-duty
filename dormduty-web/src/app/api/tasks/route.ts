import { assertMembership } from "@/app/api/_utils/membership";
import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

type MaybeString = string | undefined | null;

type TaskPayload = {
  taskName?: MaybeString;
  dueDate?: MaybeString;
  completed?: boolean;
  auraAwarded?: number;
  assignedUserId?: MaybeString;
};

function mapTaskPayload({ taskName, dueDate, completed, auraAwarded, assignedUserId }: TaskPayload) {
  const updates: Record<string, unknown> = {};

  if (typeof taskName === "string") updates.task_name = taskName.trim();
  if (typeof dueDate === "string") updates.due_date = dueDate;
  if (typeof completed === "boolean") updates.completed = completed;
  if (typeof auraAwarded === "number") updates.aura_awarded = auraAwarded;
  if (typeof assignedUserId === "string") updates.user_id = assignedUserId;

  return updates;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const requestedRoomId = searchParams.get("roomId");
  const onlyIncomplete = searchParams.get("onlyIncomplete") === "true";

  const membership = await assertMembership(userId, requestedRoomId);

  if (membership instanceof NextResponse) {
    return membership;
  }

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("room_id", membership)
    .order("due_date", { ascending: true });

  if (onlyIncomplete) {
    query = query.eq("completed", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const { userId, roomId, taskName, dueDate, auraAwarded = 0, assignedUserId } = await req.json();

  const membership = await assertMembership(userId, roomId);

  if (membership instanceof NextResponse) {
    return membership;
  }

  if (!taskName || typeof taskName !== "string") {
    return NextResponse.json({ error: "taskName is required" }, { status: 400 });
  }

  const insertPayload = {
    room_id: membership,
    user_id: assignedUserId ?? userId,
    task_name: taskName.trim(),
    completed: false,
    aura_awarded: auraAwarded,
    due_date: dueDate ?? null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const { taskId, userId, updates } = await req.json();

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const { data: taskRecord, error: fetchError } = await supabase
    .from("tasks")
    .select("id, room_id")
    .eq("id", taskId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  const membership = await assertMembership(userId, taskRecord?.room_id);

  if (membership instanceof NextResponse) {
    return membership;
  }

  const updatePayload = mapTaskPayload(updates ?? {});

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const { taskId, userId } = await req.json();

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const { data: taskRecord, error: fetchError } = await supabase
    .from("tasks")
    .select("id, room_id")
    .eq("id", taskId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  const membership = await assertMembership(userId, taskRecord?.room_id);

  if (membership instanceof NextResponse) {
    return membership;
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: taskId } });
}
