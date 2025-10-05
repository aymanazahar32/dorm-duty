import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Loader2,
  PlusCircle,
  RefreshCcw,
} from "lucide-react";
import TaskCard from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";
import { createTask, deleteTask, fetchTasks, updateTask, fetchLeaderboard } from "../utils/api";

const emptyForm = {
  taskName: "",
  dueDate: "",
  assignedUserId: "",
};

const toISODate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const [roommates, setRoommates] = useState([]);
  const [loadingRoommates, setLoadingRoommates] = useState(false);

  useEffect(() => {
    if (!user?.id || !user?.roomId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTasks({
          userId: user.id,
          roomId: user.roomId,
          signal: controller.signal,
        });

        if (!ignore) {
          setTasks(data ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load tasks");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [user?.id, user?.roomId]);

  // Load roommates for the dropdown
  useEffect(() => {
    if (!user?.id || !user?.roomId) {
      setRoommates([]);
      return;
    }

    let ignore = false;

    async function loadRoommates() {
      setLoadingRoommates(true);
      try {
        const response = await fetchLeaderboard({ 
          userId: user.id, 
          roomId: user.roomId, 
          limit: 50 
        });
        
        if (!ignore) {
          setRoommates(response.data ?? []);
        }
      } catch (err) {
        console.error("Failed to load roommates:", err);
        if (!ignore) {
          setRoommates([]);
        }
      } finally {
        if (!ignore) {
          setLoadingRoommates(false);
        }
      }
    }

    loadRoommates();

    return () => {
      ignore = true;
    };
  }, [user?.id, user?.roomId]);

  const normalizedTasks = useMemo(
    () =>
      tasks.map((task) => {
        const assignedRoommate = roommates.find(r => r.id === task.user_id);
        return {
          id: task.id,
          title: task.task_name,
          completed: task.completed,
          dueDate: task.due_date ? toISODate(task.due_date) : "",
          assignedTo: assignedRoommate?.name || assignedRoommate?.email || task.user_id || "Unassigned",
          auraAwarded: task.aura_awarded ?? 0,
        };
      }),
    [tasks, roommates]
  );

  const filteredTasks = useMemo(() => {
    if (filter === "all") return normalizedTasks;
    if (filter === "completed") return normalizedTasks.filter((task) => task.completed);
    if (filter === "pending") return normalizedTasks.filter((task) => !task.completed);
    return normalizedTasks;
  }, [filter, normalizedTasks]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!form.taskName?.trim()) {
      setError("Task name is required");
      return;
    }

    if (!user?.id || !user?.roomId) {
      setError("Add your user and room IDs on the login screen first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = await createTask({
        userId: user.id,
        roomId: user.roomId,
        taskName: form.taskName.trim(),
        dueDate: form.dueDate || null,
        assignedUserId: form.assignedUserId?.trim() || undefined,
      });

      setTasks((prev) => [payload, ...prev]);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Unable to create task");
    } finally {
      setSaving(false);
    }
  };

  const mutateTask = (taskId, updater) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? updater(task) : task)));
  };

  const handleToggleCompleted = async (task) => {
    if (!user?.id) return;

    const snapshot = tasks;
    mutateTask(task.id, (prev) => ({ ...prev, completed: !prev.completed }));

    try {
      const updated = await updateTask({
        taskId: task.id,
        userId: user.id,
        updates: { completed: !task.completed },
      });

      setTasks((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (err) {
      setError(err.message || "Unable to update task");
      setTasks(snapshot);
    }
  };

  const handleSnooze = async (task) => {
    if (!task.dueDate || !user?.id) return;

    const current = new Date(task.dueDate);
    const next = new Date(current);
    next.setDate(current.getDate() + 1);
    const iso = next.toISOString();
    const snapshot = tasks;

    mutateTask(task.id, (prev) => ({ ...prev, due_date: iso }));

    try {
      const updated = await updateTask({
        taskId: task.id,
        userId: user.id,
        updates: { dueDate: iso.split("T")[0] },
      });

      setTasks((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (err) {
      setError(err.message || "Unable to update task deadline");
      setTasks(snapshot);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user?.id) return;

    const previous = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      await deleteTask({ taskId, userId: user.id });
    } catch (err) {
      setError(err.message || "Unable to delete task");
      setTasks(previous);
    }
  };

  const refreshTasks = async () => {
    if (!user?.id || !user?.roomId) return;
    setLoading(true);
    try {
      const data = await fetchTasks({ userId: user.id, roomId: user.roomId });
      setTasks(data ?? []);
    } catch (err) {
      setError(err.message || "Failed to refresh tasks");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.id || !user?.roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white/90 p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-900">Link your account</h1>
          <p className="mt-3 text-sm text-gray-600">
            Provide your Supabase user ID and room ID on the login screen to
            manage shared chores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-28">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold text-blue-600">
            <ClipboardList className="h-8 w-8 text-emerald-500" /> Room Tasks
          </h1>
          <p className="text-sm text-gray-500">
            Track chores for everyone in room {user.roomId}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <button
            type="button"
            onClick={refreshTasks}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <section className="mb-8 rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-md backdrop-blur">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <PlusCircle className="h-5 w-5 text-blue-600" /> Add a task
        </h2>
        <form onSubmit={handleCreateTask} className="grid gap-4 md:grid-cols-4">
          <input
            type="text"
            name="taskName"
            value={form.taskName}
            onChange={handleFormChange}
            placeholder="Task name"
            className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2"
          />
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleFormChange}
            className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            name="assignedUserId"
            value={form.assignedUserId}
            onChange={handleFormChange}
            className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            disabled={loadingRoommates}
          >
            <option value="">
              {loadingRoommates ? "Loading roommates..." : "Assign to... (optional)"}
            </option>
            {roommates.length === 0 && !loadingRoommates ? (
              <option value="" disabled>No roommates found</option>
            ) : (
              roommates.map((roommate) => (
                <option key={roommate.id} value={roommate.id}>
                  {roommate.name || roommate.email || `User ${roommate.id}`}
                </option>
              ))
            )}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="md:col-span-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Create task
          </button>
        </form>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-gray-100 bg-white/80 p-12 text-gray-500 shadow-md">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Loading tasks…</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white/80 p-8 text-center text-sm text-gray-500 shadow-md">
            No tasks yet. Create one to get started!
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              assignedTo={task.assignedTo || "Unassigned"}
              dueDate={task.dueDate}
              completed={task.completed}
              auraAwarded={task.auraAwarded}
              onToggle={() => handleToggleCompleted(task)}
              onSnooze={task.dueDate ? () => handleSnooze(task) : undefined}
              onDelete={() => handleDeleteTask(task.id)}
              onChangePriority={undefined}
            />
          ))
        )}
      </section>
    </div>
  );
};

export default Tasks;
