"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, ChevronDown, Crown, Home as HomeIcon } from "lucide-react";
import RoommateCard from "../../../components/RoommateCard";
import PieChart from "../../../components/PieChart";
import { useAuth } from "../../../context/AuthContext";

const CHART_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

type TaskRecord = {
  id: string;
  task_name: string;
  completed: boolean;
  due_date: string | null;
  user_id: string | null;
  aura_awarded?: number | null;
};

type LeaderboardEntry = {
  id: string;
  name: string | null;
  email: string | null;
  aura_points: number | null;
  rank: number;
};

type NormalizedTask = {
  id: string;
  userId: string | null;
  name: string;
  completed: boolean;
  dueDate: string | null;
  assignedTo: string;
  auraAwarded: number;
};

const formatDueDate = (dueDate: string | null) => {
  if (!dueDate) return "No due date";

  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`;
  if (diffDays <= 7) return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const HomePage = () => {
  const { user, roomId, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (signal: AbortSignal) => {
    if (!user?.id || !roomId) {
      setTasks([]);
      setLeaders([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ userId: user.id, roomId });
      const [tasksResponse, leaderboardResponse] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`, { signal }),
        fetch(`/api/leaderboard?${params.toString()}&limit=10`, { signal }),
      ]);

      const tasksPayload = await tasksResponse.json();
      const leaderboardPayload = await leaderboardResponse.json();

      if (!tasksResponse.ok) {
        throw new Error(tasksPayload?.error ?? "Failed to load tasks");
      }
      if (!leaderboardResponse.ok) {
        throw new Error(leaderboardPayload?.error ?? "Failed to load leaderboard");
      }

      setTasks((tasksPayload?.data as TaskRecord[]) ?? []);
      setLeaders((leaderboardPayload?.data as LeaderboardEntry[]) ?? []);
    } catch (err) {
      if (signal.aborted) return;
      console.error("Dashboard load failed", err);
      setError(err instanceof Error ? err.message : "Unable to load dashboard data");
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [roomId, user?.id]);

  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [authLoading, fetchDashboardData]);

  const leaderboardMap = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    leaders.forEach((entry) => {
      if (entry?.id) {
        map.set(entry.id, entry);
      }
    });
    return map;
  }, [leaders]);

  const normalizedTasks = useMemo<NormalizedTask[]>(() => {
    return tasks.map((task) => {
      const assignedEntry = task.user_id ? leaderboardMap.get(task.user_id) : null;
      const assignedName = assignedEntry?.name || assignedEntry?.email || task.user_id || "Unassigned";

      return {
        id: task.id,
        userId: task.user_id,
        name: task.task_name,
        completed: task.completed,
        dueDate: task.due_date,
        assignedTo: assignedName,
        auraAwarded: task.aura_awarded ?? 0,
      };
    });
  }, [tasks, leaderboardMap]);

  const myPendingTasks = useMemo(() => {
    return normalizedTasks
      .filter((task) => task.userId === user?.id && !task.completed)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [normalizedTasks, user?.id]);

  const stats = useMemo(() => {
    const total = normalizedTasks.length;
    const completed = normalizedTasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const overdue = normalizedTasks.filter((task) => {
      if (!task.dueDate || task.completed) return false;
      const due = new Date(task.dueDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return due < now;
    }).length;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [normalizedTasks]);

  const chartData = useMemo(() => [
    { name: "Completed", value: stats.completed },
    { name: "Pending", value: Math.max(stats.pending - stats.overdue, 0) },
    { name: "Overdue", value: stats.overdue },
  ], [stats]);

  const dormMaster = leaders[0] ?? null;

  const handleTaskStatusChange = async (taskId: string, status: "progress" | "done") => {
    if (!user?.id) return;

    const updates = status === "done" ? { completed: true } : { completed: false };

    setUpdatingTaskId(taskId);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, userId: user.id, updates }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to update task status");
      }

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, completed: updates.completed } : task))
      );
    } catch (err) {
      console.error("Failed to update task status", err);
      setError(err instanceof Error ? err.message : "Failed to update task status");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (!user?.id || !roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white/90 p-8 text-center shadow-lg">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <HomeIcon className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Join or create a room</h1>
          <p className="mt-3 text-sm text-gray-600">
            Link your Supabase user to a room to unlock the shared dashboard and chore tracking tools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-28">
      <header className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-600">Home Duty</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-emerald-600">{user?.email ?? "Roommate"}</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white/80 px-4 py-2 text-sm text-gray-600 shadow-sm">
          Weekly completion rate: <span className="font-semibold text-emerald-600">{stats.completionRate}%</span>
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : null}

      <section className="mb-8 rounded-3xl border border-blue-200 bg-white/80 p-6 shadow-md backdrop-blur">
        <div className="mb-5 flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">My Pending Tasks</h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading your tasks...</p>
        ) : myPendingTasks.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No pending tasks! You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myPendingTasks.map((task) => {
              const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-xl border-2 p-4 transition ${
                    isOverdue
                      ? "border-red-200 bg-red-50/50"
                      : "border-blue-100 bg-gradient-to-r from-blue-50/50 to-white hover:shadow-md"
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <span className={`flex items-center gap-1 ${isOverdue ? "font-semibold text-red-600" : ""}`}>
                        <Calendar className="h-4 w-4" /> {formatDueDate(task.dueDate)}
                      </span>
                      {task.auraAwarded > 0 ? (
                        <span className="flex items-center gap-1 text-purple-600">
                          <Crown className="h-4 w-4" /> {task.auraAwarded} aura
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative ml-4">
                    <select
                      value=""
                      onChange={(event) => handleTaskStatusChange(task.id, event.target.value as "progress" | "done")}
                      disabled={updatingTaskId === task.id}
                      className="appearance-none rounded-lg border-2 border-blue-300 bg-white px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {updatingTaskId === task.id ? "Updating..." : "Update status"}
                      </option>
                      <option value="progress">Mark as In Progress</option>
                      <option value="done">Mark as Done</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-md backdrop-blur">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">Roommates</h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading leaderboard...</p>
          ) : leaders.length ? (
            <div className="grid grid-cols-2 gap-4">
              {leaders.slice(0, 6).map((entry) => (
                <RoommateCard
                  key={entry.id}
                  name={entry.name || entry.email || "Roommate"}
                  aura={entry.aura_points ?? 0}
                  role={entry.rank === 1 ? "Dorm Master" : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No roommates found yet. Invite others to join your room.</p>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-md backdrop-blur">
          <PieChart data={chartData} colors={CHART_COLORS} title="Weekly Tasks Overview" />
        </section>

        <section className="flex flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 to-emerald-50 p-6 text-center shadow-inner">
          {dormMaster ? (
            <>
              <Crown className="mb-3 h-10 w-10 text-yellow-500" />
              <h2 className="text-lg font-bold text-gray-800">Dorm Master ??</h2>
              <p className="text-3xl font-extrabold text-emerald-700">{dormMaster.name || dormMaster.email}</p>
              <p className="mt-1 text-sm text-gray-600">
                Aura: {dormMaster.aura_points ?? 0} points (rank {dormMaster.rank})
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Complete chores to climb the leaderboard and unlock the Dorm Master crown.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
