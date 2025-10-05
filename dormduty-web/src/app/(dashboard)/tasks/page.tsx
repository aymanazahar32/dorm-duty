"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Filter,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Search,
} from "lucide-react";
import TaskCard from "../../../components/TaskCard";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../utils/supabaseClient";

interface Roommate {
  id: string;
  name: string | null;
  email: string | null;
}

interface TaskRecord {
  id: string;
  task_name: string;
  due_date: string | null;
  completed: boolean;
  user_id: string | null;
  priority?: string | null;
  notes?: string | null;
  aura_awarded?: number | null;
}

interface TaskDisplay {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  priority: "high" | "medium" | "low";
  notes?: string | null;
  assignedUserId: string | null;
  assignedName: string;
}

interface FormState {
  title: string;
  assignedTo: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  notes: string;
}

const priorityCycle: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];

const defaultForm: FormState = {
  title: "",
  assignedTo: "",
  dueDate: "",
  priority: "medium",
  notes: "",
};

const formatISODate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
  return value;
  }
  return date.toISOString().slice(0, 10);
};

const transformTask = (
  record: TaskRecord,
  roommateMap: Map<string, Roommate>
): TaskDisplay => {
  const assigned = record.user_id ? roommateMap.get(record.user_id) : null;
  const priority = (record.priority as "high" | "medium" | "low") ?? "medium";

  return {
  id: record.id,
  title: record.task_name,
  dueDate: record.due_date,
  completed: record.completed,
  priority,
  notes: record.notes ?? null,
  assignedUserId: record.user_id,
  assignedName: assigned?.name ?? assigned?.email ?? "Unassigned",
  };
};

const cyclePriority = (current: "high" | "medium" | "low") => {
  const index = priorityCycle.indexOf(current);
  const nextIndex = (index + 1) % priorityCycle.length;
  return priorityCycle[nextIndex];
};

