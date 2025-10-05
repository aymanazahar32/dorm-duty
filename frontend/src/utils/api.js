import { supabase } from "./supabaseClient";

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? "";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

export async function apiFetch(path, { method = "GET", body, headers = {}, signal } = {}) {
  const token = await getAccessToken();
  const mergedHeaders = new Headers({
    "Content-Type": "application/json",
    ...headers,
  });

  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: mergedHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (err) {
    // no-op; some endpoints may legitimately return empty bodies
  }

  if (!response.ok) {
    const errorMessage = payload?.error ?? response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload ?? {};
}

export async function fetchTasks({ userId, roomId, onlyIncomplete = false, signal }) {
  const params = new URLSearchParams();

  if (userId) params.append("userId", userId);
  if (roomId) params.append("roomId", roomId);
  if (onlyIncomplete) params.append("onlyIncomplete", "true");

  const { data } = await apiFetch(`/api/tasks?${params.toString()}`, { signal });
  return data ?? [];
}

export async function createTask({ userId, roomId, taskName, dueDate, auraAwarded = 0, assignedUserId }) {
  const body = {
    userId,
    roomId,
    taskName,
    dueDate,
    auraAwarded,
    assignedUserId,
  };

  const { data } = await apiFetch("/api/tasks", { method: "POST", body });
  return data;
}

export async function updateTask({ taskId, userId, updates }) {
  const { data } = await apiFetch("/api/tasks", {
    method: "PATCH",
    body: { taskId, userId, updates },
  });

  return data;
}

export async function deleteTask({ taskId, userId }) {
  await apiFetch("/api/tasks", {
    method: "DELETE",
    body: { taskId, userId },
  });
}

export async function fetchLeaderboard({ userId, roomId, limit = 5, page = 1, signal }) {
  const params = new URLSearchParams();

  if (userId) params.append("userId", userId);
  if (roomId) params.append("roomId", roomId);
  params.append("limit", String(limit));
  params.append("page", String(page));

  const { data, pagination } = await apiFetch(`/api/leaderboard?${params.toString()}`, { signal });

  return {
    data: data ?? [],
    pagination,
  };
}

export async function fetchLaundry({ userId, roomId, signal }) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (roomId) params.append("roomId", roomId);

  const { data } = await apiFetch(`/api/laundry?${params.toString()}`, { signal });
  return data ?? null;
}

export async function updateLaundry({ userId, roomId, updates }) {
  const { data } = await apiFetch("/api/laundry", {
    method: "PATCH",
    body: { userId, roomId, updates },
  });

  return data;
}
