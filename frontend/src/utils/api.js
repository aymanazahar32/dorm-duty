import { supabase } from "./supabaseClient";

// ======= TASKS =======
export async function fetchTasks(roomId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });
  if (error) console.error(error);
  return data;
}

export async function addTask(task) {
  const { data, error } = await supabase.from("tasks").insert([task]);
  if (error) console.error(error);
  return data;
}

export async function toggleTaskComplete(taskId, completed) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", taskId);
  if (error) console.error(error);
  return data;
}

// ======= LAUNDRY =======
export async function fetchLaundry(roomId) {
  const { data, error } = await supabase
    .from("laundry")
    .select("*")
    .eq("room_id", roomId)
    .single();
  if (error) console.error(error);
  return data;
}

export async function setLaundryStatus(roomId, washerUser, dryerUser, timerEnd) {
  const { data, error } = await supabase
    .from("laundry")
    .upsert([{ room_id: roomId, washer_user: washerUser, dryer_user: dryerUser, timer_end: timerEnd }]);
  if (error) console.error(error);
  return data;
}