const TasksPage = () => {
  const { user, roomId, loading } = useAuth();
  const [rawTasks, setRawTasks] = useState<TaskRecord[]>([]);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roommateMap = useMemo(() => {
  return new Map(roommates.map((r) => [r.id, r] as const));
  }, [roommates]);

  const tasks = useMemo(
  () => rawTasks.map((record) => transformTask(record, roommateMap)),
  [rawTasks, roommateMap]
  );

  const stats = useMemo(() => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((task) => {
   if (!task.dueDate || task.completed) return false;
   const due = new Date(task.dueDate);
   return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
  }).length;

  return {
   total,
   completed,
   pending,
   overdue,
   completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
  return tasks.filter((task) => {
   if (statusFilter === "completed" && !task.completed) return false;
   if (statusFilter === "pending" && task.completed) return false;

   if (!searchTerm.trim()) return true;

   const haystack = `${task.title} ${task.assignedName} ${task.notes ?? ""}`.toLowerCase();
   return haystack.includes(searchTerm.trim().toLowerCase());
  });
  }, [tasks, searchTerm, statusFilter]);

  const fetchRoommates = useCallback(async () => {
  if (!roomId) return;
  const { data, error: supabaseError } = await supabase
   .from("users")
   .select("id, name, email")
   .eq("room_id", roomId);

  if (supabaseError) {
   console.error("Failed to load roommates", supabaseError);
   setRoommates([]);
   return;
  }

  setRoommates(data ?? []);

  if (!form.assignedTo && data && data.length > 0) {
   setForm((prev) => ({ ...prev, assignedTo: data[0].id ?? "" }));
  }
  }, [roomId, form.assignedTo]);

  const fetchTasks = useCallback(async () => {
  if (!user?.id || !roomId) return;

  setIsLoading(true);
  setError(null);
  try {
   const params = new URLSearchParams({
    userId: user.id,
    roomId,
   });
   const response = await fetch(`/api/tasks?${params.toString()}`);
   const payload = await response.json();
   if (!response.ok) {
    throw new Error(payload.error || "Failed to load tasks");
   }
   setRawTasks(payload.data ?? []);
  } catch (err) {
   console.error(err);
   setError(err instanceof Error ? err.message : "Failed to load tasks");
  } finally {
   setIsLoading(false);
  }
  }, [user?.id, roomId]);

  useEffect(() => {
  if (loading) return;
  if (!user || !roomId) return;
  fetchRoommates();
  fetchTasks();
  }, [loading, user, roomId, fetchRoommates, fetchTasks]);

  const handleFormChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
  const { name, value } = event.target;
  setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  if (!user || !roomId) return;
  if (!form.title.trim()) {
   setError("Task title is required");
   return;
  }

  setIsSubmitting(true);
  setError(null);
  try {
   const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     userId: user.id,
     roomId,
     taskName: form.title.trim(),
     dueDate: form.dueDate || null,
     assignedUserId: form.assignedTo || null,
     priority: form.priority,
     notes: form.notes || null,
    }),
   });
   const payload = await response.json();
   if (!response.ok) {
    throw new Error(payload.error || "Failed to create task");
   }
   setForm((prev) => ({ ...defaultForm, assignedTo: prev.assignedTo }));
   await fetchTasks();
  } catch (err) {
   console.error(err);
   setError(err instanceof Error ? err.message : "Failed to create task");
  } finally {
   setIsSubmitting(false);
  }
  };

  const patchTask = async (taskId: string, updates: Record<string, unknown>) => {
  if (!user) return;
  const response = await fetch("/api/tasks", {
   method: "PATCH",
   headers: {
    "Content-Type": "application/json",
   },
   body: JSON.stringify({ taskId, userId: user.id, updates }),
  });
  const payload = await response.json();
  if (!response.ok) {
   throw new Error(payload.error || "Task update failed");
  }
  };

  const handleToggleComplete = async (task: TaskDisplay) => {
  try {
   await patchTask(task.id, { completed: !task.completed });
   await fetchTasks();
  } catch (err) {
   console.error(err);
   setError(err instanceof Error ? err.message : "Failed to toggle task");
  }
  };

  const handleChangePriority = async (task: TaskDisplay) => {
  try {
   const nextPriority = cyclePriority(task.priority);
   await patchTask(task.id, { priority: nextPriority });
   await fetchTasks();
  } catch (err) {
   console.error(err);
   setError(err instanceof Error ? err.message : "Failed to update priority");
  }
  };

  const handleSnooze = async (task: TaskDisplay) => {
  const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
   baseDate.setTime(Date.now());
  }
  baseDate.setDate(baseDate.getDate() + 1);
  const next = baseDate.toISOString().slice(0, 10);

  try {
   await patchTask(task.id, { dueDate: next });
   await fetchTasks();
  } catch (err) {
   console.error(err);
   setError(err instanceof Error ? err.message : "Failed to snooze task");
  }
  };

  const handleDelete = async (taskId: string) => {
  if (!user) return;
  try {
   const response = await fetch("/api/tasks", {
    method: "DELETE",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId, userId: user.id }),
   });
   const payload = await response.json();
   if (!response.ok) {
    throw new Error(payload.error || "Failed to delete task");
   }
   await fetchTasks();
  } catch (err) {
   console.error(err);
   setError(err instanceof Error ? err.message : "Failed to delete task");
  }
  };

  const handleClearCompleted = async () => {
  if (!user) return;
  const completed = rawTasks.filter((task) => task.completed).map((task) => task.id);
  if (completed.length === 0) return;

  try {
   await Promise.all(
    completed.map((taskId) =>
     fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, userId: user.id }),
     })
    )
   );
   await fetchTasks();
  } catch (err) {
   console.error(err);
   setError(err instanceof Error ? err.message : "Failed to clear completed tasks");
  }
  };

  if (loading || isLoading) {
  return (
   <div className="flex min-h-[60vh] items-center justify-center">
    <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
    <span className="text-sm text-gray-600">Loading tasks</span>
   </div>
  );
  }

  if (!user || !roomId) {
  return (
   <div className="flex min-h-[60vh] items-center justify-center text-gray-600">
    Unable to determine room membership. Please sign in again.
   </div>
  );
  }

  return (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-32 pt-8">
   <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
     <h1 className="text-3xl font-bold text-indigo-700">Tasks</h1>
     <p className="text-sm text-gray-500">Track chores shared across your room.</p>
    </div>
    <div className="flex items-center gap-2">
     <button
      type="button"
      onClick={fetchTasks}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
     >
      <RefreshCcw className="h-4 w-4" /> Refresh
     </button>
     <button
      type="button"
      onClick={handleClearCompleted}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
     >
      <CheckCircle2 className="h-4 w-4" /> Clear completed
     </button>
    </div>
   </header>

   {error ? (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
   ) : null}

   <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
     <p className="text-xs text-gray-500">Total tasks</p>
     <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
     <p className="text-xs text-gray-500">Completed</p>
     <p className="text-2xl font-semibold text-emerald-600">{stats.completed}</p>
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
     <p className="text-xs text-gray-500">Pending</p>
     <p className="text-2xl font-semibold text-amber-600">{stats.pending}</p>
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
     <p className="text-xs text-gray-500">Overdue</p>
     <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
    </div>
   </section>

   <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
     <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-gray-600" htmlFor="title">
       Task title
      </label>
      <input
       id="title"
       name="title"
       value={form.title}
       onChange={handleFormChange}
       placeholder="e.g. Clean kitchen"
       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
       required
      />
     </div>

     <div>
      <label className="mb-1 block text-sm font-medium text-gray-600" htmlFor="assignedTo">
       Assign to
      </label>
      <select
       id="assignedTo"
       name="assignedTo"
       value={form.assignedTo}
       onChange={handleFormChange}
       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
       <option value="">Unassigned</option>
       {roommates.map((mate) => (
        <option key={mate.id} value={mate.id}>
        {mate.name ?? mate.email ?? "Unnamed"}
        </option>
       ))}
      </select>
     </div>

     <div>
      <label className="mb-1 block text-sm font-medium text-gray-600" htmlFor="dueDate">
       Due date
      </label>
      <input
       id="dueDate"
       type="date"
       name="dueDate"
       value={form.dueDate}
       onChange={handleFormChange}
       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
     </div>

     <div>
      <label className="mb-1 block text-sm font-medium text-gray-600" htmlFor="priority">
       Priority
      </label>
      <select
       id="priority"
       name="priority"
       value={form.priority}
       onChange={handleFormChange}
       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
       <option value="high">High</option>
       <option value="medium">Medium</option>
       <option value="low">Low</option>
      </select>
     </div>

     <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-gray-600" htmlFor="notes">
       Notes (optional)
      </label>
      <textarea
       id="notes"
       name="notes"
       value={form.notes}
       onChange={handleFormChange}
       placeholder="Add extra context or instructions"
       rows={3}
       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
     </div>

     <div className="md:col-span-2 flex justify-end">
      <button
       type="submit"
       disabled={isSubmitting}
       className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
       {isSubmitting ? (
        <>
        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
        </>
       ) : (
        <>
        <PlusCircle className="h-4 w-4" /> Add Task
        </>
       )}
      </button>
     </div>
    </form>
   </section>

   <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
     <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
      <Search className="h-4 w-4 text-gray-400" />
      <input
       value={searchTerm}
       onChange={(event) => setSearchTerm(event.target.value)}
       placeholder="Search tasks or assignees"
       className="flex-1 text-sm text-gray-700 outline-none"
      />
     </div>
     <div className="flex items-center gap-2 text-sm">
      <Filter className="h-4 w-4 text-gray-400" />
      <button
       type="button"
       onClick={() => setStatusFilter("all")}
       className={`rounded-full px-3 py-1 transition ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
      >
       All
      </button>
      <button
       type="button"
       onClick={() => setStatusFilter("pending")}
       className={`rounded-full px-3 py-1 transition ${statusFilter === "pending" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
      >
       Pending
      </button>
      <button
       type="button"
       onClick={() => setStatusFilter("completed")}
       className={`rounded-full px-3 py-1 transition ${statusFilter === "completed" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
      >
       Completed
      </button>
     </div>
    </div>

    <div className="space-y-4">
     {filteredTasks.length === 0 ? (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-gray-500">
       <CheckCircle2 className="h-8 w-8" />
       <p>No tasks match your filters.</p>
      </div>
     ) : (
      filteredTasks.map((task) => (
       <TaskCard
        key={task.id}
        title={task.title}
        assignedTo={task.assignedName}
        dueDate={formatISODate(task.dueDate)}
        completed={task.completed}
        priority={task.priority}
        notes={task.notes ?? undefined}
        onToggle={() => handleToggleComplete(task)}
        onSnooze={() => handleSnooze(task)}
        onChangePriority={() => handleChangePriority(task)}
        onDelete={() => handleDelete(task.id)}
       />
      ))
     )}
    </div>
   </section>
  </div>
  );
};

export default TasksPage;

